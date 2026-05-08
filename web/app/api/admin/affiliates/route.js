import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const affiliates = await prisma.affiliateProfile.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                _count: { select: { transactions: true } }
            }
        });

        return NextResponse.json(affiliates, { status: 200 });
    } catch (error) {
        console.error("Admin Affiliate GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
