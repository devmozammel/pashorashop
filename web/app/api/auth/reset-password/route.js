import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators";
import { getClientIP } from "@/lib/utils/ip";

export async function POST(req) {
    try {
        const ip = getClientIP(req);
        const { success } = rateLimit(ip, 5);
        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }


        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: "Token and new password are required" },
                { status: 400 }
            );
        }

        // Validate password with new schema
        const passValidation = passwordSchema.safeParse(newPassword);
        if (!passValidation.success) {
            const formatted = passValidation.error.format();
            const firstError = formatted._errors?.[0] || "পাসওয়ার্ড সঠিক নয়। সব নিয়ম মেনে আবার চেষ্টা করুন।";
            return NextResponse.json(
                { error: firstError },
                { status: 400 }
            );
        }

        // Re-hash the provided hex token to map it to our DB's hashed Token
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Attempt to find user with this valid reset token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: hashedToken,
                resetTokenExpiry: {
                    gt: new Date(), // Check if expiry is in the future
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired password reset token" },
                { status: 400 }
            );
        }

        // Encrypt the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user: Change password, and clear out the reset tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Password reset successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
