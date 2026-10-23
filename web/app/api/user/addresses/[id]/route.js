import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function PUT(req, props) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;
        const body = await req.json();
        const { isDefault, phone, city, areaType, address, note } = body;

        // Verify ownership
        const existing = await prisma.address.findUnique({
            where: { id }
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
        }

        // If this is set as default, unset others first
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: session.user.id, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id },
            data: { phone, city, areaType, address, note, isDefault }
        });

        return NextResponse.json(updatedAddress);
    } catch (error) {
        console.error("Address PUT error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = params.id;

        // Verify ownership
        const existing = await prisma.address.findUnique({
            where: { id }
        });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
        }

        await prisma.address.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Address DELETE error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
