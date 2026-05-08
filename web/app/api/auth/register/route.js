import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators";

export async function POST(request) {
    try {
        const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, 5); // 5 registrations per minute per IP
        if (!success) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const { name, email, password } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const passValidation = passwordSchema.safeParse(password);
        if (!passValidation.success) {
            const formatted = passValidation.error.format();
            const firstError = formatted._errors?.[0] || "পাসওয়ার্ড সঠিক নয়। সব নিয়ম মেনে আবার চেষ্টা করুন।";
            return NextResponse.json({ error: firstError }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
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
