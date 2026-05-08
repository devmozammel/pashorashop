import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";
import ProductGrid from "@/components/storefront/ProductGrid";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(props) {
    const params = await props.params;
    const { slug, group, item } = params;

    if (!slug || !group || !item) return { title: "Item Not Found" };

    const category = await prisma.category.findUnique({ where: { slug } });
    const subcategoryGroup = await prisma.subcategoryGroup.findUnique({ where: { slug: group } });
    const subcategoryItem = await prisma.subcategoryItem.findUnique({ where: { slug: item } });

    if (!category || !subcategoryGroup || !subcategoryItem) return { title: "Item Not Found" };

    return {
        title: `${subcategoryItem.name} - ${subcategoryGroup.name} | Fashion House`,
        description: `Shop our ${subcategoryItem.name} collection.`,
    };
}

export default async function SubcategoryItemPage(props) {
    const params = await props.params;
    const { slug, group, item } = params;

    if (!slug || !group || !item) notFound();

    // Fetch hierarchy
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category || !category.isActive) notFound();

    const subcategoryGroup = await prisma.subcategoryGroup.findFirst({
        where: {
            slug: group,
            categoryId: category.id,
            isActive: true
        },
        include: {
            items: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    });
    if (!subcategoryGroup) notFound();

    const subcategoryItem = await prisma.subcategoryItem.findFirst({
        where: {
            slug: item,
            groupId: subcategoryGroup.id, // Corrected to use groupId
            isActive: true
        }
    });

    if (!subcategoryItem) notFound();

    if (!subcategoryItem) notFound();

    redirect(`/shop?categoryId=${category.id}&subGroupId=${subcategoryGroup.id}&subItemId=${subcategoryItem.id}`);
}
