import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId: session.user.id },
            include: {
                product: {
                    select: {
                        id: true, name: true, slug: true, price: true, salePrice: true, images: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(wishlist);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await req.json();

        // Check uniqueness
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId
                }
            }
        });

        if (existing) {
            // Already in wishlist, remove it (Toggle behavior) or error?
            // Usually POST = Add. DELETE = Remove.
            // Only toggle if specified. Let's assume POST means ADD.
            return NextResponse.json({ message: "Already in wishlist" });
        }

        const item = await prisma.wishlist.create({
            data: {
                userId: session.user.id,
                productId
            }
        });

        return NextResponse.json(item);

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
        const productId = searchParams.get("productId");

        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId
                }
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
