import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";

export async function POST(req) {
    try {
        const { code, subtotal } = await req.json();

        if (!code || subtotal === undefined) {
            return NextResponse.json(
                { ok: false, message: "Code and subtotal are required" },
                { status: 400 }
            );
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            return NextResponse.json(
                { ok: false, message: "Invalid coupon code" },
                { status: 404 }
            );
        }

        if (!coupon.isActive) {
            return NextResponse.json(
                { ok: false, message: "Coupon is inactive" },
                { status: 400 }
            );
        }

        const now = new Date();
        if (coupon.startsAt && now < coupon.startsAt) {
            return NextResponse.json(
                { ok: false, message: "Coupon is not yet active" },
                { status: 400 }
            );
        }
        if (coupon.endsAt && now > coupon.endsAt) {
            return NextResponse.json(
                { ok: false, message: "Coupon has expired" },
                { status: 400 }
            );
        }

        if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) {
            return NextResponse.json(
                { ok: false, message: "Coupon usage limit reached" },
                { status: 400 }
            );
        }

        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            return NextResponse.json(
                {
                    ok: false,
                    message: `Minimum order amount of ${coupon.minOrderAmount} required`,
                },
                { status: 400 }
            );
        }

        let discountAmount = 0;
        if (coupon.discountType === "PERCENT") {
            discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        } else {
            discountAmount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        return NextResponse.json({
            ok: true,
            data: {
                code: coupon.code,
                discountAmount,
                finalTotal: subtotal - discountAmount,
            },
        });
    } catch (error) {
        return apiError(error, "Apply Coupon");
    }
}
