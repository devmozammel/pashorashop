import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * EMERGENCY ADMIN PROMOTION ROUTE
 * Usage: GET /api/admin/temp-promote?email=USER_EMAIL&secret=ADMIN_PROMO_SECRET
 * This route is for one-time recovery and should be deleted after use.
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const secret = searchParams.get("secret");

        if (!email || !secret) {
            return NextResponse.json({ error: "Missing email or secret" }, { status: 400 });
        }

        if (secret !== process.env.ADMIN_PROMO_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.update({
            where: { email },
            data: { role: "ADMIN" }
        });

        return NextResponse.json({
            success: true,
            message: `User ${email} has been promoted to ADMIN successfully.`,
            note: "Please delete this API route after verification for security."
        });

    } catch (error) {
        console.error("Promotion Error:", error);
        return NextResponse.json({ 
            error: "Failed to promote user. Ensure the user exists.",
            details: error.message 
        }, { status: 500 });
    }
}
