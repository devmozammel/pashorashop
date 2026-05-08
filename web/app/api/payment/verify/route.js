import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const invoice_id = searchParams.get('invoice_id');

        if (!invoice_id) {
            return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
        }

        const baseURL = decrypt(process.env.PAYMENT_BASE_URL);
        const apiKEY = decrypt(process.env.PAYMENT_API_KEY);

        const upRes = await fetch(`${baseURL}/verify-payment`, {
            method: 'POST',
            headers: {
                'RT-UDDOKTAPAY-API-KEY': apiKEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ invoice_id })
        });

        const data = await upRes.json();

        // Metadata contains our specific fields we sent in create charge
        if (data.status === "COMPLETED" && data.metadata && data.metadata.order_id) {
            const orderId = data.metadata.order_id;

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { total: true, advancePayment: true, paymentMethod: true }
            });

            if (!order) throw new Error("Order not found");

            // Logic to determine if it's partial or full
            let newStatus = "PAID";
            if (order.paymentMethod === "COD" && order.advancePayment > 0) {
                newStatus = "PARTIAL_PAID";
            }

            // Mark order as PAID/PARTIAL_PAID and clear abnormal flag
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: newStatus,
                    isAbnormal: false
                }
            });

            // Redirect to success page
            const appUrl = new URL(req.url).origin;
            return NextResponse.redirect(`${appUrl}/order-success/${orderId}`);
        } else {
            console.error("Payment Verification Failed:", data);

            // If failed, redirect back to checkout or show error
            const appUrl = new URL(req.url).origin;
            return NextResponse.redirect(`${appUrl}/checkout?payment_error=true`);
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
    }
}
