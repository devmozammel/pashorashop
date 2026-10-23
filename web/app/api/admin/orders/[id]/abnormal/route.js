import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const { isAbnormal } = body;

        const order = await prisma.order.update({
            where: { id },
            data: { isAbnormal: !!isAbnormal }
        });

        return NextResponse.json({ ok: true, data: order });
    } catch (error) {
        return apiError(error, "Toggle Abnormal Status");
    }
}
