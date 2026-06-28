import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, name: true, email: true, phone: true }
        });
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, phone } = await req.json();

        // --- 🔒 INPUT VALIDATION & SANITIZATION ---
        const nameStr = name !== undefined ? String(name).trim() : undefined;
        const phoneStr = phone !== undefined ? String(phone).trim() : undefined;

        if (nameStr !== undefined) {
            if (nameStr.length < 2 || nameStr.length > 100) {
                return NextResponse.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
            }
        }

        if (phoneStr !== undefined && phoneStr !== "") {
            const digits = phoneStr.replace(/\D/g, "");
            if (digits.length < 10 || digits.length > 15) {
                return NextResponse.json({ error: "Phone number must be between 10 and 15 digits." }, { status: 400 });
            }
        }

        // Update User
        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: nameStr || undefined,
                phone: phoneStr || undefined
            }
        });

        return NextResponse.json(user);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
