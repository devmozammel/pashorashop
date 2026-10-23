export const dynamic = "force-dynamic";

/**
 * LEGACY ORDER CREATION ENDPOINT
 *
 * ⚠️  This endpoint is DEPRECATED.
 * Use /api/checkout instead — it has full validation, stock checks,
 * rate limiting, blacklist checking, coupon support, and payment integration.
 *
 * This endpoint is kept ONLY for backward compatibility but is now auth-protected.
 */
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        // SECURITY: Require authentication — no more unauthenticated order creation
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required to create an order" }, { status: 401 });
        }

        const body = await req.json();
        const { items, shippingAddress, paymentMethod } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Order items are required" }, { status: 400 });
        }

        // Calculate totals server-side (never trust client prices)
        let subtotal = 0;
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;
            const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
            subtotal += Number(price) * item.quantity;
        }

        const shippingCost = 60; // Fixed for this legacy endpoint
        const total = subtotal + shippingCost;
        const orderNumber = "ORD-" + Date.now();

        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: session.user.id, // Always use verified session userId
                status: "PENDING",
                total,
                subtotal,
                deliveryFee: shippingCost,
                paymentMethod: paymentMethod || "COD",
                paymentStatus: "PENDING",
                shippingAddress,
                customerName: session.user.name || "Customer",
                phone: shippingAddress?.phone || "",
                address: shippingAddress?.street || shippingAddress?.address || "",
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        unitPrice: item.price,
                        quantity: item.quantity,
                        total: item.price * item.quantity
                    }))
                }
            }
        });

        return NextResponse.json(order);

    } catch (error) {
        console.error("Order create error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}
