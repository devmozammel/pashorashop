import { prisma } from "@/lib/prisma";

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";

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
            select: { id: true, updatedAt: true }
        });

        const categoryUrls = categories.map((c) => ({
            url: `${baseUrl}/shop?categoryId=${c.id}`,
            lastModified: c.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.6,
        }));

        // 3. Fetch all active landing pages
        const landingPages = await prisma.landingPage.findMany({
            where: { isActive: true },
            select: { slug: true, updatedAt: true }
        });

        const lpUrls = landingPages.map((lp) => ({
            url: `${baseUrl}/lp/${lp.slug}`,
            lastModified: lp.updatedAt,
            changeFrequency: 'daily',
            priority: 0.8,
        }));

        return [...staticUrls, ...productUrls, ...categoryUrls, ...lpUrls];
    } catch (error) {
        console.error("Sitemap generation failed (likely DB connection issue):", error.message);
        // Fallback to only static URLs so the build doesn't fail
        return staticUrls;
    }
}
