import { prisma } from "@/lib/prisma";

export async function validateCoupon(code, orderTotal) {
    if (!code) return { valid: false, error: "Code required" };

    const coupon = await prisma.coupon.findUnique({
        where: { code }
    });

    if (!coupon) return { valid: false, error: "Invalid coupon code" };
    if (!coupon.isActive) return { valid: false, error: "Coupon is inactive" };

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return { valid: false, error: "Coupon not yet active" };
    if (coupon.endsAt && now > coupon.endsAt) return { valid: false, error: "Coupon expired" };

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: "Coupon usage limit reached" };

    if (coupon.minOrder && orderTotal < coupon.minOrder) {
        return { valid: false, error: `Minimum order amount is ${coupon.minOrder}` };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
        discountAmount = Math.floor((orderTotal * coupon.discount) / 100); // User asked for floor
    } else {
        discountAmount = coupon.discount; // Fixed amount
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > orderTotal) discountAmount = orderTotal;

    return {
        valid: true,
        coupon,
        discountAmount,
        finalSubtotal: orderTotal - discountAmount,
        message: "Coupon applied"
    };
}
