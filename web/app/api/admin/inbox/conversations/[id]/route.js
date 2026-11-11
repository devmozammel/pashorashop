import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { getUnifiedCustomerRisk } from "@/lib/couriers";
import { formatBangladeshiPhone } from "@/lib/steadfast";

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
