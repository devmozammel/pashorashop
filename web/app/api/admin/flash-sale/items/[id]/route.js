import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();

        // Validation could be improved but basic update for now
        const item = await prisma.flashSaleItem.update({
            where: { id },
            data: {
                salePrice: body.salePrice,
                isActive: body.isActive
            }
        });

        return NextResponse.json({ ok: true, data: item });
    } catch (error) {
        return apiError(error, "Update Flash Sale Item");
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        await prisma.flashSaleItem.delete({ where: { id } });

        return NextResponse.json({ ok: true, message: "Item removed" });
    } catch (error) {
        return apiError(error, "Delete Flash Sale Item");
    }
}
