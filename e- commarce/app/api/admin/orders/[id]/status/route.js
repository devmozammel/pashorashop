import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { orderStatusSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { sendOrderStatusEmail } from "@/lib/email";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const { status, note } = orderStatusSchema.parse(body);

        // Update order status and add history entry in transaction
        const order = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: { status },
                include: { user: true }
            });

            await tx.orderStatusHistory.create({
                data: {
                    orderId: id,
                    status,
                    note: note || `Status updated to ${status} by admin`
                }
            });

            return updatedOrder;
        });

        // Trigger email notification (non-blocking)
        if (order.user?.email) {
            sendOrderStatusEmail({
                order,
                email: order.user.email,
                newStatus: status
            }).catch(console.error);
        }

        return NextResponse.json({ ok: true, data: order });
    } catch (error) {
        return apiError(error, "Update Order Status");
    }
}
