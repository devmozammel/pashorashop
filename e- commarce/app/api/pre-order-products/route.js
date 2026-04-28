import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { isPreOrder: true, isActive: true },
            include: {
                productImages: { orderBy: { sortOrder: 'asc' } },
                variants: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
