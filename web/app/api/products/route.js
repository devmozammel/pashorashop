
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        // Filters
        const categoryId = searchParams.get("categoryId");
        const subGroupId = searchParams.get("subGroupId");
        const subItemId = searchParams.get("subItemId");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const search = searchParams.get("search") || searchParams.get("q"); // name, sku or description
        const size = searchParams.get("size");
        const color = searchParams.get("color");
        const isFeatured = searchParams.get("isFeatured");
        const isNewArrival = searchParams.get("isNewArrival");
        const isFlashSale = searchParams.get("isFlashSale");

        // Sort
        const sort = searchParams.get("sort"); // price_asc, price_desc, newest, alpha_asc

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build Where Clause
        const where = { isActive: true };

        if (categoryId && categoryId !== 'all') where.categoryId = categoryId;
        if (subGroupId && subGroupId !== 'all') where.subcategoryGroupId = subGroupId;
        if (subItemId && subItemId !== 'all') where.subcategoryItemId = subItemId;
        if (isFeatured === 'true') where.isFeatured = true;
        if (isNewArrival === 'true') where.isNewArrival = true;
        if (isFlashSale === 'true') where.isFlashSale = true;

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice && !isNaN(minPrice)) where.price.gte = parseInt(minPrice);
            if (maxPrice && !isNaN(maxPrice)) where.price.lte = parseInt(maxPrice);
            if (Object.keys(where.price).length === 0) delete where.price;
        }

        if (search && search.trim()) {
            const searchTerms = search.trim().split(' ').filter(term => term.length > 0);

            where.AND = searchTerms.map(term => ({
                OR: [
                    { name: { contains: term } },
                    { sku: { contains: term } },
                    { description: { contains: term } }
                ]
            }));
        }

        // Variant filters (Size/Color)
        if (size || (color && color !== 'all')) {
            where.variants = {
                some: {
                    isActive: true,
                    AND: []
                }
            };
            if (size) where.variants.some.AND.push({ size: size });
            if (color) where.variants.some.AND.push({ color: color });
        }

        // Build OrderBy
        let orderBy = { createdAt: 'desc' }; // Default
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        if (sort === 'price_desc') orderBy = { price: 'desc' };
        if (sort === 'alpha_asc') orderBy = { name: 'asc' };
        if (sort === 'alpha_desc') orderBy = { name: 'desc' };

        // Execute Query
        const [products, total] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    variants: { where: { isActive: true } },
                    productImages: { orderBy: { sortOrder: 'asc' }, take: 1 }
                },
                orderBy,
                skip,
                take: limit
            }),
            prisma.product.count({ where })
        ]);

        return NextResponse.json({
            products,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Product Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}
