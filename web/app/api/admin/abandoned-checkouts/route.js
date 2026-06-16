import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const checkouts = await prisma.abandonedCheckout.findMany({
            orderBy: {
                updatedAt: "desc"
            }
        });

        return NextResponse.json({ ok: true, data: checkouts });
    } catch (error) {
        console.error("Fetch abandoned checkouts error:", error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ ok: false, message: "ID is required" }, { status: 400 });
        }

        await prisma.abandonedCheckout.delete({
            where: { id }
        });

        return NextResponse.json({ ok: true, message: "Draft checkout deleted successfully" });
    } catch (error) {
        console.error("Delete abandoned checkout error:", error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
