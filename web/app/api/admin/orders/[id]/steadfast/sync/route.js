import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { checkSteadfastStatus } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req, props) {
    const params = await props.params;

    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id }
        });

        if (!order) {
            return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
        }

        if (!order.trackingNumber && order.courierName?.toLowerCase() !== "steadfast") {
            return NextResponse.json({
                ok: false,
                message: "This order does not have a Steadfast tracking number. Please dispatch it first."
            }, { status: 400 });
        }

        // Query Steadfast API
        const statusResult = await checkSteadfastStatus({
            trackingCode: order.trackingNumber,
            invoice: order.orderNumber
        });

        if (!statusResult.ok || !statusResult.mappedStatus) {
            return NextResponse.json({
                ok: false,
                message: statusResult.message || `No tracking update available from Steadfast for tracking code ${order.trackingNumber || order.orderNumber}`
            }, { status: 400 });
        }

        const { rawStatus, mappedStatus } = statusResult;
        const targetOrderStatus = mappedStatus.orderStatus;
        const targetPaymentStatus = mappedStatus.paymentStatus;
        const statusLabel = mappedStatus.label;

        let statusChanged = false;

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const updateData = {};

            if (targetOrderStatus && targetOrderStatus !== order.status) {
                updateData.status = targetOrderStatus;
                statusChanged = true;
            }

            if (targetPaymentStatus && targetPaymentStatus !== order.paymentStatus) {
                updateData.paymentStatus = targetPaymentStatus;
            }

            let updated = order;
            if (Object.keys(updateData).length > 0) {
                updated = await tx.order.update({
                    where: { id },
                    data: updateData
                });
            }

            // Always add a history entry if status changed or note
            if (statusChanged) {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        status: targetOrderStatus,
                        note: `Steadfast Delivery Status: "${rawStatus}" -> Order updated to ${targetOrderStatus}`
                    }
                });

                // User Notification
                if (updated.userId) {
                    await tx.notification.create({
                        data: {
                            userId: updated.userId,
                            type: "ORDER_STATUS_UPDATE",
                            message: `Your order #${updated.orderNumber} status is now ${statusLabel} (via Steadfast).`
                        }
                    });
                }

                // Affiliate commission settlement on DELIVERED
                if (targetOrderStatus === "DELIVERED") {
                    const affiliateTx = await tx.affiliateTransaction.findUnique({
                        where: { orderId: id }
                    });
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

                // Affiliate commission rollback on CANCELLED
                if (targetOrderStatus === "CANCELLED") {
                    const affiliateTx = await tx.affiliateTransaction.findUnique({
                        where: { orderId: id }
                    });
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
            }

            return updated;
        });

        // Audit Log
        if (statusChanged) {
            const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
            await createAuditLog({
                adminId: admin.user?.id || admin.user?.email || admin.id,
                action: "UPDATE",
                entityType: "Order",
                entityId: id,
                meta: {
                    action: "steadfast_sync",
                    rawStatus,
                    newOrderStatus: targetOrderStatus,
                    trackingNumber: order.trackingNumber
                },
                ip
            });
        }

        return NextResponse.json({
            ok: true,
            statusChanged,
            rawStatus,
            mappedStatus,
            data: updatedOrder,
            message: `Steadfast status is "${statusLabel}". ${statusChanged ? `Order updated to ${targetOrderStatus}.` : "Order status is already up to date."}`
        });

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to sync status" }, { status: 500 });
    }
}
