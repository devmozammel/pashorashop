import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request, props) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reason, images } = await request.json();

        // Check if order exists and belongs to user
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: { returnRequest: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (order.status !== "DELIVERED") {
            return NextResponse.json({ error: "Only delivered orders can be returned" }, { status: 400 });
        }

        if (order.returnRequest) {
            return NextResponse.json({ error: "Return request already exists" }, { status: 400 });
        }

        // Create Return Request and Update Order Status
        const result = await prisma.$transaction(async (tx) => {
            const returnReq = await tx.returnRequest.create({
                data: {
                    orderId: params.id,
                    reason,
                    images: images || [], // JSON array
                    status: "PENDING"
                }
            });

            await tx.order.update({
                where: { id: params.id },
                data: { status: "RETURN_REQUESTED" }
            });

            await tx.orderStatusHistory.create({
                data: {
                    orderId: params.id,
                    status: "RETURN_REQUESTED",
                    note: `Return requested: ${reason}`,
                    updatedBy: session.user.id
                }
            });

            return returnReq;
        });

        return NextResponse.json(result);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
