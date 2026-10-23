import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { z } from "zod";


export const dynamic = "force-dynamic";

const timelineSchema = z.object({
    note: z.string().min(1, "Note is required")
});

export async function POST(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const { note } = timelineSchema.parse(body);

        const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
        if (!order) {
            return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
        }

        const history = await prisma.orderStatusHistory.create({
            data: {
                orderId: id,
                status: order.status, // Keep current status
                note
            }
        });

        return NextResponse.json({ ok: true, data: history });
    } catch (error) {
        return apiError(error, "Add Order Timeline Note");
    }
}
