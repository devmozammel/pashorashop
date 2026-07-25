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
    sku: z.string().optional().nullable().or(z.literal("")),
    description: z.string().optional(),
    sizeChart: z.string().optional().nullable(),
    price: z.number().int().nonnegative(),
    salePrice: z.number().int().nonnegative().optional().nullable(),
    stock: z.number().int().nonnegative().default(0),
    categoryId: z.string().optional().nullable(),
    subcategoryGroupId: z.string().optional().nullable(),
    subcategoryItemId: z.string().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isHot: z.boolean().optional().default(false),
    isNewArrival: z.boolean().optional().default(false),
    isFlashSale: z.boolean().optional().default(false),
    paymentMethods: z.enum(["BOTH", "COD", "ONLINE"]).optional().default("BOTH"),
    affiliateCommissionRate: z.number().int().min(0).optional(),
    affiliateCommissionType: z.enum(["PERCENT", "FIXED"]).optional(),
    costPrice: z.number().int().nonnegative().optional().nullable(),
    metaTitle: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
    metaKeywords: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    isPreOrder: z.boolean().optional().default(false),
    expectedDeliveryText: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    variants: z.array(z.object({
        id: z.string().optional(),
        size: z.string().optional().or(z.literal("")),
        color: z.string().optional().or(z.literal("")),
        priceAdjustment: z.number().int().default(0),
        price: z.number().int().nonnegative().optional().nullable(),
        salePrice: z.number().int().nonnegative().optional().nullable(),
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
            price: v.price !== undefined && v.price !== null && v.price !== "" ? Number(v.price) : null,
            salePrice: v.salePrice !== undefined && v.salePrice !== null && v.salePrice !== "" ? Number(v.salePrice) : null,
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
                    sku: (data.sku || "").trim() || null,
                    description: sanitizeHtml(data.description),
                    sizeChart: sanitizeHtml(data.sizeChart),
                    price: data.price,
                    salePrice: data.salePrice,
                    discountPrice: data.salePrice,
                    costPrice: data.costPrice,
                    stock: data.stock,
                    categoryId: finalCategoryId,
                    subcategoryGroupId: (data.subcategoryGroupId && data.subcategoryGroupId !== "") ? data.subcategoryGroupId : null,
                    subcategoryItemId: (data.subcategoryItemId && data.subcategoryItemId !== "") ? data.subcategoryItemId : null,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isHot: data.isHot,
                    isNewArrival: data.isNewArrival,
                    isFlashSale: data.isFlashSale,
                    paymentMethods: data.paymentMethods,
                    affiliateCommissionRate: data.affiliateCommissionRate ?? 0,
                    affiliateCommissionType: data.affiliateCommissionType ?? "PERCENT",
                    metaTitle: data.metaTitle,
                    metaDescription: data.metaDescription,
                    metaKeywords: data.metaKeywords,
                    videoUrl: data.videoUrl,
                    isPreOrder: data.isPreOrder ?? false,
                    expectedDeliveryText: data.expectedDeliveryText,
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
                        price: v.price,
                        salePrice: v.salePrice,
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

// PATCH: Lightweight update for stock or isHot toggle
export async function PATCH(req, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;
        const body = await req.json();

        const existing = await findProductByIdOrSlug(id, null);
        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const updateData = {};

        if (body.stock !== undefined) {
            const newStock = Number(body.stock);
            if (isNaN(newStock) || newStock < 0) {
                return NextResponse.json({ error: "Invalid stock value" }, { status: 400 });
            }
            updateData.stock = newStock;
        }

        if (body.isHot !== undefined) {
            updateData.isHot = Boolean(body.isHot);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const updated = await prisma.product.update({
            where: { id: existing.id },
            data: updateData,
        });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "Product",
            entityId: updated.id,
            meta: { name: updated.name, updateData },
        });

        revalidatePath("/", "layout");
        revalidatePath("/admin/products");
        revalidatePath("/admin/inventory");

        return NextResponse.json({ success: true, product: updated });
    } catch (error) {
        console.error("Product PATCH Error:", error);
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
