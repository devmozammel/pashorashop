import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Requires strict ADMIN role (for settings, user management, financials, etc.).
 */
export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return null;
    }

    return session;
}

/**
 * Allows both ADMIN and MODERATOR roles (for Social Inbox, Orders, and Products).
 */
export async function requireStaff() {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMIN", "MODERATOR"].includes(session.user.role)) {
        return null;
    }

    return session;
}

/**
 * Resolve the actual Prisma User.id for the logged-in staff member (returns null for master-admin fallback if not in DB).
 */
export async function resolveStaffDbUserId(session) {
    const rawId = session?.user?.id;
    const email = session?.user?.email;

    if (rawId && rawId !== "master-admin") {
        const exists = await prisma.user.findUnique({ where: { id: rawId }, select: { id: true } });
        if (exists) return exists.id;
    }
    if (email) {
        const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (byEmail) return byEmail.id;
    }
    return null;
}

export function unauthorizedResponse() {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}
