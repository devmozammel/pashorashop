import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { formatBangladeshiPhone } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { phone, reason = "Suspected Fraud / Excessive Cancellations" } = body;

        if (!phone) {
            return NextResponse.json({ ok: false, message: "Phone number is required" }, { status: 400 });
        }

        const cleanPhone = formatBangladeshiPhone(phone);
        const phoneVariants = [cleanPhone, `880${cleanPhone.replace(/^0/, "")}`, cleanPhone.replace(/^0/, "")];

        const existing = await prisma.blacklist.findFirst({
            where: { phone: { in: phoneVariants } }
        });

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const adminIdentifier = admin.user?.id || admin.user?.email || admin.id || "Admin";

        if (existing) {
            // Remove from blacklist
            await prisma.blacklist.delete({
                where: { id: existing.id }
            });

            await createAuditLog({
                adminId: adminIdentifier,
                action: "DELETE",
                entityType: "Blacklist",
                entityId: existing.id,
                meta: { phone: cleanPhone, action: "unblock_customer" },
                ip
            });

            return NextResponse.json({
                ok: true,
                isBlacklisted: false,
                message: `Phone ${cleanPhone} has been removed from the blacklist.`
            });
        } else {
            // Add to blacklist
            const created = await prisma.blacklist.create({
                data: {
                    phone: cleanPhone,
                    reason,
                    blockedBy: adminIdentifier
                }
            });

            await createAuditLog({
                adminId: adminIdentifier,
                action: "CREATE",
                entityType: "Blacklist",
                entityId: created.id,
                meta: { phone: cleanPhone, reason, action: "block_customer" },
                ip
            });

            return NextResponse.json({
                ok: true,
                isBlacklisted: true,
                message: `Phone ${cleanPhone} has been added to the blacklist!`
            });
        }

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to update blacklist" }, { status: 500 });
    }
}
