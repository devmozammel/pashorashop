import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: { isDefault: "desc" } // Default first
        });

        return NextResponse.json(addresses);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();

        // If setting default, unset others
        if (body.isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id },
                data: { isDefault: false }
            });
        }

        const address = await prisma.address.create({
            data: {
                userId: session.user.id,
                ...body
            }
        });

        return NextResponse.json(address);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        await prisma.address.delete({
            where: { id, userId: session.user.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
