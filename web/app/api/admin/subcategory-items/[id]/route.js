import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { requireAdmin, unauthorizedResponse } from '@/lib/require-admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createAuditLog } from '@/lib/audit';

export async function GET(request, props) {
    const params = await props.params;
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const item = await prisma.subcategoryItem.findUnique({
            where: { id: params.id },
            include: { group: true }
        });

        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, props) {
    const params = await props.params;
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();

        let updateData = { ...body };
        if (updateData.slug) {
            updateData.slug = slugify(updateData.slug, { lower: true, strict: true });
        }

        // Handle groupId mapping if passed as subcategoryId or ensure groupId is used
        if (body.subcategoryId) {
            updateData.groupId = body.subcategoryId;
            delete updateData.subcategoryId;
        }

        const item = await prisma.subcategoryItem.update({
            where: { id: params.id },
            data: updateData
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "SubcategoryItem",
            entityId: item.id,
            meta: { name: item.name },
            ip
        });

        revalidatePath('/', 'layout');
        revalidateTag('mega-menu');

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, props) {
    const params = await props.params;
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        await prisma.subcategoryItem.delete({
            where: { id: params.id }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "DELETE",
            entityType: "SubcategoryItem",
            entityId: params.id,
            ip
        });

        revalidatePath('/', 'layout');
        revalidateTag('mega-menu');

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
