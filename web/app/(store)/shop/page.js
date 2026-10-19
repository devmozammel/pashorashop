import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ShopClient from "./ShopClient";
import { Loader2 } from "lucide-react";

export async function generateMetadata(props) {
    const searchParams = await props.searchParams;
    const categoryId = searchParams.categoryId;
    const subGroupId = searchParams.subGroupId;
    const subItemId = searchParams.subItemId;

    let title = "Shop All Products | Pashora Shop";
    let description = "Explore all products at Pashora Shop. Authentic and trending store in Bangladesh.";
    let canonical = "/shop";

    try {
        if (subItemId) {
            const subItem = await prisma.subcategoryItem.findUnique({
                where: { id: subItemId },
                include: { group: true }
            });
            if (subItem) {
                title = `${subItem.name} - ${subItem.group?.name || ""} | Pashora Shop`;
                description = `Browse our exclusive ${subItem.name} collection at Pashora Shop. Best price and quality guaranteed.`;
                canonical = `/shop?categoryId=${categoryId}&subGroupId=${subGroupId}&subItemId=${subItemId}`;
            }
        } else if (subGroupId) {
            const subGroup = await prisma.subcategoryGroup.findUnique({
                where: { id: subGroupId },
                include: { category: true }
            });
            if (subGroup) {
                title = `${subGroup.name} - ${subGroup.category?.name || ""} | Pashora Shop`;
                description = `Browse our exclusive ${subGroup.name} collection at Pashora Shop. Best price and quality guaranteed.`;
                canonical = `/shop?categoryId=${categoryId}&subGroupId=${subGroupId}`;
            }
        } else if (categoryId) {
            const category = await prisma.category.findUnique({ where: { id: categoryId } });
            if (category) {
                title = `${category.name} Collection | Pashora Shop`;
                description = `Browse our exclusive ${category.name} collection at Pashora Shop. Best price and quality guaranteed.`;
                canonical = `/shop?categoryId=${categoryId}`;
            }
        }
    } catch (e) {
        console.error("Metadata Generation Error:", e.message);
    }

    return {
        title,
        description,
        alternates: {
            canonical
        }
    };
}

export default async function ShopPage(props) {
    const searchParams = await props.searchParams;
    const categoryId = searchParams.categoryId;
    const subGroupId = searchParams.subGroupId;
    const subItemId = searchParams.subItemId;

    let itemListJsonLd = null;
    let breadcrumbListJsonLd = null;

    try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";
        
        let activeCategory = null;
        let activeGroup = null;
        let activeItem = null;

        // Fetch hierarchy info to build breadcrumbs and item list
        if (categoryId) {
            activeCategory = await prisma.category.findUnique({ where: { id: categoryId } });
        }
        if (subGroupId) {
            activeGroup = await prisma.subcategoryGroup.findUnique({ where: { id: subGroupId } });
        }
        if (subItemId) {
            activeItem = await prisma.subcategoryItem.findUnique({ where: { id: subItemId } });
        }

        // Determine products query based on deepest active level
        let whereQuery = { isActive: true };
        let listName = "All Products";

        if (subItemId) {
            whereQuery.subcategoryItemId = subItemId;
            listName = activeItem ? `${activeItem.name} Collection` : "Products";
        } else if (subGroupId) {
            whereQuery.subcategoryGroupId = subGroupId;
            listName = activeGroup ? `${activeGroup.name} Collection` : "Products";
        } else if (categoryId) {
            whereQuery.categoryId = categoryId;
            listName = activeCategory ? `${activeCategory.name} Collection` : "Products";
        }

        const products = await prisma.product.findMany({
            where: whereQuery,
            select: { name: true, slug: true },
            take: 20
        });

        // 1. ItemList Structured Data
        itemListJsonLd = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": listName,
            "numberOfItems": products.length,
            "itemListElement": products.map((p, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "url": `${siteUrl}/product/${p.slug}`,
                "name": p.name
            }))
        };

        // 2. BreadcrumbList Structured Data
        const breadcrumbElements = [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl
            }
        ];

        let currentPosition = 2;

        if (activeCategory) {
            breadcrumbElements.push({
                "@type": "ListItem",
                "position": currentPosition++,
                "name": activeCategory.name,
                "item": `${siteUrl}/shop?categoryId=${activeCategory.id}`
            });
        }

        if (activeGroup && activeCategory) {
            breadcrumbElements.push({
                "@type": "ListItem",
                "position": currentPosition++,
                "name": activeGroup.name,
                "item": `${siteUrl}/shop?categoryId=${activeCategory.id}&subGroupId=${activeGroup.id}`
            });
        }

        if (activeItem && activeGroup && activeCategory) {
            breadcrumbElements.push({
                "@type": "ListItem",
                "position": currentPosition++,
                "name": activeItem.name,
                "item": `${siteUrl}/shop?categoryId=${activeCategory.id}&subGroupId=${activeGroup.id}&subItemId=${activeItem.id}`
            });
        }

        breadcrumbListJsonLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbElements
        };

    } catch (e) {
        console.error("SEO JSON-LD Error:", e.message);
    }

    return (
        <>
            {itemListJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                />
            )}
            {breadcrumbListJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
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

