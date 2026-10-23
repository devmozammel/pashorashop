import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


export const dynamic = "force-dynamic";

export async function GET(req, props) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Security: Check ownership (simple check, assume admin can view all if needed, but strict for now)
        if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Order Details API Error:", error);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}
