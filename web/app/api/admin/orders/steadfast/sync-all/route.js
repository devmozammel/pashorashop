import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { checkSteadfastStatus } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        // Find all active shipped orders with a tracking number
        const activeOrders = await prisma.order.findMany({
            where: {
                status: "SHIPPED",
                trackingNumber: { not: null }
            },
            take: 100, // Batch limit
            orderBy: { updatedAt: "asc" }
        });

        if (activeOrders.length === 0) {
            return NextResponse.json({
                ok: true,
                message: "No active shipped orders found to synchronize.",
                totalChecked: 0,
                updatedCount: 0
            });
        }

        let updatedCount = 0;
        let deliveredCount = 0;
        let cancelledCount = 0;
        const details = [];

        for (const order of activeOrders) {
            try {
                const statusResult = await checkSteadfastStatus({
                    trackingCode: order.trackingNumber,
                    invoice: order.orderNumber
                });

                if (statusResult.ok && statusResult.mappedStatus) {
                    const { rawStatus, mappedStatus } = statusResult;
                    const targetOrderStatus = mappedStatus.orderStatus;
                    const targetPaymentStatus = mappedStatus.paymentStatus;

                    if (targetOrderStatus && targetOrderStatus !== order.status) {
                        await prisma.$transaction(async (tx) => {
                            await tx.order.update({
                                where: { id: order.id },
                                data: {
                                    status: targetOrderStatus,
                                    ...(targetPaymentStatus && { paymentStatus: targetPaymentStatus })
                                }
                            });

                            await tx.orderStatusHistory.create({
                                data: {
                                    orderId: order.id,
                                    status: targetOrderStatus,
                                    note: `Bulk Sync: Steadfast status "${rawStatus}" -> Order updated to ${targetOrderStatus}`
                                }
                            });

                            if (targetOrderStatus === "DELIVERED") {
                                const affiliateTx = await tx.affiliateTransaction.findUnique({
                                    where: { orderId: order.id }
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

                            if (targetOrderStatus === "CANCELLED") {
                                const affiliateTx = await tx.affiliateTransaction.findUnique({
                                    where: { orderId: order.id }
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
                        });

                        updatedCount++;
                        if (targetOrderStatus === "DELIVERED") deliveredCount++;
                        if (targetOrderStatus === "CANCELLED") cancelledCount++;

                        details.push({
                            orderNumber: order.orderNumber,
                            trackingCode: order.trackingNumber,
                            oldStatus: order.status,
                            newStatus: targetOrderStatus,
                            rawStatus
                        });
                    }
                }
            } catch (err) {
                console.error(`Error syncing order ${order.orderNumber}:`, err.message);
            }
        }

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "UPDATE",
            entityType: "Order",
            meta: {
                action: "steadfast_bulk_sync",
                totalChecked: activeOrders.length,
                updatedCount,
                deliveredCount,
                cancelledCount
            },
            ip
        });

        return NextResponse.json({
            ok: true,
            totalChecked: activeOrders.length,
            updatedCount,
            deliveredCount,
            cancelledCount,
            details,
            message: `Sync complete! Checked ${activeOrders.length} orders. Updated: ${updatedCount} (${deliveredCount} Delivered, ${cancelledCount} Cancelled).`
        });

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Bulk sync failed" }, { status: 500 });
    }
}
