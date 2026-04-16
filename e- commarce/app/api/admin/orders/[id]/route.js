import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { sendOrderStatusEmail } from "@/lib/email";

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

        return NextResponse.json({ ok: true, data: order });
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
        const { status, note } = body;

        // Start transaction: update order + add history + notify user
        const order = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status }
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
