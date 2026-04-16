import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeImageUrls } from "@/lib/productImages";
import { createAuditLog } from "@/lib/audit";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

// GET: List all products for admin
export async function GET(req) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const products = await prisma.product.findMany({
            include: {
                category: { select: { id: true, name: true } },
                variants: true,
                productImages: { orderBy: { sortOrder: 'asc' }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

// Sanitize and validate variants server-side
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
        .filter(v => v.size || v.color); // Remove variants with BOTH empty
}

export async function POST(req) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await req.json();
        const data = productSchema.parse(body);

        let slug = data.slug;
        if (!slug) {
            slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
        }

        const finalCategoryId = (data.categoryId && data.categoryId !== "") ? data.categoryId : null;
        const cleanImages = sanitizeImageUrls(data.images);
        const cleanVariants = sanitizeVariants(data.variants);

        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    name: data.name,
                    slug: uniqueSlug,
                    description: sanitizeHtml(data.description),
                    price: data.price,
                    salePrice: data.salePrice,
                    discountPrice: data.salePrice,
                    stock: data.stock,
                    categoryId: finalCategoryId,
                    subcategoryGroupId: (data.subcategoryGroupId && data.subcategoryGroupId !== "") ? data.subcategoryGroupId : null,
                    subcategoryItemId: (data.subcategoryItemId && data.subcategoryItemId !== "") ? data.subcategoryItemId : null,
                    isActive: data.isActive ?? true,
                    isFeatured: data.isFeatured ?? false,
                    isNewArrival: data.isNewArrival ?? false,
                    isFlashSale: data.isFlashSale ?? false,
                    paymentMethods: data.paymentMethods ?? "BOTH",
                    images: cleanImages,
                }
            });

            if (cleanImages.length > 0) {
                await tx.productImage.createMany({
                    data: cleanImages.map((url, idx) => ({
                        productId: p.id,
                        url,
                        sortOrder: idx
                    }))
                });
            }

            if (cleanVariants.length > 0) {
                await tx.productVariant.createMany({
                    data: cleanVariants.map(v => ({
                        productId: p.id,
                        size: v.size,
                        color: v.color,
                        stock: v.stock,
                        priceAdjustment: v.priceAdjustment,
                        isActive: v.isActive,
                        sku: v.sku
                    }))
                });
            }

            return p;
        });

        // Audit Log
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
            entityType: "Product",
            entityId: product.id,
            meta: { name: product.name }
        });

        revalidatePath('/', 'layout');
        revalidatePath('/admin/products');

        // Custom cache tag for mega menu (if we implement that tag in the fetch)
        // revalidateTag('mega-menu'); 

        return NextResponse.json(product);
    } catch (error) {
        console.error("Product Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
