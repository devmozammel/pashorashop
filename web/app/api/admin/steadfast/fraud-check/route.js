import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { checkSteadfastFraud } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");
        const orderId = searchParams.get("orderId");
        const force = searchParams.get("force") === "true";

        if (!phone) {
            return NextResponse.json({ ok: false, message: "Phone number is required" }, { status: 400 });
        }

        const fraudResult = await checkSteadfastFraud(phone, { force });

        // If an order ID was passed and fraud data is available, persist it
        if (orderId && fraudResult.ok) {
            try {
                const order = await prisma.order.findUnique({
                    where: { id: orderId },
                    select: { shippingAddress: true }
                });
                if (order) {
                    const currentAddr = order.shippingAddress && typeof order.shippingAddress === "object" ? order.shippingAddress : {};
                    await prisma.order.update({
                        where: { id: orderId },
                        data: {
                            shippingAddress: {
                                ...currentAddr,
                                steadfastFraud: fraudResult
                            }
                        }
                    });
                }
            } catch (saveErr) {
                console.error("Failed to persist fraud result to order:", saveErr.message);
            }
        }

        return NextResponse.json(fraudResult);
    } catch (err) {
        console.error("Steadfast fraud check route error:", err);
        return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
    }
}
