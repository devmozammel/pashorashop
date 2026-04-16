import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeImageUrls } from "@/lib/productImages";
import { createAuditLog } from "@/lib/audit";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    slug: z.string().optional().or(z.literal("")),
    description: z.string().optional(),
    price: z.number().int().min(0),
    salePrice: z.number().int().min(0).nullable().optional(),
    stock: z.number().int().min(0),
    categoryId: z.string().optional().nullable().or(z.literal("")),
    subcategoryGroupId: z.string().optional().nullable().or(z.literal("")),
    subcategoryItemId: z.string().optional().nullable().or(z.literal("")),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isFlashSale: z.boolean().optional(),
    paymentMethods: z.enum(["BOTH", "COD", "ONLINE"]).optional(),
    images: z.array(z.string()).optional(),
    variants: z.array(z.object({
        id: z.string().optional(),
        size: z.string().optional().or(z.literal("")),
        color: z.string().optional().or(z.literal("")),
        priceAdjustment: z.number().int().default(0),
        stock: z.number().int().min(0).default(0),
        isActive: z.boolean().optional().default(true),
        sku: z.string().optional().or(z.literal(""))
    })).optional()
});

// Helper: find product by id or slug
async function findProductByIdOrSlug(idOrSlug, include) {
    let product = await prisma.product.findUnique({
        where: { id: idOrSlug },
        include
    });
    if (!product) {
        product = await prisma.product.findUnique({
            where: { slug: idOrSlug },
            include
        });
    }
    return product;
}

// Sanitize variants server-side
function sanitizeVariants(variants) {
    if (!Array.isArray(variants)) return [];
    return variants
        .map(v => ({
            ...v,
            size: (v.size || "").trim() || null,
            color: (v.color || "").trim() || null,
            sku: (v.sku || "").trim() || null,
            stock: Number(v.stock || 0),
            priceAdjustment: Number(v.priceAdjustment || 0),
            isActive: v.isActive !== false
        }))
        .filter(v => v.size || v.color);
}

export async function GET(req, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;

        const product = await findProductByIdOrSlug(id, {
            productImages: { orderBy: { sortOrder: 'asc' } },
            variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
            category: true
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await req.json();
        const data = productSchema.parse(body);
        const { id } = await props.params;

        // Resolve actual product
        const existing = await findProductByIdOrSlug(id, null);
        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        const productId = existing.id;

        let slug = data.slug;
        if (!slug) {
            slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        // Ensure slug is unique (ignore self)
        const slugConflict = await prisma.product.findFirst({
            where: { slug, NOT: { id: productId } }
        });
        if (slugConflict) {
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }

        const finalCategoryId = (data.categoryId && data.categoryId !== "") ? data.categoryId : null;
        const cleanImages = sanitizeImageUrls(data.images);
        const cleanVariants = sanitizeVariants(data.variants);

        const product = await prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({
                where: { id: productId },
                data: {
                    name: data.name,
                    slug,
                    description: sanitizeHtml(data.description),
                    price: data.price,
                    salePrice: data.salePrice,
                    discountPrice: data.salePrice,
                    stock: data.stock,
                    categoryId: finalCategoryId,
                    subcategoryGroupId: (data.subcategoryGroupId && data.subcategoryGroupId !== "") ? data.subcategoryGroupId : null,
                    subcategoryItemId: (data.subcategoryItemId && data.subcategoryItemId !== "") ? data.subcategoryItemId : null,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isNewArrival: data.isNewArrival,
                    isFlashSale: data.isFlashSale,
                    paymentMethods: data.paymentMethods,
                    images: cleanImages
                }
            });

            // Recreate images
            await tx.productImage.deleteMany({ where: { productId } });
            if (cleanImages.length > 0) {
                await tx.productImage.createMany({
                    data: cleanImages.map((url, idx) => ({
                        productId,
                        url,
                        sortOrder: idx
                    }))
                });
            }

            // Recreate variants
            await tx.productVariant.deleteMany({ where: { productId } });
            if (cleanVariants.length > 0) {
                await tx.productVariant.createMany({
                    data: cleanVariants.map(v => ({
                        productId,
                        size: v.size,
                        color: v.color,
                        stock: v.stock,
                        priceAdjustment: v.priceAdjustment,
                        isActive: v.isActive,
                        sku: v.sku
                    }))
                });
            }

            return updated;
        });

        // Audit Log
        // Audit Log
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "Product",
            entityId: product.id,
            meta: { name: product.name }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/admin/products');

        // revalidateTag('mega-menu');

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

// PATCH: Lightweight stock-only update (used by Inventory page)
export async function PATCH(req, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;
        const body = await req.json();
        const newStock = Number(body.stock);

        if (isNaN(newStock) || newStock < 0) {
            return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
        }

        const existing = await findProductByIdOrSlug(id, null);
        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const updated = await prisma.product.update({
            where: { id: existing.id },
            data: { stock: newStock },
        });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "Product",
            entityId: updated.id,
            meta: { name: updated.name, stockChanged: { from: existing.stock, to: newStock } },
        });

        revalidatePath("/admin/inventory");

        return NextResponse.json({ success: true, stock: updated.stock });
    } catch (error) {
        console.error("Product PATCH (stock) Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;

        const existing = await findProductByIdOrSlug(id, null);
        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        await prisma.product.delete({ where: { id: existing.id } });

        // Audit Log
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "DELETE",
            entityType: "Product",
            entityId: existing.id,
            meta: { name: existing.name }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/admin/products');

        // revalidateTag('mega-menu');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Product Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
