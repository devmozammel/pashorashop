import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const activeOnly = searchParams.get('active') === 'true' || searchParams.get('active') === '1';
        const includeSub = searchParams.get('includeSub') === 'true' || searchParams.get('includeSub') === '1';

        // Build where clause
        const where = {};
        if (activeOnly) {
            where.isActive = true;
        }

        // Build include clause
        const include = {};
        if (includeSub) {
            include.subcategoryGroups = {
                where: activeOnly ? { isActive: true } : undefined,
                orderBy: { sortOrder: 'asc' },
                include: {
                    items: {
                        where: activeOnly ? { isActive: true } : undefined,
                        orderBy: { sortOrder: 'asc' }
                    }
                }
            };
        }

        // Fetch categories (Flat list, sorted by sortOrder)
        const categories = await prisma.category.findMany({
            where,
            include,
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
