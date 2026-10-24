import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { createSteadfastOrder } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { orderIds } = body;

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ ok: false, message: "No order IDs provided" }, { status: 400 });
        }

        const orders = await prisma.order.findMany({
            where: {
                id: { in: orderIds },
                status: { not: "CANCELLED" }
            },
            include: { items: true }
        });

        if (orders.length === 0) {
            return NextResponse.json({ ok: false, message: "No eligible orders found to dispatch." }, { status: 400 });
        }

        const successful = [];
        const failed = [];

        for (const order of orders) {
            try {
                // If order already has a tracking number, skip or report
                if (order.trackingNumber && order.courierName?.toLowerCase() === "steadfast") {
                    successful.push({
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        trackingCode: order.trackingNumber,
                        message: "Already dispatched"
                    });
                    continue;
                }

                const result = await createSteadfastOrder(order);

                if (result.ok && result.trackingCode) {
                    await prisma.$transaction(async (tx) => {
                        await tx.order.update({
                            where: { id: order.id },
                            data: {
                                courierName: "Steadfast",
                                trackingNumber: result.trackingCode,
                                status: "SHIPPED"
                            }
                        });

                        await tx.orderStatusHistory.create({
                            data: {
                                orderId: order.id,
                                status: "SHIPPED",
                                note: `Bulk Dispatch: Booked with Steadfast Courier. Tracking: ${result.trackingCode}`
                            }
                        });

                        if (order.userId) {
                            await tx.notification.create({
                                data: {
                                    userId: order.userId,
                                    type: "ORDER_STATUS_UPDATE",
                                    message: `Your order #${order.orderNumber} has been dispatched via Steadfast Courier. Tracking Code: ${result.trackingCode}.`
                                }
                            });
                        }
                    });

                    successful.push({
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        trackingCode: result.trackingCode
                    });
                } else {
                    failed.push({
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        error: result.message || "Booking rejected by Steadfast"
                    });
                }
            } catch (err) {
                failed.push({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    error: err.message
                });
            }
        }

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "UPDATE",
            entityType: "Order",
            meta: {
                action: "steadfast_bulk_dispatch",
                totalAttempted: orders.length,
                successCount: successful.length,
                failCount: failed.length
            },
            ip
        });

        return NextResponse.json({
            ok: true,
            successful,
            failed,
            message: `Dispatch completed! Successfully booked: ${successful.length}, Failed: ${failed.length}.`
        });

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Bulk dispatch failed" }, { status: 500 });
    }
}
