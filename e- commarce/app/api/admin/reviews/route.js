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
                    select: { name: true, email: true }
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
