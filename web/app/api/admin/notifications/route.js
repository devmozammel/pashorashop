import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: null }, // Admin notifications have no specific user attached
            orderBy: { createdAt: "desc" },
            take: 20 // Limit to latest 20 for topbar performance
        });

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error("Error fetching admin notifications:", error);
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }
}
