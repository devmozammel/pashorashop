import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, 3); // 3 requests per minute
        if (!success) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Return 200 even if user not found to prevent email enumeration attacks
            return NextResponse.json({
                success: true,
                message: "If an account exists, a password reset link has been sent.",
            });
        }

        // Generate token
        const unhashedToken = crypto.randomBytes(32).toString("hex");

        // Hash token to store in DB (for security if DB leaks)
        const hashedToken = crypto
            .createHash("sha256")
            .update(unhashedToken)
            .digest("hex");

        // Set token to expire in 1 hour
        const tokenExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
            where: { email: user.email },
            data: {
                resetToken: hashedToken,
                resetTokenExpiry: tokenExpiry,
            },
        });

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://authenticbazar.com";
        const resetUrl = `${siteUrl}/auth/reset-password?token=${unhashedToken}`;

        // Send Email using unified utility
        await sendPasswordResetEmail({ user, resetUrl });

        return NextResponse.json({
            success: true,
            message: "If an account exists, a password reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
