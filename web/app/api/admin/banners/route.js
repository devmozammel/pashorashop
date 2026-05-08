import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";

// GET: List all banners
export async function GET() {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const banners = await prisma.banner.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(banners);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new banner
export async function POST(req) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { text, link, isActive, startAt, endAt } = body;

        if (!text?.trim()) {
            return NextResponse.json({ error: "Banner text is required" }, { status: 400 });
        }

        const banner = await prisma.banner.create({
            data: {
                text: text.trim(),
                link: link?.trim() || null,
                isActive: isActive !== false,
                startAt: startAt ? new Date(startAt) : null,
                endAt: endAt ? new Date(endAt) : null,
            },
        });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
            entityType: "Banner",
            entityId: banner.id,
            meta: { text: banner.text },
        });

        return NextResponse.json(banner, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update a banner
export async function PATCH(req) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const body = await req.json();
        const { id, text, link, isActive, startAt, endAt } = body;

        if (!id) {
            return NextResponse.json({ error: "Banner id is required" }, { status: 400 });
        }

        const banner = await prisma.banner.update({
            where: { id },
            data: {
                ...(text && { text: text.trim() }),
                link: link !== undefined ? (link?.trim() || null) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                startAt: startAt !== undefined ? (startAt ? new Date(startAt) : null) : undefined,
                endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : undefined,
            },
        });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "Banner",
            entityId: id,
            meta: { text: banner.text },
        });

        return NextResponse.json(banner);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a banner by id (query param)
export async function DELETE(req) {
    const admin = await requireAdmin();
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Banner id is required" }, { status: 400 });
        }

        await prisma.banner.delete({ where: { id } });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "DELETE",
            entityType: "Banner",
            entityId: id,
            meta: {},
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
