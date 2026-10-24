import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapSteadfastStatus } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

/**
 * Steadfast Courier Webhook Handler
 * Endpoint: POST /api/webhooks/steadfast
 * Steadfast sends real-time delivery status updates here when an order is Delivered, Cancelled, In-Transit, etc.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ status: 400, message: "Invalid JSON payload" }, { status: 400 });
        }

        const notificationType = body.notification_type || body.type || "delivery_status";
        const consignmentId = body.consignment_id ? String(body.consignment_id).trim() : null;
        const invoice = body.invoice ? String(body.invoice).trim() : null;
        const rawStatus = body.status || body.delivery_status;
        const trackingMessage = body.tracking_message || body.message || "";

        if (!invoice && !consignmentId) {
            return NextResponse.json({ status: 400, message: "Missing invoice or consignment_id" }, { status: 400 });
        }

        // Find the corresponding order by orderNumber (invoice) or trackingNumber (consignmentId)
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    ...(invoice ? [{ orderNumber: invoice }] : []),
                    ...(consignmentId ? [{ trackingNumber: consignmentId }] : []),
                ]
            }
        });

        if (!order) {
            console.warn(`[Steadfast Webhook] No matching order found for invoice: ${invoice}, CID: ${consignmentId}`);
            // Return 200 so Steadfast doesn't keep hammering retries
            return NextResponse.json({ status: 200, message: "Order not found in database, acknowledged." });
        }

        // Map Steadfast status to our internal system
        const mapped = mapSteadfastStatus(rawStatus);
        if (!mapped) {
            return NextResponse.json({ status: 200, message: `Status '${rawStatus}' acknowledged but not mapped.` });
        }

        const newOrderStatus = mapped.orderStatus;
        const newPaymentStatus = mapped.paymentStatus;

        // Update if status changed
        if (order.status !== newOrderStatus || (newPaymentStatus && order.paymentStatus !== newPaymentStatus)) {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: newOrderStatus,
                        ...(newPaymentStatus && { paymentStatus: newPaymentStatus })
                    }
                });

                await tx.orderStatusHistory.create({
                    data: {
                        orderId: order.id,
                        status: newOrderStatus,
                        note: `[Steadfast অটোমেটিক আপডেট] ${rawStatus}: ${trackingMessage || mapped.label}`.slice(0, 255)
                    }
                });

                // Handle affiliate commission approval if order is delivered
                if (newOrderStatus === "DELIVERED") {
                    const affiliateTx = await tx.affiliateTransaction.findUnique({
                        where: { orderId: order.id }
                    }).catch(() => null);

                    if (affiliateTx && affiliateTx.status === "PENDING") {
                        await tx.affiliateTransaction.update({
                            where: { id: affiliateTx.id },
                            data: { status: "APPROVED" }
                        });
                        await tx.affiliateProfile.update({
                            where: { id: affiliateTx.affiliateId },
                            data: { totalEarnings: { increment: affiliateTx.commissionAmount } }
                        });
                    }
                }

                // Handle affiliate commission cancellation if order is cancelled
                if (newOrderStatus === "CANCELLED") {
                    const affiliateTx = await tx.affiliateTransaction.findUnique({
                        where: { orderId: order.id }
                    }).catch(() => null);

                    if (affiliateTx && affiliateTx.status === "PENDING") {
                        await tx.affiliateTransaction.update({
                            where: { id: affiliateTx.id },
                            data: { status: "REJECTED" }
                        });
                        await tx.affiliateProfile.update({
                            where: { id: affiliateTx.affiliateId },
                            data: { pendingEarnings: { decrement: affiliateTx.commissionAmount } }
                        });
                    }
                }
            });

            console.log(`[Steadfast Webhook] Order #${order.orderNumber} auto-updated to ${newOrderStatus} (${rawStatus})`);
        }

        return NextResponse.json({
            status: 200,
            message: "Webhook processed successfully",
            orderNumber: order.orderNumber,
            updatedStatus: newOrderStatus
        });
    } catch (err) {
        console.error("[Steadfast Webhook Error]:", err);
        return NextResponse.json({ status: 500, message: err.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: 200,
        message: "Steadfast Webhook Endpoint is online and listening for delivery status callbacks."
    });
}
