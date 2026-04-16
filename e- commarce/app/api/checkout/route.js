
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCoupon } from "@/lib/coupon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOrderConfirmationEmail, sendAdminNewOrderAlert } from "@/lib/email";
import { decrypt } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
    items: z.array(z.object({
        product: z.object({
            id: z.string(),
            name: z.string(),
            price: z.number().int(),
            salePrice: z.number().int().nullable().optional(),
        }),
        variant: z.object({
            id: z.string(),
            size: z.string().optional().nullable(),
            color: z.string().optional().nullable(),
            priceAdjustment: z.number().int().optional(),
            stock: z.number().int().optional(),
        }).nullable().optional(),
        quantity: z.number().int().min(1),
        price: z.number().int().optional(),
    })),
    customer: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().min(1),
        address: z.string().min(1),
        city: z.string().min(1),
        shippingArea: z.enum(["inside", "outside"]),
        paymentMethod: z.enum(["COD", "ONLINE", "CARD"]),
    }),
    shippingCost: z.number().int(),
    couponCode: z.string().optional().nullable(),
    affiliateCode: z.string().optional().nullable(),
    // total: z.number().int(), // User total is ignored for security, we recalculate
});

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { success } = rateLimit(ip, 5); // 5 checkouts per minute
        if (!success) {
            return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        const body = await req.json();
        const { items, customer, shippingCost, couponCode, affiliateCode } = checkoutSchema.parse(body);

        // --- SECURITY CHECK: Blacklist ---
        const blacklisted = await prisma.blacklist.findFirst({
            where: {
                OR: [
                    { phone: customer.phone },
                    { ip: ip }
                ]
            }
        });

        if (blacklisted) {
            return NextResponse.json({
                error: "Your order could not be processed due to a security restriction (B-01). Please contact support."
            }, { status: 403 });
        }
        // ---------------------------------
        // Assuming: inside=60, outside=120 (hardcoded for now or fetch from settings)
        // Ideally fetch from DB settings
        // For now, trust the UI sent cost OR strictly enforce. 
        // Let's rely on server calculation if possible, or just accept for now but validate broadly.

        const order = await prisma.$transaction(async (tx) => {
            let calculatedSubtotal = 0;
            let totalAffiliateCommission = 0;
            const orderItemsData = [];
            const stockUpdates = [];

            // 1. Calculate Subtotal & Validate Stock
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.product.id },
                    include: { variants: true }
                });

                if (!product) throw new Error(`Product "${item.product.name}" not found`);

                let unitPrice = product.salePrice ?? product.price;

                // Enforce Flash Sale Pricing in Checkout
                const activeFlashSaleItem = await tx.flashSaleItem.findFirst({
                    where: {
                        productId: product.id,
                        isActive: true,
                        flashSale: {
                            isActive: true,
                            startsAt: { lte: new Date() },
                            endsAt: { gte: new Date() }
                        }
                    }
                });

                if (activeFlashSaleItem) {
                    unitPrice = activeFlashSaleItem.salePrice;
                }

                const allowedPaymentMethods = product.paymentMethods || "BOTH";
                if (customer.paymentMethod === "COD" && allowedPaymentMethods === "ONLINE") {
                    throw new Error(`"${product.name}" requires Online Payment. Cash on Delivery is not available.`);
                }
                if ((customer.paymentMethod === "ONLINE" || customer.paymentMethod === "CARD") && allowedPaymentMethods === "COD") {
                    throw new Error(`"${product.name}" is Cash on Delivery only. Online Payment is not available.`);
                }

                let variantId = null;
                let variantLabel = "";

                if (item.variant?.id) {
                    const variant = product.variants.find(v => v.id === item.variant.id);
                    if (!variant) throw new Error(`Variant for "${product.name}" not found`);

                    if (variant.stock < item.quantity) {
                        const label = [variant.size, variant.color].filter(Boolean).join(" / ");
                        throw new Error(`Insufficient stock for "${product.name}" (${label})`);
                    }

                    unitPrice += (variant.priceAdjustment || 0);
                    variantId = variant.id;
                    variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ");

                    stockUpdates.push({ type: 'variant', id: variant.id, quantity: item.quantity });
                } else {
                    if (product.stock < item.quantity) throw new Error(`Insufficient stock for "${product.name}"`);
                    stockUpdates.push({ type: 'product', id: product.id, quantity: item.quantity });
                }

                const itemTotal = unitPrice * item.quantity;
                calculatedSubtotal += itemTotal;

                // Calculate product-specific affiliate commission
                const commissionRate = product.affiliateCommissionRate || 0;
                totalAffiliateCommission += Math.floor((itemTotal * commissionRate) / 100);

                orderItemsData.push({
                    productId: product.id,
                    variantId,
                    name: product.name + (variantLabel ? ` — ${variantLabel}` : ""),
                    unitPrice,
                    quantity: item.quantity,
                    total: itemTotal,
                });
            }

            // 2. Validate Coupon & Calculate Discount
            let discountAmount = 0;
            let finalCouponCode = null;

            if (couponCode) {
                const couponResult = await validateCoupon(couponCode, calculatedSubtotal);
                if (couponResult.valid) {
                    discountAmount = couponResult.discountAmount;
                    finalCouponCode = couponCode;

                    // Increment usage
                    await tx.coupon.update({
                        where: { code: couponCode },
                        data: { usedCount: { increment: 1 } }
                    });
                }
                // If invalid, we ignore it (or could throw error if strict)
            }

            const calculatedTotal = calculatedSubtotal + shippingCost - discountAmount;

            // 3. Create Order
            const createdOrder = await tx.order.create({
                data: {
                    orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    ...(userId ? { user: { connect: { id: userId } } } : {}),
                    status: "PENDING",
                    paymentStatus: "PENDING",
                    total: calculatedTotal > 0 ? calculatedTotal : 0,
                    subtotal: calculatedSubtotal,
                    discount: discountAmount,
                    couponCode: finalCouponCode,
                    paymentMethod: customer.paymentMethod,
                    isAbnormal: customer.paymentMethod !== "COD",
                    deliveryArea: customer.shippingArea,
                    deliveryFee: shippingCost,
                    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
                    phone: customer.phone,
                    address: customer.address,
                    city: customer.city,
                    shippingAddress: {
                        address: customer.address,
                        city: customer.city,
                        firstName: customer.firstName,
                        lastName: customer.lastName,
                        phone: customer.phone,
                        shippingArea: customer.shippingArea
                    },
                    items: {
                        create: orderItemsData
                    },
                    history: {
                        create: {
                            status: "PENDING",
                            note: "Order placed by customer"
                        }
                    }
                }
            });

            // 4. Update Stock
            for (const update of stockUpdates) {
                if (update.type === 'variant') {
                    await tx.productVariant.update({
                        where: { id: update.id },
                        data: { stock: { decrement: update.quantity } }
                    });
                } else {
                    await tx.product.update({
                        where: { id: update.id },
                        data: { stock: { decrement: update.quantity } }
                    });
                }
            }

            // 5. Clear User Cart if logged in (Optional but good UX)
            if (userId) {
                await tx.cart.deleteMany({ where: { userId } });
            }

            // 5.5 Reward Affiliate if applicable
            if (affiliateCode) {
                const affiliate = await tx.affiliateProfile.findUnique({
                    where: { code: affiliateCode }
                });
                if (affiliate && affiliate.status === "APPROVED") {
                    if (totalAffiliateCommission > 0) {
                        await tx.affiliateTransaction.create({
                            data: {
                                affiliateId: affiliate.id,
                                orderId: createdOrder.id,
                                commissionAmount: totalAffiliateCommission,
                                status: "PENDING"
                            }
                        });
                        // Update pending earnings
                        await tx.affiliateProfile.update({
                            where: { id: affiliate.id },
                            data: { pendingEarnings: { increment: totalAffiliateCommission } }
                        });
                    }
                }
            }

            // 6. Notify Admin
            await tx.notification.create({
                data: {
                    userId: null,
                    type: "NEW_ORDER",
                    message: `New order ${createdOrder.orderNumber} placed by ${createdOrder.customerName}`
                }
            });

            return createdOrder;
        });

        // Get customer email if logged in
        let customerEmail = "customer@authenticbazar.com";
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
            if (user?.email) customerEmail = user.email;
        }

        let paymentUrl = null;
        if (customer.paymentMethod === "ONLINE" || customer.paymentMethod === "CARD") {
            const baseURL = decrypt(process.env.PAYMENT_BASE_URL);
            const apiKEY = decrypt(process.env.PAYMENT_API_KEY);

            const protocol = req.headers.get("x-forwarded-proto") || "http";
            const host = req.headers.get("host");
            const appUrl = `${protocol}://${host}`;

            const payload = {
                full_name: order.customerName,
                email: customerEmail,
                amount: order.total.toString(),
                metadata: {
                    order_id: order.id,
                    order_number: order.orderNumber,
                    user_id: userId || 'guest'
                },
                redirect_url: `${appUrl}/api/payment/verify`,
                return_type: 'GET',
                cancel_url: `${appUrl}/checkout`,
                webhook_url: `${appUrl}/api/payment/webhook`
            };

            const upRes = await fetch(`${baseURL}/api/checkout-v2`, {
                method: 'POST',
                headers: {
                    'RT-UDDOKTAPAY-API-KEY': apiKEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const upData = await upRes.json();
            if (upData.status && upData.payment_url) {
                paymentUrl = upData.payment_url;
            } else {
                console.error("UddoktaPay Error:", upData);
                throw new Error("Failed to initialize payment gateway. Please try again.");
            }
        }

        // ── SEND EMAILS (non-blocking, silent failure)
        const fullOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: true }
        });

        // Get customer email if logged in
        if (!customerEmail || customerEmail === "customer@authenticbazar.com") {
            if (userId) {
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
                if (user?.email) customerEmail = user.email;
            } else {
                customerEmail = null;
            }
        }

        // Fire emails in parallel, don't await — order response comes first
        Promise.allSettled([
            customerEmail !== "customer@authenticbazar.com" ? sendOrderConfirmationEmail({ order: fullOrder, email: customerEmail }) : Promise.resolve(),
            sendAdminNewOrderAlert({ order: fullOrder }),
        ]).catch(() => { });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            paymentUrl: paymentUrl
        });

    } catch (error) {
        console.error("Checkout Error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || "Something went wrong" }, { status: 500 });
    }
}
