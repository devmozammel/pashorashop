import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return null;
    }

    return session;
}

export function unauthorizedResponse() {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
}
