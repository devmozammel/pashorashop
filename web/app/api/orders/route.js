
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        const body = await req.json();
        const { items, shippingAddress, paymentMethod, userId } = body;

        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;
            const price = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
            subtotal += Number(price) * item.quantity;
        }

        const shippingCost = 60; // Fixed for now
        const total = subtotal + shippingCost;
        const orderNumber = "ORD-" + Date.now();

        const order = await prisma.order.create({
            data: {
                orderNumber,
                userId: userId || null,
                status: "PENDING",
                total,
                subtotal,
                shippingCost,
                paymentMethod,
                paymentStatus: "PENDING",
                shippingAddress,
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
