import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { createSteadfastOrder } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req, props) {
    const params = await props.params;

    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
        }

        if (order.status === "CANCELLED") {
            return NextResponse.json({ ok: false, message: "Cancelled order cannot be dispatched to courier." }, { status: 400 });
        }

        // Call Steadfast API
        const dispatchResult = await createSteadfastOrder(order);

        if (!dispatchResult.ok) {
            return NextResponse.json({
                ok: false,
                message: dispatchResult.message || "Failed to dispatch order with Steadfast"
            }, { status: 400 });
        }

        const trackingCode = dispatchResult.trackingCode;
        const consignmentId = dispatchResult.consignmentId ? String(dispatchResult.consignmentId) : null;

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updated = await tx.order.update({
                where: { id },
                data: {
                    courierName: "Steadfast",
                    trackingNumber: trackingCode,
                    status: "SHIPPED"
                }
            });

            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status: "SHIPPED",
                    note: `Order booked with Steadfast Courier. Tracking: ${trackingCode}${consignmentId ? ` (CID: ${consignmentId})` : ""}`
                }
            });

            if (updated.userId) {
                await tx.notification.create({
                    data: {
                        userId: updated.userId,
                        type: "ORDER_STATUS_UPDATE",
                        message: `Your order #${updated.orderNumber} has been dispatched via Steadfast Courier. Tracking Code: ${trackingCode}.`
                    }
                });
            }

            return updated;
        });

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "UPDATE",
            entityType: "Order",
            entityId: id,
            meta: { action: "steadfast_dispatch", trackingCode, consignmentId, orderNumber: order.orderNumber },
            ip
        });

        return NextResponse.json({
            ok: true,
            data: updatedOrder,
            trackingCode,
            consignmentId,
            message: `Order dispatched successfully with Steadfast Courier! Tracking: ${trackingCode}`
        });

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Dispatch error" }, { status: 500 });
    }
}
