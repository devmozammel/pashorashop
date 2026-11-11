import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const days = Math.min(90, Math.max(1, Number(searchParams.get("days") || 30)));
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [conversations, orders, staffUsers, outboundMessages] = await Promise.all([
            prisma.socialConversation.findMany({
                where: { createdAt: { gte: since } },
                select: {
                    id: true,
                    channel: true,
                    adPlatform: true,
                    adId: true,
                    adName: true,
                    campaignName: true,
                    status: true,
                    assignedToId: true,
                    firstResponseSeconds: true,
                },
            }),
            prisma.order.findMany({
                where: {
                    createdAt: { gte: since },
                    conversationId: { not: null },
                },
                select: {
                    id: true,
                    total: true,
                    status: true,
                    conversationId: true,
                    createdById: true,
                    adSource: true,
                    adId: true,
                    adCampaign: true,
                },
            }),
            prisma.user.findMany({
                where: { role: { in: ["ADMIN", "MODERATOR"] } },
                select: { id: true, name: true, email: true, role: true },
            }),
            prisma.socialMessage.findMany({
                where: {
                    createdAt: { gte: since },
                    direction: "OUTBOUND",
                    senderType: "MODERATOR",
                    senderId: { not: null },
                },
                select: {
                    id: true,
                    senderId: true,
                    conversationId: true,
                },
            }),
        ]);

        // 1. Ad / Boost ROI Breakdown
        const adMap = new Map();
        const convById = new Map();

        for (const c of conversations) {
            convById.set(c.id, c);
            const key = c.adId || `ORG_${c.adPlatform || "ORGANIC"}`;
            if (!adMap.has(key)) {
                adMap.set(key, {
                    key,
                    adId: c.adId || "-",
                    adPlatform: c.adPlatform || "ORGANIC",
                    adName: c.adName || (c.adId ? `Ad #${c.adId}` : "Organic / Direct"),
                    campaignName: c.campaignName || "-",
                    conversationsCount: 0,
                    ordersCount: 0,
                    deliveredCount: 0,
                    revenue: 0,
                });
            }
            adMap.get(key).conversationsCount += 1;
        }

        for (const o of orders) {
            const conv = convById.get(o.conversationId);
            const key = o.adId || conv?.adId || `ORG_${o.adSource || conv?.adPlatform || "ORGANIC"}`;
            if (!adMap.has(key)) {
                adMap.set(key, {
                    key,
                    adId: o.adId || "-",
                    adPlatform: o.adSource || "ORGANIC",
                    adName: o.adCampaign || "Organic / Direct",
                    campaignName: o.adCampaign || "-",
                    conversationsCount: 0,
                    ordersCount: 0,
                    deliveredCount: 0,
                    revenue: 0,
                });
            }
            const entry = adMap.get(key);
            if (o.status !== "CANCELLED") {
                entry.ordersCount += 1;
                entry.revenue += Number(o.total || 0);
                if (o.status === "DELIVERED") entry.deliveredCount += 1;
            }
        }

        const adRoi = Array.from(adMap.values())
            .map((row) => ({
                ...row,
                conversionRate:
                    row.conversationsCount > 0
                        ? Math.round((row.ordersCount / row.conversationsCount) * 100)
                        : 0,
            }))
            .sort((a, b) => b.revenue - a.revenue || b.conversationsCount - a.conversationsCount);

        // 2. Channel Breakdown
        const channelMap = new Map();
        for (const c of conversations) {
            if (!channelMap.has(c.channel)) {
                channelMap.set(c.channel, { channel: c.channel, conversations: 0, orders: 0, revenue: 0 });
            }
            channelMap.get(c.channel).conversations += 1;
        }
        for (const o of orders) {
            const conv = convById.get(o.conversationId);
            if (conv && o.status !== "CANCELLED") {
                const ch = channelMap.get(conv.channel);
                if (ch) {
                    ch.orders += 1;
                    ch.revenue += Number(o.total || 0);
                }
            }
        }

        // 3. Team & Moderator Performance Report
        const modStats = staffUsers.map((user) => {
            const userMsgs = outboundMessages.filter((m) => m.senderId === user.id);
            const repliedConvIds = new Set(userMsgs.map((m) => m.conversationId));
            const assignedConvs = conversations.filter((c) => c.assignedToId === user.id);
            const activeConvIds = new Set([...repliedConvIds, ...assignedConvs.map((c) => c.id)]);

            const responseTimes = assignedConvs
                .map((c) => c.firstResponseSeconds)
                .filter((s) => typeof s === "number" && s > 0);
            const avgResponseMinutes =
                responseTimes.length > 0
                    ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60).toFixed(1))
                    : null;

            const userOrders = orders.filter(
                (o) =>
                    o.status !== "CANCELLED" &&
                    (o.createdById === user.id || (!o.createdById && activeConvIds.has(o.conversationId)))
            );
            const revenue = userOrders.reduce((s, o) => s + Number(o.total || 0), 0);
            const handledCount = activeConvIds.size;
            const conversionRate =
                handledCount > 0 ? Math.round((userOrders.length / handledCount) * 100) : 0;

            return {
                id: user.id,
                name: user.name || user.email,
                email: user.email,
                role: user.role,
                repliesSent: userMsgs.length,
                conversationsHandled: handledCount,
                ordersClosed: userOrders.length,
                revenue,
                conversionRate,
                avgResponseMinutes,
            };
        });

        return NextResponse.json({
            ok: true,
            data: {
                days,
                summary: {
                    totalConversations: conversations.length,
                    totalOrders: orders.filter((o) => o.status !== "CANCELLED").length,
                    totalRevenue: orders
                        .filter((o) => o.status !== "CANCELLED")
                        .reduce((s, o) => s + Number(o.total || 0), 0),
                    overallConversionRate:
                        conversations.length > 0
                            ? Math.round(
                                  (orders.filter((o) => o.status !== "CANCELLED").length /
                                      conversations.length) *
                                      100
                              )
                            : 0,
                },
                adRoi,
                channelBreakdown: Array.from(channelMap.values()),
                moderatorPerformance: modStats.sort((a, b) => b.ordersClosed - a.ordersClosed),
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
