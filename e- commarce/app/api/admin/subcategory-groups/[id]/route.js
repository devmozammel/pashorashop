import { createAuditLog } from '@/lib/audit';

export async function PATCH(request, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;
        const body = await request.json();
        const { name, slug, categoryId, isActive, sortOrder, image } = body;

        // If slug is being changed, check uniqueness
        if (slug) {
            const existing = await prisma.subcategoryGroup.findFirst({
                where: {
                    slug,
                    NOT: { id }
                }
            });
            if (existing) {
                return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
            }
        }

        const updated = await prisma.subcategoryGroup.update({
            where: { id },
            data: {
                name,
                slug: slug ? slugify(slug, { lower: true, strict: true }) : undefined,
                categoryId,
                isActive,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
                image
            }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "SubcategoryGroup",
            entityId: updated.id,
            meta: { name: updated.name },
            ip
        });

        revalidatePath('/', 'layout');
        revalidateTag('mega-menu');
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Subcategory Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, props) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await props.params;

        // Check for products
        const productCount = await prisma.product.count({
            where: { subcategoryId: id }
        });

        if (productCount > 0) {
            return NextResponse.json({
                error: `Cannot delete subcategory with ${productCount} products.`
            }, { status: 400 });
        }

        await prisma.subcategoryGroup.delete({ where: { id } });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "DELETE",
            entityType: "SubcategoryGroup",
            entityId: id,
            ip
        });

        revalidatePath('/', 'layout');
        revalidateTag('mega-menu');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Subcategory Delete Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
