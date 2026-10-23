import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { revalidatePath, revalidateTag } from 'next/cache';
import { createAuditLog } from '@/lib/audit';


export const dynamic = "force-dynamic";

const updateSchema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    image: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
    isActive: z.boolean().optional(),
    showInMegaMenu: z.boolean().optional(),
    showInTopbar: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
});

export async function PUT(request, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { id } = await props.params;

        // 1. Validation
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
        }

        // 2. Update
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: result.data,
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "Category",
            entityId: updatedCategory.id,
            meta: { name: updatedCategory.name, changes: Object.keys(result.data) },
            ip
        });

        return NextResponse.json(updatedCategory);

    } catch (error) {
        console.error('Update Category Error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;

        // Check if products exist in this category
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        // Check if subcategories exist
        const subcategoryCount = await prisma.subcategory.count({
            where: { categoryId: id }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

        if (productCount > 0 || subcategoryCount > 0) {
            // Soft delete
            const deactivated = await prisma.category.update({
                where: { id },
                data: { isActive: false }
            });

            await createAuditLog({
                adminId: admin.user.id || admin.user.email,
                action: "SOFT_DELETE",
                entityType: "Category",
                entityId: id,
                meta: { status: "inactive", reason: "has_dependencies" },
                ip
            });

            return NextResponse.json({
                message: "Category has products or subcategories. Soft deleted (set inactive).",
                category: deactivated
            });
        } else {
            // Hard delete if clean
            await prisma.category.delete({
                where: { id }
            });

            await createAuditLog({
                adminId: admin.user.id || admin.user.email,
                action: "DELETE",
                entityType: "Category",
                entityId: id,
                ip
            });

            revalidatePath('/', 'layout');
            revalidateTag('mega-menu');
            return NextResponse.json({ success: true, message: "Category permanently deleted" });
        }
    } catch (error) {
        console.error('Delete Category Error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
