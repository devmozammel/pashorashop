
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: {
                isActive: true,
                showInMegaMenu: true,
            },
            include: {
                subcategoryGroups: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        items: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' }
                        }
                    }
                }
            },
            orderBy: {
                sortOrder: 'asc',
            },
        });

        // Structure for frontend if needed, or return as is
        // The frontend likely expects: { name, slug, groups: [ { title, items: [ { name, slug } ] } ] }
        // Our DB structure matches this: category.subcategoryGroups -> group.items

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Mega Menu API Error:", error);
        return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
    }
}
