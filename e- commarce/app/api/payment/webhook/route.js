import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

export async function POST(req) {
    try {
        const apiKeyHeader = req.headers.get("RT-UDDOKTAPAY-API-KEY");
        const apiKEY = decrypt(process.env.PAYMENT_API_KEY);

        if (apiKeyHeader !== apiKEY) {
            return NextResponse.json({ error: "Unauthorized request" }, { status: 401 });
        }

        const data = await req.json();

        // data holds the verify response data
        if (data.status === "COMPLETED" && data.metadata && data.metadata.order_id) {
            const orderId = data.metadata.order_id;

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "PAID",
                    isAbnormal: false
                }
            });

            return NextResponse.json({ success: true, message: "Payment status updated via Webhook." });
        }

        return NextResponse.json({ success: false, message: "Payment not completed or invalid payload." }, { status: 400 });
    } catch (error) {
        console.error("Payment Webhook Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
