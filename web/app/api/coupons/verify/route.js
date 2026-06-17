import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request) {
    try {
        const { code, total, items } = await request.json(); // total is required for minOrder check

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || null;

        const result = await validateCoupon(code, total || 0, items || [], userId);

        if (!result.valid) {
            return NextResponse.json({
                valid: false,
                message: result.error
            }, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            code: result.coupon.code,
            type: result.coupon.type,
            discountAmount: result.discountAmount,
            finalSubtotal: result.finalSubtotal,
            message: "Coupon applied"
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
