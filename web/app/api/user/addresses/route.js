import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserClient } from "@/lib/userSession"; // Or getServerSession
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { isDefault: "desc" },
                { createdAt: "desc" }
            ]
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error("Address GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { isDefault, phone, city, areaType, address, note } = body;

        if (!phone || !city || !areaType || !address) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // If this is set as default, unset others first
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: session.user.id,
                isDefault: isDefault || false,
                phone,
                city,
                areaType,
                address,
                note
            }
        });

        return NextResponse.json(newAddress);
    } catch (error) {
        console.error("Address POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
