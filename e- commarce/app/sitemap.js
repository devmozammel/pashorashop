import { prisma } from "@/lib/prisma";

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://authenticbazar.com";

    // Static Pages that don't need database
    const staticUrls = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
        { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/track`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    try {
        // 1. Fetch all products
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true }
        });

        const productUrls = products.map((p) => ({
            url: `${baseUrl}/product/${p.slug}`,
            lastModified: p.updatedAt,
            changeFrequency: 'daily',
            priority: 0.8,
        }));

        // 2. Fetch all categories
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true }
        });

        const categoryUrls = categories.map((c) => ({
            url: `${baseUrl}/category/${c.slug}`,
            lastModified: c.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        return [...staticUrls, ...productUrls, ...categoryUrls];
    } catch (error) {
        console.error("Sitemap generation failed (likely DB connection issue):", error.message);
        // Fallback to only static URLs so the build doesn't fail
        return staticUrls;
    }
}
