import prisma from "@/lib/prisma";

export async function validateCoupon(code, orderTotal, items = [], userId = null) {
    if (!code) return { valid: false, error: "Code required" };

    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });

    if (!coupon) return { valid: false, error: "Invalid coupon code" };
    if (!coupon.isActive) return { valid: false, error: "Coupon is inactive" };

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) return { valid: false, error: "Coupon not yet active" };
    if (coupon.endsAt && now > coupon.endsAt) return { valid: false, error: "Coupon expired" };

    if (coupon.maxUsage && coupon.usedCount >= coupon.maxUsage) return { valid: false, error: "Coupon usage limit reached" };

    if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
        return { valid: false, error: `Minimum order amount of ৳${coupon.minOrderAmount} required` };
    }

    // User-specific validation
    if (coupon.userId) {
        if (!userId) {
            return { valid: false, error: "Please log in to use this coupon" };
        }
        if (userId !== coupon.userId) {
            return { valid: false, error: "This coupon is only valid for a specific user" };
        }
    }

    // Product-specific validation & discount calculation
    let discountAmount = 0;
    if (coupon.productId) {
        // Filter items in the cart that match the coupon's productId
        const productItems = items.filter(item => 
            item.productId === coupon.productId || 
            item.product?.id === coupon.productId
        );

        if (productItems.length === 0) {
            return { valid: false, error: "This coupon is not valid for the products in your cart" };
        }

        // Calculate the subtotal of the specific product in the cart
        const productSubtotal = productItems.reduce((sum, item) => {
            const itemPrice = item.price || item.unitPrice || (item.product?.salePrice ?? item.product?.price) || 0;
            return sum + (itemPrice * item.quantity);
        }, 0);

        if (coupon.discountType === "PERCENT") {
            discountAmount = Math.floor((productSubtotal * coupon.discountValue) / 100);
        } else {
            discountAmount = Math.min(coupon.discountValue, productSubtotal);
        }
    } else {
        // General coupon applies to the entire order subtotal
        if (coupon.discountType === "PERCENT") {
            discountAmount = Math.floor((orderTotal * coupon.discountValue) / 100);
        } else {
            discountAmount = Math.min(coupon.discountValue, orderTotal);
        }
    }

    return {
        valid: true,
        coupon,
        discountAmount,
        finalSubtotal: orderTotal - discountAmount,
        message: "Coupon applied"
    };
}
