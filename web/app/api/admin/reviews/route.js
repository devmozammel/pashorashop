import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                },
                product: {
                    select: { name: true, slug: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { productId, customerName, customerAvatar, rating, comment, images, isVerified, createdAt } = body;

        if (!productId || !customerName || !rating) {
            return NextResponse.json({ error: "Product ID, customer name, and rating are required" }, { status: 400 });
        }

        const parsedRating = parseInt(rating);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
        }

        // 1. Create a dummy user for the review
        const randomString = Math.random().toString(36).substring(2, 10);
        const dummyEmail = `reviewer-${randomString}@authenticbazar.shop`;
        
        const dummyUser = await prisma.user.create({
            data: {
                name: customerName.trim(),
                image: customerAvatar ? customerAvatar.trim() : null,
                email: dummyEmail,
                role: "USER"
            }
        });

        // 2. Create the review
        const review = await prisma.review.create({
            data: {
                userId: dummyUser.id,
                productId,
                rating: parsedRating,
                comment: comment ? String(comment).trim() : null,
                images: images ? images : null,
                isVerified: isVerified ?? true,
                isApproved: true,
                createdAt: createdAt ? new Date(createdAt) : new Date()
            },
            include: {
                user: {
                    select: { name: true, email: true, image: true }
                },
                product: {
                    select: { name: true, slug: true }
                }
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error("Error creating review:", error);
        return NextResponse.json({ error: error.message || "Failed to create review" }, { status: 500 });
    }
}
