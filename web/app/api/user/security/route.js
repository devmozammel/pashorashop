import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password too short" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: "Cannot update password for this account type" }, { status: 400 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 403 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Password update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
