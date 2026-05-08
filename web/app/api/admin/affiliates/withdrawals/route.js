import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: All withdrawal requests (for admin)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const requests = await prisma.withdrawRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                affiliate: {
                    include: {
                        user: { select: { name: true, email: true } },
                    },
                },
            },
        });

        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.error("[ADMIN_WITHDRAWALS_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
