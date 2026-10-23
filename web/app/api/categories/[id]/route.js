import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export const dynamic = "force-dynamic";

// GET public category details
export async function GET(request, { params }) {
    try {
        const category = await prisma.category.findUnique({
            where: { id: params.id },
            include: {
                subcategories: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        items: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' }
                        }
                    }
                },
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT/DELETE removed. Public routes should not allow modification.
// Admin modifications go through /api/admin/categories/[id]
