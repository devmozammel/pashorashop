import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { couponSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";


export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const data = couponSchema.parse(body);

        const existing = await prisma.coupon.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            return NextResponse.json(
                { ok: false, message: "Coupon code already exists" },
                { status: 409 }
            );
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: data.code,
                discountType: data.discountType,
                discountValue: data.discountValue,
                minOrderAmount: data.minOrderAmount,
                maxUsage: data.maxUsage,
                startsAt: data.startsAt ? new Date(data.startsAt) : null,
                endsAt: data.endsAt ? new Date(data.endsAt) : null,
                isActive: data.isActive,
                productId: data.productId || null,
                userId: data.userId || null,
            },
        });

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user.id || admin.user.email,
            action: "CREATE",
            entityType: "Coupon",
            entityId: coupon.id,
            meta: { code: coupon.code, value: coupon.discountValue },
            ip
        });

        return NextResponse.json({ ok: true, data: coupon }, { status: 201 });
    } catch (error) {
        return apiError(error, "Create Coupon");
    }
}

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ ok: true, data: coupons });
    } catch (error) {
        return apiError(error, "Get Coupons");
    }
}
