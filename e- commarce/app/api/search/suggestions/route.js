import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 1) {
        return NextResponse.json({ products: [], categories: [] });
    }

    try {
        // Split into individual words for multi-word matching
        const searchTerms = query.split(/\s+/).filter(t => t.length > 0);

        // Each word must match in at least one product field
        const wordConditions = searchTerms.map(term => ({
            OR: [
                { name: { contains: term } },
                { shortDesc: { contains: term } },
                { description: { contains: term } },
                { sku: { contains: term } },
                { slug: { contains: term } },
                { category: { name: { contains: term } } },
                { subcategoryGroup: { name: { contains: term } } },
            ]
        }));

        const [products, categories] = await Promise.all([
            prisma.product.findMany({
                where: {
                    AND: [
                        { isActive: true },
                        ...wordConditions
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    salePrice: true,
                    discountPrice: true,
                    images: true,
                    productImages: {
                        orderBy: { sortOrder: 'asc' },
                        take: 1,
                        select: { url: true }
                    },
                    category: { select: { name: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 8
            }),

            prisma.category.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { slug: { contains: query } },
                    ],
                    isActive: true
                },
                select: { id: true, name: true, slug: true },
                take: 4
            })
        ]);

        return NextResponse.json({ products, categories });
    } catch (error) {
        console.error("Search suggestions error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
