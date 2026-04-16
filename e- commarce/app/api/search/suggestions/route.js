
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json({ products: [], categories: [] });
    }

    try {
        // Advanced Multi-word Search Logic
        const searchTerms = query.split(' ').filter(term => term.trim().length > 0);

        // Create an array of conditions for EACH search term
        const searchConditions = searchTerms.map(term => ({
            OR: [
                { name: { contains: term } },
                { description: { contains: term } },
                { category: { name: { contains: term } } }
            ]
        }));

        const products = await prisma.product.findMany({
            where: {
                AND: searchConditions, // Must match ALL terms
                isActive: true
            },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                discountPrice: true, // Renamed from salePrice in previous step, checking schema compatibility
                salePrice: true, // Keeping both for safety if migration didn't fully alias
                images: true,
                category: { select: { name: true } }
            },
            take: 5
        });

        const categories = await prisma.category.findMany({
            where: {
                name: { contains: query },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                slug: true
            },
            take: 3
        });

        return NextResponse.json({ products, categories });
    } catch (error) {
        console.error("Search suggestions error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
