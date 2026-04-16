import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";
import ProductGrid from "@/components/storefront/ProductGrid";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(props) {
    const params = await props.params;
    const { slug } = params;

    if (!slug) return { title: "Category Not Found" };

    const category = await prisma.category.findUnique({
        where: { slug }
    });

    if (!category) return { title: "Category Not Found" };

    return {
        title: `${category.name} | Fashion House`,
        description: `Shop our ${category.name} collection.`,
    };
}

// Recursively get all category IDs (self + descendants)
function getCategoryIds(category) {
    let ids = [category.id];
    if (category.children) {
        for (const child of category.children) {
            ids = ids.concat(getCategoryIds(child));
        }
    }
    return ids;
}

export default async function CategoryPage(props) {
    const params = await props.params;
    const { slug } = params;

    if (!slug) notFound();

    // Fetch category with subcategory groups
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            subcategoryGroups: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    });

    if (!category || !category.isActive) {
        notFound();
    }

    // Fetch products for ItemList schema
    const products = await prisma.product.findMany({
        where: { categoryId: category.id, isActive: true },
        select: { name: true, slug: true },
        take: 20
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://authenticbazar.com";
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `${category.name} Collection`,
        "numberOfItems": products.length,
        "itemListElement": products.map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `${siteUrl}/product/${p.slug}`,
            "name": p.name
        }))
    };

    // Note: Next.js 15 redirect still allows rendering metadata/scripts if handled carefully, 
    // but usually, it's safer to provide schema in the layout or on the results page.
    // However, for SEO crawlers that follow 307s, they see the target page.
    // We will redirect to shop, but keep the category info.

    redirect(`/shop?categoryId=${category.id}`);
}
