import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ShopClient from "./ShopClient";
import { Loader2 } from "lucide-react";

export async function generateMetadata(props) {
    const searchParams = await props.searchParams;
    const categoryId = searchParams.categoryId;

    if (categoryId) {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (category) {
            return {
                title: `${category.name} Collection | Authentic Bazar`,
                description: `Browse our exclusive ${category.name} collection at Authentic Bazar. Best price and quality guaranteed.`,
                alternates: {
                    canonical: `/shop?categoryId=${categoryId}`
                }
            };
        }
    }

    return {
        title: "Shop All Products | Authentic Bazar",
        description: "Explore all products at Authentic Bazar. Authentic and premium fashion store in Bangladesh.",
        alternates: {
            canonical: "/shop"
        }
    };
}

export default async function ShopPage(props) {
    const searchParams = await props.searchParams;
    const categoryId = searchParams.categoryId;

    let itemListJsonLd = null;

    if (categoryId) {
        try {
            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            const products = await prisma.product.findMany({
                where: { categoryId: categoryId, isActive: true },
                select: { name: true, slug: true },
                take: 20
            });

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";

            itemListJsonLd = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": category ? `${category.name} Collection` : "All Products",
                "numberOfItems": products.length,
                "itemListElement": products.map((p, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "url": `${siteUrl}/product/${p.slug}`,
                    "name": p.name
                }))
            };
        } catch (e) {
            console.error("SEO JSON-LD Error:", e.message);
        }
    }

    return (
        <>
            {itemListJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                />
            )}
            <Suspense fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            }>
                <ShopClient />
            </Suspense>
        </>
    );
}
