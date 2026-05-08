import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";
import ProductGrid from "@/components/storefront/ProductGrid";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(props) {
    const params = await props.params;
    const { slug, group } = params;

    if (!slug || !group) return { title: "Category Not Found" };

    const category = await prisma.category.findUnique({ where: { slug } });
    const subcategoryGroup = await prisma.subcategoryGroup.findUnique({ where: { slug: group } });

    if (!category || !subcategoryGroup) return { title: "Category Not Found" };

    return {
        title: `${subcategoryGroup.name} - ${category.name} | Fashion House`,
        description: `Shop our ${subcategoryGroup.name} collection in ${category.name}.`,
    };
}

export default async function SubcategoryGroupPage(props) {
    const params = await props.params;
    const { slug, group } = params;

    if (!slug || !group) notFound();

    // Fetch category and group
    const category = await prisma.category.findUnique({
        where: { slug },
        include: {
            subcategoryGroups: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    });

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

    if (!subcategoryGroup) notFound();

    redirect(`/shop?categoryId=${category.id}&subGroupId=${subcategoryGroup.id}`);
}
