export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all blacklisted entries
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const entries = await prisma.blacklist.findMany({
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a user to blacklist
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { phone, ip, reason } = await req.json();

        if (!phone && !ip) {
            return NextResponse.json({ error: "Phone number or IP is required" }, { status: 400 });
        }

        const entry = await prisma.blacklist.create({
            data: {
                phone,
                ip,
                reason,
                blockedBy: session.user.email
            }
        });

        return NextResponse.json(entry);

    } catch (error) {
        if (error.code === 'P2002') { // Unique constraint violation
            return NextResponse.json({ error: "User already blacklisted" }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Remove from blacklist by ID
export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        await prisma.blacklist.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
