import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";


export const dynamic = "force-dynamic";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();

        // Allowed fields to update
        const { role, name, phone } = body;

        // Role validation
        if (role && !["USER", "ADMIN"].includes(role)) {
            return NextResponse.json({ ok: false, message: "Invalid role specified" }, { status: 400 });
        }

        // Prevent self-role update
        if (role && id === admin.user.id) {
            return NextResponse.json({ ok: false, message: "You cannot update your own role" }, { status: 400 });
        }

        // Get the current user details
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true }
        });

        if (!targetUser) {
            return NextResponse.json({ ok: false, message: "User not found" }, { status: 404 });
        }

        // Prevent lockout: verify at least one other admin exists if demoting
        if (role && targetUser.role === "ADMIN" && role !== "ADMIN") {
            const otherAdminsCount = await prisma.user.count({
                where: {
                    role: "ADMIN",
                    id: { not: id }
                }
            });
            if (otherAdminsCount === 0) {
                return NextResponse.json({ ok: false, message: "Cannot demote the last remaining administrator" }, { status: 400 });
            }
        }

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
