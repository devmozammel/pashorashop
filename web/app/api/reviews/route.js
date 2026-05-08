import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { productId, isApproved: true }, // Only approved reviews
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(reviews);
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

        const { productId, rating, comment } = await req.json();

        // 1. Verify Purchase (Optional requirement but good for "verified")
        // Check if user has a DELIVERED order containing this product
        const hasPurchased = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: "DELIVERED",
                items: {
                    some: { productId }
                }
            }
        });

        // 2. Check for existing review
        const existing = await prisma.review.findFirst({
            where: { userId: session.user.id, productId }
        });

        if (existing) {
            return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
        }

        const review = await prisma.review.create({
            data: {
                userId: session.user.id,
                productId,
                rating: parseInt(rating),
                comment,
                isVerified: !!hasPurchased, // Mark verified if purchased
                isApproved: true // Auto-approve or false if moderation needed
            }
        });

        return NextResponse.json(review);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
