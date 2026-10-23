import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { flashSaleItemSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { z } from "zod";


export const dynamic = "force-dynamic";

// Schema for bulk array
const bulkItemsSchema = z.object({
    flashSaleId: z.string().min(1),
    items: z.array(flashSaleItemSchema)
});

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();

        // Check if bulk or single
        if (body.items && Array.isArray(body.items)) {
            // Bulk mode
            const { flashSaleId, items } = bulkItemsSchema.parse(body);

            const results = [];
            const errors = [];

            // Process sequentially to handle validation/logic per item
            for (const itemData of items) {
                try {
                    const product = await prisma.product.findUnique({ where: { id: itemData.productId } });
                    if (!product) {
                        errors.push({ productId: itemData.productId, error: "Product not found" });
                        continue;
                    }
                    if (itemData.salePrice >= product.price) {
                        errors.push({ productId: itemData.productId, error: "Sale price must be lower than regular price" });
                        continue;
                    }

                    // Upsert or Ignore if exists
                    // Since we want to Avoid "Unique constraint", check first
                    const existing = await prisma.flashSaleItem.findUnique({
                        where: {
                            flashSaleId_productId: { flashSaleId, productId: itemData.productId }
                        }
                    });

                    if (existing) {
                        // Update price if exists? Or skip? Let's update.
                        const updated = await prisma.flashSaleItem.update({
                            where: { id: existing.id },
                            data: { salePrice: itemData.salePrice, isActive: itemData.isActive }
                        });
                        results.push(updated);
                    } else {
                        const created = await prisma.flashSaleItem.create({
                            data: {
                                flashSaleId,
                                productId: itemData.productId,
                                salePrice: itemData.salePrice,
                                isActive: itemData.isActive
                            }
                        });
                        results.push(created);
                    }

                } catch (e) {
                    errors.push({ productId: itemData.productId, error: e.message });
                }
            }

            return NextResponse.json({ ok: true, data: results, errors });

        } else {
            // Single mode (Legacy support)
            const { flashSaleId, ...itemData } = body;
            if (!flashSaleId) return NextResponse.json({ ok: false, message: "Flash Sale ID required" }, { status: 400 });

            const data = flashSaleItemSchema.parse(itemData);

            const product = await prisma.product.findUnique({
                where: { id: data.productId },
            });

            if (!product) {
                return NextResponse.json({ ok: false, message: "Product not found" }, { status: 404 });
            }

            if (data.salePrice >= product.price) {
                return NextResponse.json({ ok: false, message: "Sale price must be lower than regular price" }, { status: 400 });
            }

            const existing = await prisma.flashSaleItem.findUnique({
                where: {
                    flashSaleId_productId: {
                        flashSaleId,
                        productId: data.productId
                    }
                }
            });

            if (existing) {
                return NextResponse.json({ ok: false, message: "Product already in this flash sale" }, { status: 409 });
            }

            const item = await prisma.flashSaleItem.create({
                data: {
                    flashSaleId,
                    productId: data.productId,
                    salePrice: data.salePrice,
                    isActive: data.isActive,
                },
            });

            return NextResponse.json({ ok: true, data: item }, { status: 201 });
        }

    } catch (error) {
        return apiError(error, "Add Flash Sale Item");
    }
}
