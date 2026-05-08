import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return NextResponse.json({ error: "Notification not found" }, { status: 404 });
        }

        if (notification.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
        }

        await prisma.notification.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting notification:", error);
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
    }
}
