import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Current user's withdrawal history
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!profile) {
            return NextResponse.json({ error: "Not an affiliate" }, { status: 404 });
        }

        const requests = await prisma.withdrawRequest.findMany({
            where: { affiliateId: profile.id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.error("[WITHDRAW_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Submit a new withdrawal request
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, paymentMethod, paymentNumber } = body;

        if (!amount || !paymentMethod || !paymentNumber) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const parsedAmount = parseInt(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (parsedAmount < 100) {
            return NextResponse.json({ error: "সর্বনিম্ন উইথড্র পরিমাণ ৳100" }, { status: 400 });
        }

        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId: session.user.id },
        });

        if (!profile || profile.status !== "APPROVED") {
            return NextResponse.json({ error: "Your affiliate account is not approved" }, { status: 403 });
        }

        if (parsedAmount > profile.pendingEarnings) {
            return NextResponse.json({ error: "Amount exceeds your pending earnings" }, { status: 400 });
        }

        // Check if there's already a PENDING withdrawal request
        const existingPending = await prisma.withdrawRequest.findFirst({
            where: { affiliateId: profile.id, status: "PENDING" },
        });

        if (existingPending) {
            return NextResponse.json({ error: "You already have a pending withdrawal request" }, { status: 400 });
        }

        const request = await prisma.withdrawRequest.create({
            data: {
                affiliateId: profile.id,
                amount: parsedAmount,
                paymentMethod,
                paymentNumber,
            },
        });

        return NextResponse.json(request, { status: 201 });
    } catch (error) {
        console.error("[WITHDRAW_POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
