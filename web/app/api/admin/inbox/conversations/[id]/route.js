import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { getUnifiedCustomerRisk } from "@/lib/couriers";
import { formatBangladeshiPhone } from "@/lib/steadfast";
import {
    getRememberedEphemeralImage,
    fetchMessengerThreadMedia,
    normalizeMetaMessageId,
} from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const includeLiveFraud = searchParams.get("liveFraud") === "true";

        const conversation = await prisma.socialConversation.findUnique({
            where: { id },
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
                messages: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        sender: { select: { id: true, name: true, email: true, role: true } },
                    },
                },
                orders: {
                    orderBy: { createdAt: "desc" },
                    include: { items: true },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json({ ok: false, message: "Conversation not found" }, { status: 404 });
        }

        // Clear unread count when opened
        if (conversation.unreadCount > 0) {
            await prisma.socialConversation.update({
                where: { id },
                data: { unreadCount: 0 },
            });
            conversation.unreadCount = 0;
        }

        // Hydrate temporary image previews strictly in memory (never written to DB)
        const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        const missingMessengerImages = [];
        for (const msg of conversation.messages) {
            if (msg.messageType !== "IMAGE" || msg.mediaUrl) continue;
            if (conversation.channel === "WHATSAPP" && msg.metadata?.waMediaId) {
                msg.ephemeralMediaUrl = `/api/admin/inbox/media/${msg.metadata.waMediaId}`;
                continue;
            }
            const cachedUrl = getRememberedEphemeralImage(msg.externalMessageId);
            if (cachedUrl) {
                msg.ephemeralMediaUrl = cachedUrl;
                continue;
            }
            if (
                conversation.channel === "MESSENGER" &&
                new Date(msg.createdAt).getTime() >= fourteenDaysAgo
            ) {
                missingMessengerImages.push(msg);
            }
        }

        if (missingMessengerImages.length > 0 && conversation.externalUserId) {
            const threadMedia = await fetchMessengerThreadMedia({
                psid: conversation.externalUserId,
                limit: 25,
            });
            for (const msg of missingMessengerImages) {
                const normId = normalizeMetaMessageId(msg.externalMessageId);
                let liveUrl = normId ? threadMedia.byId.get(normId) || null : null;
                if (!liveUrl && threadMedia.list.length > 0) {
                    const msgTime = new Date(msg.createdAt).getTime();
                    const nearMatch = threadMedia.list.find(
                        (item) => item.createdTime && Math.abs(item.createdTime - msgTime) <= 15000
                    );
                    if (nearMatch) liveUrl = nearMatch.url;
                }
                if (liveUrl) {
                    msg.ephemeralMediaUrl = liveUrl;
                }
            }
        }

        // Lookup customer risk / fraud / delivery success ratio if phone is known
        const phoneToCheck =
            conversation.phone || conversation.extractedData?.phone || "";
        let customerRisk = null;
        let phoneOrderHistory = [];

        if (phoneToCheck) {
            const clean = formatBangladeshiPhone(phoneToCheck);
            const variants = clean
                ? [clean, `880${clean.replace(/^0/, "")}`, clean.replace(/^0/, "")]
                : [phoneToCheck];

            const [risk, history] = await Promise.all([
                getUnifiedCustomerRisk(phoneToCheck, { includeCourier: includeLiveFraud, force: includeLiveFraud }),
                prisma.order.findMany({
                    where: { phone: { in: variants } },
                    orderBy: { createdAt: "desc" },
                    take: 8,
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        status: true,
                        courierName: true,
                        trackingNumber: true,
                        createdAt: true,
                    },
                }),
            ]);
            customerRisk = risk;
            phoneOrderHistory = history;
        }

        return NextResponse.json({
            ok: true,
            data: {
                ...conversation,
                customerRisk,
                phoneOrderHistory,
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();

        const updateData = {};
        if (body.status) updateData.status = body.status;
        if (body.assignedToId !== undefined) {
            updateData.assignedToId = body.assignedToId || null;
            updateData.assignedAt = body.assignedToId ? new Date() : null;
        }
        if (body.phone !== undefined) {
            const clean = formatBangladeshiPhone(body.phone);
            updateData.phone = clean && clean.length === 11 ? clean : body.phone || null;
        }
        if (body.customerName !== undefined) updateData.customerName = body.customerName;

        const updated = await prisma.socialConversation.update({
            where: { id },
            data: updateData,
            include: {
                assignedTo: { select: { id: true, name: true, email: true, role: true } },
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
