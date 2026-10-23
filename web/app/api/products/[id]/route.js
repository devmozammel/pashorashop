import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: params.id },
            include: {
                category: true,
                productImages: { orderBy: { sortOrder: 'asc' } },
                variants: {
                    include: { images: true }
                }
            },
        });
        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        // Check for active Flash Sale pricing
        const now = new Date();
        const activeFlashSaleItem = await prisma.flashSaleItem.findFirst({
            where: {
                productId: product.id,
                isActive: true,
                flashSale: {
                    isActive: true,
                    startsAt: { lte: now },
                    endsAt: { gte: now }
                }
            }
        });

        if (activeFlashSaleItem) {
            product.salePrice = activeFlashSaleItem.salePrice;
            product.discountPrice = activeFlashSaleItem.salePrice;
        }

        return NextResponse.json(product);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const { variants: newVariants, id, ...data } = body;

        // Fetch current product state for automations
        const currentProduct = await prisma.product.findUnique({
            where: { id: params.id },
            include: { variants: true }
        });

        // Transaction to update product and replace variants
        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.update({
                where: { id: params.id },
                data: data
            });

            if (newVariants) {
                // Delete existing and create new variants
                // Note: This is destructive for variant IDs, better to upsert in future
                await tx.productVariant.deleteMany({ where: { productId: params.id } });

                // Create variants individually to handle nested relations easily
                for (const v of newVariants) {
                    await tx.productVariant.create({
                        data: {
                            productId: params.id,
                            size: v.size,
                            color: v.color,
                            priceAdjustment: v.priceAdjustment || 0,
                            stock: parseInt(v.stock || 0),
                            sku: v.sku,
                            images: v.images && v.images.length > 0 ? {
                                create: v.images.map((url, i) => ({
                                    url,
                                    sortOrder: i
                                }))
                            } : undefined
                        }
                    });
                }
            }
            return p;
        });

        // Trigger Automations (Fire and forget)
        // 1. Price Drop
        const oldPrice = parseFloat(currentProduct.price);
        const newPrice = parseFloat(data.price);
        if (newPrice < oldPrice) {
            import("@/lib/automations").then(mod =>
                mod.checkPriceDrop(product.id, newPrice, oldPrice)
            ).catch(console.error);
        }

        // 2. Back in Stock
        const oldStock = currentProduct.stock;
        const newStock = parseInt(data.stock);
        if (oldStock <= 0 && newStock > 0) {
            import("@/lib/automations").then(mod =>
                mod.checkBackInStock(product.id, newStock, oldStock)
            ).catch(console.error);
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        await prisma.product.delete({ where: { id: params.id } });
        return NextResponse.json({ message: "Product deleted" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
