import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit';

// GET: Fetch all categories
export async function GET(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    const categories = await prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
            subcategoryGroups: true
        }
    });

    return NextResponse.json(categories);
}

export async function POST(request) {
    // 1. Auth Check
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { name, sortOrder, isActive, showInMegaMenu, showInTopbar, showOnHomepage, image } = body;

        // 2. Auto-generate slug if not provided
        let slug = body.slug;
        if (!slug) {
            slug = slugify(name, { lower: true, strict: true });
        }

        // 3. Validation: Check slug uniqueness
        const existing = await prisma.category.findUnique({
            where: { slug }
        });
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }

        // 4. Create Category
        const newCategory = await prisma.category.create({
            data: {
                name,
                slug,
                image,
                sortOrder: parseInt(sortOrder) || 0,
                isActive: isActive ?? true,
                showInMegaMenu: showInMegaMenu ?? true,
                showInTopbar: showInTopbar ?? false,
                showOnHomepage: showOnHomepage ?? false,
            }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
            entityType: "Category",
            entityId: newCategory.id,
            meta: { name: newCategory.name },
            ip
        });

        revalidatePath('/', 'layout'); // Update Mega Menu
        return NextResponse.json(newCategory);

    } catch (error) {
        console.error('Create Category Error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}
