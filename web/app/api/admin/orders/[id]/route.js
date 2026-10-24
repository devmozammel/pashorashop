import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { sendOrderStatusEmail } from "@/lib/email";
import { getCustomerScore } from "@/lib/customer-scoring";


export const dynamic = "force-dynamic";

export async function GET(req, props) {
    const params = await props.params;

    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                images: true
                            }
                        }
                    }
                },
                history: {
                    orderBy: { createdAt: "desc" }
                },
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
        }

        const customerScore = await getCustomerScore(order.phone);

        return NextResponse.json({ ok: true, data: { ...order, customerScore } });
    } catch (error) {
        return apiError(error, "Get Order Details");
    }
}

export async function PATCH(req, props) {
    const params = await props.params;

    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const { status, note, courierName, trackingNumber, adminNote } = body;

        // Start transaction: update order + add history + notify user + affiliate
        const order = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: { 
                    status,
                    ...(courierName !== undefined && { courierName }),
                    ...(trackingNumber !== undefined && { trackingNumber }),
                    ...(adminNote !== undefined && { adminNote }),
                }
            });

            if (note || status) {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        status: status || updatedOrder.status,
                        note: note || `Status updated to ${status}`
                    }
                });
            }

            // Automatically notify the user if they are logged in/registered
            if (updatedOrder.userId && status) {
                await tx.notification.create({
                    data: {
                        userId: updatedOrder.userId,
                        type: "ORDER_STATUS_UPDATE",
                        message: `Your order #${updatedOrder.orderNumber} status has been updated to ${status}.`
                    }
                });
            }

            // --- Affiliate Commission Auto-Settlement ---
            if (status === "DELIVERED") {
                // Mark commission as APPROVED when order is delivered.
                // pendingEarnings stays — it was already credited at checkout and is now withdrawable.
                // We only confirm the transaction status to "APPROVED".
                const affiliateTx = await tx.affiliateTransaction.findUnique({
                    where: { orderId: id },
                });
                if (affiliateTx && affiliateTx.status === "PENDING") {
                    await tx.affiliateTransaction.update({
                        where: { id: affiliateTx.id },
                        data: { status: "APPROVED" },
                    });
                    // totalEarnings reflects confirmed (delivered) earnings
                    await tx.affiliateProfile.update({
                        where: { id: affiliateTx.affiliateId },
                        data: {
                            totalEarnings: { increment: affiliateTx.commissionAmount },
                        },
                    });
                }
            }

            if (status === "CANCELLED") {
                // Reject commission and refund pendingEarnings when order is cancelled
                const affiliateTx = await tx.affiliateTransaction.findUnique({
                    where: { orderId: id },
                });
                if (affiliateTx && affiliateTx.status === "PENDING") {
                    await tx.affiliateTransaction.update({
                        where: { id: affiliateTx.id },
                        data: { status: "REJECTED" },
                    });
                    // Reverse the pending earnings that were credited at checkout
                    await tx.affiliateProfile.update({
                        where: { id: affiliateTx.affiliateId },
                        data: {
                            pendingEarnings: { decrement: affiliateTx.commissionAmount },
                        },
                    });
                }
            }
            // -------------------------------------------

            return updatedOrder;
        });

        // Log the action
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "UPDATE_STATUS",
            entityType: "Order",
            entityId: id,
            meta: { newStatus: status, note, orderNumber: order.orderNumber },
            ip
        });

        // Send status update email (non-blocking)
        if (status && order.userId) {
            const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
            if (user?.email) {
                sendOrderStatusEmail({ order, email: user.email, newStatus: status }).catch(() => { });
            }
        }

        return NextResponse.json({ ok: true, data: order });
    } catch (error) {
        return apiError(error, "Update Order Status");
    }
}
