import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function PATCH(req, { params }) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const { isApproved } = body;

        if (typeof isApproved !== "boolean") {
            return NextResponse.json({ error: "isApproved must be a boolean" }, { status: 400 });
        }

        const updatedReview = await prisma.review.update({
            where: { id },
            data: { isApproved }
        });

        return NextResponse.json(updatedReview);
    } catch (error) {
        console.error("Error updating review:", error);
        return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;

        await prisma.review.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
