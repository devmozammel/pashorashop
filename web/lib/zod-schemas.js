import { z } from "zod";

// --- Coupons ---
export const couponSchema = z.object({
    code: z.string().min(3).toUpperCase(),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: z.coerce.number().min(1),
    minOrderAmount: z.coerce.number().nonnegative().nullable(),
    maxUsage: z.coerce.number().positive().nullable(),
    startsAt: z.string().nullable().optional(), // Expect ISO string
    endsAt: z.string().nullable().optional(),   // Expect ISO string
    isActive: z.boolean().default(true),
    productId: z.string().nullable().optional(),
    userId: z.string().nullable().optional(),
});

// --- Flash Sale ---
export const flashSaleSchema = z.object({
    title: z.string().min(3),
    startsAt: z.string(), // ISO
    endsAt: z.string(),   // ISO
    isActive: z.boolean().default(true),
});

export const flashSaleItemSchema = z.object({
    productId: z.string(),
    salePrice: z.coerce.number().min(1),
    isActive: z.boolean().default(true),
});

// --- Pricing ---
export const pricingSchema = z.object({
    updates: z.array(
        z.object({
            id: z.string(),
            price: z.coerce.number().nonnegative(),
            salePrice: z.coerce.number().nonnegative().nullable(),
        })
    ),
});

// --- Homepage Config ---
export const homepageConfigSchema = z.object({
    heroTitle: z.string().nullable(),
    heroSubtitle: z.string().nullable(),
    heroButtonText: z.string().nullable(),
    heroButtonLink: z.string().nullable(),
    heroImageUrl: z.string().nullable().optional(),
    heroProductTitle: z.string().nullable().optional(),
    heroProductPrice: z.string().nullable().optional(),
    heroProductImage: z.string().nullable().optional(),
    heroProductLink: z.string().nullable().optional(),
    heroTheme: z.string().nullable().optional(),
    showFeatured: z.boolean().default(true),
    showNewArrivals: z.boolean().default(true),
    showTopSelling: z.boolean().default(true),
    showFlashSale: z.boolean().default(true),
});

// --- Order Status ---
export const orderStatusSchema = z.object({
    status: z.enum(["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
    note: z.string().optional(),
});
