import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { couponSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        // Partial validation for updates
        const data = couponSchema.partial().parse(body);

        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                ...data,
                startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
                endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
            },
        });

        return NextResponse.json({ ok: true, data: coupon });
    } catch (error) {
        return apiError(error, "Update Coupon");
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const coupon = await prisma.coupon.findUnique({ where: { id } });

        if (!coupon) {
            return NextResponse.json({ ok: false, message: "Coupon not found" }, { status: 404 });
        }

        if (coupon.usedCount > 0) {
            return NextResponse.json(
                { ok: false, message: "Cannot delete used coupon. Deactivate it instead." },
                { status: 400 }
            );
        }

        await prisma.coupon.delete({ where: { id } });
        return NextResponse.json({ ok: true, message: "Coupon deleted" });
    } catch (error) {
        return apiError(error, "Delete Coupon");
    }
}
