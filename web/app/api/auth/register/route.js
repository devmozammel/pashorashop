import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators";
import { getClientIP } from "@/lib/utils/ip";


export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const ip = getClientIP(request);
        const { success } = rateLimit(ip, 20); // 20 registrations per minute per IP to prevent blocking real users
        if (!success) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Normalize email (trim spaces and convert to lowercase)
        const normalizedEmail = email.trim().toLowerCase();

        const passValidation = passwordSchema.safeParse(password);
        if (!passValidation.success) {
            const formatted = passValidation.error.format();
            const firstError = formatted._errors?.[0] || "পাসওয়ার্ড সঠিক নয়। সব নিয়ম মেনে আবার চেষ্টা করুন।";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existingUser) {
            if (!existingUser.password) {
                // Registered via Google OAuth (password is null)
                return NextResponse.json({ 
                    error: "এই ইমেইলটি গুগল দিয়ে রেজিস্টার করা হয়েছে। দয়া করে গুগল দিয়ে লগইন করুন।" 
                }, { status: 400 });
            }
            return NextResponse.json({ error: "ইমেইলটি ইতিমধ্যে রেজিস্টার করা হয়েছে।" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: "USER"
            }
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

