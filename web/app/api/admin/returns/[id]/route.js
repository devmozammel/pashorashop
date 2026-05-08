import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body; // APPROVED, REJECTED

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const returnReq = await tx.returnRequest.update({
                where: { id },
                data: { status }
            });

            // If Approved, update order status to RETURNED
            if (status === "APPROVED") {
                await tx.order.update({
                    where: { id: returnReq.orderId },
                    data: { status: "RETURNED" }
                });
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: returnReq.orderId,
                        status: "RETURNED",
                        note: "Return request approved"
                    }
                });
            } else if (status === "REJECTED") {
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: returnReq.orderId,
                        status: "RETURN_REQUESTED",
                        note: "Return request rejected"
                    }
                });
            }

            return returnReq;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[ADMIN_RETURN_PATCH]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
