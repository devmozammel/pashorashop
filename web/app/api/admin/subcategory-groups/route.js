import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { requireAdmin, unauthorizedResponse } from '@/lib/require-admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createAuditLog } from '@/lib/audit';


export const dynamic = "force-dynamic";

export async function GET(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');

        const where = categoryId ? { categoryId } : {};

        const groups = await prisma.subcategoryGroup.findMany({
            where,
            include: {
                category: {
                    select: { name: true }
                },
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("Subcategories GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, categoryId, sortOrder, isActive, image } = body;

        let slug = body.slug || slugify(name, { lower: true });
        
        const group = await prisma.subcategoryGroup.create({
            data: {
                name,
                slug,
                categoryId,
                image,
                sortOrder: parseInt(sortOrder) || 0,
                isActive: isActive ?? true
            }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
            entityType: "SubcategoryGroup",
            entityId: group.id,
            meta: { name: group.name },
            ip
        });

        revalidatePath('/', 'layout');
        revalidateTag('mega-menu');
        return NextResponse.json(group);
    } catch (error) {
        console.error("Subcategory Create Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
