import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();

        // Allowed fields to update
        const { role, name, phone } = body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(role && { role }),
                ...(name && { name }),
                ...(phone && { phone }),
            }
        });

        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "UPDATE",
            entityType: "User",
            entityId: user.id,
            meta: { role, email: user.email }
        });

        return NextResponse.json({ ok: true, data: user });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
