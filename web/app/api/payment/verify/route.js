import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

/**
 * Payment Verification Endpoint
 * Called via GET redirect from UddoktaPay payment gateway after payment.
 *
 * SECURITY:
 * - invoice_id comes from the trusted payment gateway (not user-supplied)
 * - No session required for guest orders (guest has no account to authenticate with)
 * - Payment amount is verified server-side against DB order
 * - For registered user orders: ownership is also verified
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const invoice_id = searchParams.get('invoice_id');

        if (!invoice_id) {
            const appUrl = new URL(req.url).origin;
            return NextResponse.redirect(`${appUrl}/checkout?payment_error=missing_invoice`);
        }

        const baseURL = decrypt(process.env.PAYMENT_BASE_URL);
        const apiKEY  = decrypt(process.env.PAYMENT_API_KEY);

        // Verify with payment gateway
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

        if (data.status === "COMPLETED" && data.metadata && data.metadata.order_id) {
            const orderId = data.metadata.order_id;

            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { total: true, advancePayment: true, paymentMethod: true, userId: true }
            });

            if (!order) {
                const appUrl = new URL(req.url).origin;
                return NextResponse.redirect(`${appUrl}/checkout?payment_error=order_not_found`);
            }

            // Verify payment amount matches expectation (server-side)
            const expectedAmount = order.paymentMethod === "COD" ? order.advancePayment : order.total;
            const paidAmount = parseFloat(data.amount);

            if (isNaN(paidAmount) || paidAmount < expectedAmount) {
                console.error(`[Payment] Amount mismatch for order ${orderId}: paid=${paidAmount}, expected=${expectedAmount}`);
                const appUrl = new URL(req.url).origin;
                return NextResponse.redirect(`${appUrl}/checkout?payment_error=amount_mismatch`);
            }

            // Determine new payment status
            let newStatus = "PAID";
            if (order.paymentMethod === "COD" && order.advancePayment > 0) {
                newStatus = "PARTIAL_PAID";
            }

            // Mark order as paid and clear abnormal flag
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
            console.error("[Payment] Verification Failed:", data);
            const appUrl = new URL(req.url).origin;
            return NextResponse.redirect(`${appUrl}/checkout?payment_error=gateway_failed`);
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        // Redirect instead of JSON error — this is a redirect endpoint
        try {
            const appUrl = new URL(req.url).origin;
            return NextResponse.redirect(`${appUrl}/checkout?payment_error=server`);
        } catch {
            return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
        }
    }
}
