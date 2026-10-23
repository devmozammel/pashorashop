import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { trackOrderSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";


export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const headersList = headers();
        const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, 10); // 10 checks per minute
        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await request.json();
        const result = trackOrderSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
        }

        const { orderId, emailOrPhone } = result.data;

        if (!orderId || !emailOrPhone) {
            return NextResponse.json({ error: "Order ID and Email/Phone are required" }, { status: 400 });
        }

        // Try to find by Order Number first (user friendly) or ID
        const order = await prisma.order.findFirst({
            where: {
                OR: [
                    { id: orderId },
                    { orderNumber: orderId } // Allow using order number like ORD-123
                ]
            },
            include: { 
                user: true,
                history: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verify Email or Phone — use exact match (normalize phone digits)
        const matchesEmail = order.user?.email?.toLowerCase() === String(emailOrPhone).toLowerCase();

        // Normalize both phone numbers to digits-only for exact comparison
        const orderPhone = (order.shippingAddress?.phone || order.phone || "").replace(/\D/g, "");
        const inputPhone = String(emailOrPhone).replace(/\D/g, "");
        // Must be a full phone match (at least 10 digits)
        const matchesPhone = inputPhone.length >= 10 && orderPhone === inputPhone;

        if (!matchesEmail && !matchesPhone) {
            return NextResponse.json({ error: "Order matched, but email/phone does not verify ownership." }, { status: 403 });
        }

        return NextResponse.json({
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            total: order.total,
            history: order.history,
            customerName: order.customerName,
            address: order.address
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
