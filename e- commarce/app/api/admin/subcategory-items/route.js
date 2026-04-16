import { createAuditLog } from '@/lib/audit';

export async function GET(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get('groupId');

        const where = {};
        if (groupId) {
            where.groupId = groupId;
        }

        const items = await prisma.subcategoryItem.findMany({
            where,
            include: {
                group: {
                    include: {
                        category: true
                    }
                }
            },
            orderBy: [
                { group: { category: { sortOrder: 'asc' } } },
                { group: { sortOrder: 'asc' } },
                { sortOrder: 'asc' }
            ]
        });

        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();

        let slug = body.slug;
        if (!slug) {
            slug = slugify(body.name, { lower: true, strict: true });
        }

        // Ensure slug is unique
        const existing = await prisma.subcategoryItem.findUnique({ where: { slug } });
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }

        const item = await prisma.subcategoryItem.create({
            data: {
                name: body.name,
                slug,
                groupId: body.groupId, // Updated from subcategoryId
                isActive: body.isActive ?? true,
                sortOrder: body.sortOrder ?? 0
            }
        });

        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
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
