import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { items } = await req.json(); // Local cart items
        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid items format" }, { status: 400 });
        }

        // 1. Get or Create Cart
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: session.user.id }
            });
        }

        // 2. Merge Items (Transactional)
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                // Check if product exists (sanity check)
                const product = await tx.product.findUnique({ where: { id: item.productId || item.product.id } });
                if (!product) continue;

                const productId = product.id;
                const variantId = item.variantId || item.variant?.id || null;
                const quantity = item.quantity;

                // Check existence in DB cart
                const existing = await tx.cartItem.findFirst({
                    where: {
                        cartId: cart.id,
                        productId,
                        variantId
                    }
                });

                if (existing) {
                    // Add quantities (Merge logic)
                    await tx.cartItem.update({
                        where: { id: existing.id },
                        data: { quantity: { increment: quantity } }
                    });
                } else {
                    await tx.cartItem.create({
                        data: {
                            cartId: cart.id,
                            productId,
                            variantId,
                            quantity
                        }
                    });
                }
            }
        });

        return NextResponse.json({ success: true, message: "Cart synced" });

    } catch (error) {
        console.error("Cart Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
