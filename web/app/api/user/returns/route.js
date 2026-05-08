import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, reason } = body;

        if (!orderId || !reason) {
            return NextResponse.json({ error: "Order ID and reason are required" }, { status: 400 });
        }

        // Verify the order belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized access to order" }, { status: 403 });
        }

        // Prevent duplicate return requests
        const existingReturn = await prisma.returnRequest.findUnique({
            where: { orderId }
        });

        if (existingReturn) {
            return NextResponse.json({ error: "A return request already exists for this order" }, { status: 400 });
        }

        // Create the return request
        const returnReq = await prisma.returnRequest.create({
            data: {
                orderId,
                userId: session.user.id,
                reason,
                status: "REQUESTED"
            }
        });

        // Notify admin
        await prisma.notification.create({
            data: {
                userId: null,
                type: "RETURN_REQUEST",
                message: `User ${session.user.name || session.user.email} requested a return for order.`
            }
        });

        return NextResponse.json({ success: true, data: returnReq }, { status: 201 });
    } catch (error) {
        console.error("Error creating return request:", error);
        return NextResponse.json({ error: "Failed to create return request" }, { status: 500 });
    }
}
