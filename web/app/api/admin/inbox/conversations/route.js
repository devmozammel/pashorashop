import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { maybeRunInboxRetentionCleanup } from "@/lib/inbox-retention";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        maybeRunInboxRetentionCleanup();

        const { searchParams } = new URL(req.url);
        const channel = searchParams.get("channel") || "ALL";
        const status = searchParams.get("status") || "ALL";
        const adPlatform = searchParams.get("adPlatform") || "ALL";
        const assignedToId = searchParams.get("assignedToId") || "ALL";
        const search = (searchParams.get("search") || "").trim();

        const where = {};
        if (channel !== "ALL") where.channel = channel;
        if (status !== "ALL") where.status = status;
        if (adPlatform !== "ALL") where.adPlatform = adPlatform;
        if (assignedToId === "UNASSIGNED") {
            where.assignedToId = null;
        } else if (assignedToId === "MINE") {
            where.assignedToId = staff.user?.id;
        } else if (assignedToId !== "ALL") {
            where.assignedToId = assignedToId;
        }

        if (search) {
            where.OR = [
                { customerName: { contains: search } },
                { phone: { contains: search } },
                { lastMessagePreview: { contains: search } },
                { adName: { contains: search } },
                { campaignName: { contains: search } },
            ];
        }

        const [conversations, unreadStats, staffUsers] = await Promise.all([
            prisma.socialConversation.findMany({
                where,
                orderBy: { lastMessageAt: "desc" },
                take: 80,
                include: {
                    assignedTo: { select: { id: true, name: true, email: true, role: true } },
                    orders: {
                        select: {
                            id: true,
                            orderNumber: true,
                            total: true,
                            status: true,
                            courierName: true,
                            trackingNumber: true,
                        },
                        orderBy: { createdAt: "desc" },
                        take: 3,
                    },
                },
            }),
            prisma.socialConversation.groupBy({
                by: ["channel"],
                where: { unreadCount: { gt: 0 } },
                _sum: { unreadCount: true },
                _count: { id: true },
            }),
            prisma.user.findMany({
                where: { role: { in: ["ADMIN", "MODERATOR"] } },
                select: { id: true, name: true, email: true, role: true },
                orderBy: { name: "asc" },
            }),
        ]);

        const unreadByChannel = {};
        let totalUnread = 0;
        for (const row of unreadStats) {
            const count = row._sum?.unreadCount || 0;
            unreadByChannel[row.channel] = count;
            totalUnread += count;
        }

        return NextResponse.json({
            ok: true,
            data: conversations,
            unreadByChannel,
            totalUnread,
            staffUsers,
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
