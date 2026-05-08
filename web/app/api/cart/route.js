import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ items: [] });
        }

        const cart = await prisma.cart.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { id: true, name: true, price: true, salePrice: true, slug: true, images: true }
                        },
                        variant: {
                            select: { id: true, size: true, color: true, priceAdjustment: true, stock: true }
                        }
                    }
                }
            }
        });

        if (!cart) return NextResponse.json({ items: [] });

        // Format items for frontend
        const items = cart.items.map(item => ({
            id: item.id, // CartItem ID
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            product: item.product,
            variant: item.variant
        }));

        return NextResponse.json({ items });

    } catch (error) {
        console.error("Cart API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId, variantId, quantity } = await req.json();

        // 1. Get or Create Cart
        let cart = await prisma.cart.findUnique({
            where: { userId: session.user.id }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId: session.user.id }
            });
        }

        // 2. Check if item exists
        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId,
                variantId: variantId || null // exact match logic
            }
        });

        if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: quantity } // Set absolute quantity (or increment? Assume Set from frontend store)
                // If frontend sends 'increment', logic changes. Usually 'sync' is simpler with absolute or add.
                // Let's assume this POST is "Add/Update". If typically "Add to Cart", we might want increment.
                // But if it's "Update Cart Quantity" from cart page, it's absolute.
                // I'll assume ABSOLUTE quantity for simplicity in this specific endpoint, 
                // OR handle logic: if quantity provided > 0, set it.
            });
        } else {
            // Create new
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    variantId: variantId || null,
                    quantity
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get("itemId");

        if (itemId) {
            await prisma.cartItem.delete({ where: { id: itemId } });
        } else {
            // Clear cart? Or error?
            // Let's require itemId
            return NextResponse.json({ error: "ItemId required" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
