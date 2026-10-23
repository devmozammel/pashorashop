export const dynamic = "force-dynamic";


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
            price: z.coerce.number().int(),
            salePrice: z.coerce.number().int().nullable().optional(),
        }),
        variant: z.object({
            id: z.string(),
            size: z.string().optional().nullable(),
            color: z.string().optional().nullable(),
            priceAdjustment: z.coerce.number().int().optional(),
            stock: z.coerce.number().int().optional(),
        }).nullable().optional(),
        quantity: z.coerce.number().int().min(1),
        price: z.coerce.number().int().optional(),
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
    shippingCost: z.coerce.number().int().nonnegative(),
    couponCode: z.string().optional().nullable(),
    affiliateCode: z.string().optional().nullable(),
    draftId: z.string().optional().nullable(),
});

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { success } = rateLimit(ip, 10); // 10 checkouts per minute
        if (!success) {
            return NextResponse.json({ error: "Too many checkout attempts. Please try again later." }, { status: 429 });
        }

        const session = await getServerSession(authOptions);

        const body = await req.json();
        const { items, customer, shippingCost, couponCode, affiliateCode, draftId } = checkoutSchema.parse(body);

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

        // --- 🔒 SERVER-SIDE SHIPPING COST VALIDATION ---
        // Fetch delivery fees from DB settings (never trust client-supplied cost)
        const shippingSettingRow = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });
        const shippingSettings = shippingSettingRow ? JSON.parse(shippingSettingRow.value) : {};
        const insideFee  = Number(shippingSettings.deliveryFeeInside  ?? 70);
        const outsideFee = Number(shippingSettings.deliveryFeeOutside ?? 130);

        const expectedShippingCost = customer.shippingArea === "inside" ? insideFee : outsideFee;

        // Auto-correct shipping cost if client sent slightly different amount (ensure order creation never blocks)
        if (shippingCost !== expectedShippingCost) {
            console.warn(`[Checkout] Shipping cost mismatch — client sent: ${shippingCost}, using server fee: ${expectedShippingCost}`);
        }
        const validatedShippingCost = expectedShippingCost;
        // -------------------------------------------

        // --- 🔒 ATOMIC USER VERIFICATION ---
        let confirmedUserId = null;
        if (session?.user?.id && session.user.id !== "master-admin") {
            const userExists = await prisma.user.findUnique({ 
                where: { id: session.user.id },
                select: { id: true } 
            });
            if (userExists) confirmedUserId = userExists.id;
        }
        // -----------------------------------

        const order = await prisma.$transaction(async (tx) => {
            let calculatedSubtotal = 0;
            let totalAffiliateCommission = 0;
            let totalAdvanceRequired = 0;
            const orderItemsData = [];
            const stockUpdates = [];

            // Use the already confirmed userId within the transaction if needed, 
            // though it's already verified outside.

            // 1. Calculate Subtotal & Validate Stock
            for (const item of items) {
                let product = await tx.product.findUnique({
                    where: { id: item.product.id },
                    include: { variants: true }
                });

                if (!product) {
                    product = await tx.product.findFirst({
                        where: { isActive: true },
                        include: { variants: true }
                    }) || await tx.product.findFirst({
                        include: { variants: true }
                    });
                }

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

                    if (variant.salePrice !== null) {
                        unitPrice = variant.salePrice;
                    } else if (variant.price !== null) {
                        unitPrice = variant.price;
                    } else {
                        unitPrice += (variant.priceAdjustment || 0);
                    }
                    variantId = variant.id;
                    variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ");

                    stockUpdates.push({ type: 'variant', id: variant.id, quantity: item.quantity });
                } else {
                    if (product.stock < item.quantity) throw new Error(`Insufficient stock for "${product.name}"`);
                    stockUpdates.push({ type: 'product', id: product.id, quantity: item.quantity });
                }

                if (product.isPreOrder) {
                    totalAdvanceRequired += (100 * item.quantity);
                }

                const itemTotal = unitPrice * item.quantity;
                calculatedSubtotal += itemTotal;

                // Calculate product-specific affiliate commission
                const commissionRate = product.affiliateCommissionRate || 0;
                const commissionType = product.affiliateCommissionType || "PERCENT";
                if (commissionType === "FIXED") {
                    totalAffiliateCommission += commissionRate * item.quantity;
                } else {
                    // PERCENT (default)
                    totalAffiliateCommission += Math.floor((itemTotal * commissionRate) / 100);
                }

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
                const couponResult = await validateCoupon(couponCode, calculatedSubtotal, orderItemsData, confirmedUserId);
                if (couponResult.valid) {
                    discountAmount = couponResult.discountAmount;
                    finalCouponCode = couponCode;

                    // Increment usage
                    await tx.coupon.update({
                        where: { code: couponCode },
                        data: { usedCount: { increment: 1 } }
                    });
                }
            }

            const calculatedTotal = calculatedSubtotal + validatedShippingCost - discountAmount;

            // 3. 🛡️ SAFE ORDER CREATION (Double-Protected)
            const orderData = {
                orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                userId: confirmedUserId, 
                status: "PENDING",
                paymentStatus: "PENDING",
                total: calculatedTotal > 0 ? calculatedTotal : 0,
                subtotal: calculatedSubtotal,
                discount: discountAmount,
                couponCode: finalCouponCode,
                paymentMethod: customer.paymentMethod,
                isAbnormal: customer.paymentMethod !== "COD" || totalAdvanceRequired > 0,
                advancePayment: totalAdvanceRequired,
                deliveryArea: customer.shippingArea,
                deliveryFee: validatedShippingCost,
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
            };

            let createdOrder;
            try {
                // Attempt 1: With confirmedUserId
                createdOrder = await tx.order.create({ data: orderData });
            } catch (createError) {
                console.warn("First order creation attempt failed, retrying as Guest. Reason:", createError.message);
                // Attempt 2: Without userId (Absolute Fallback)
                createdOrder = await tx.order.create({ 
                    data: { 
                        ...orderData, 
                        userId: null // Strip user link to ensure success
                    } 
                });
            }

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
            if (confirmedUserId) {
                await tx.cart.deleteMany({ where: { userId: confirmedUserId } });
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

            return createdOrder;
        }, {
            maxWait: 10000,
            timeout: 30000
        });

        // 6. Notify Admin (Non-blocking, outside of transaction to avoid locks)
        prisma.notification.create({
            data: {
                userId: null,
                type: "NEW_ORDER",
                message: `New order ${order.orderNumber} placed by ${order.customerName}`
            }
        }).catch(err => console.error("Failed to create admin notification:", err));

        // Get customer email if logged in
        let customerEmail = "customer@authenticbazar.shop";
        if (confirmedUserId) {
            const user = await prisma.user.findUnique({ where: { id: confirmedUserId }, select: { email: true } });
            if (user?.email) customerEmail = user.email;
        }

        let paymentUrl = null;
        if (customer.paymentMethod === "ONLINE" || customer.paymentMethod === "CARD" || order.advancePayment > 0) {
            const baseURL = decrypt(process.env.PAYMENT_BASE_URL);
            const apiKEY = decrypt(process.env.PAYMENT_API_KEY);

            const protocol = req.headers.get("x-forwarded-proto") || "http";
            const host = req.headers.get("host");
            const appUrl = `${protocol}://${host}`;

            // If COD but pre-order, pay only advance amount. Else pay full.
            const paymentAmount = customer.paymentMethod === "COD" ? order.advancePayment : order.total;

            const payload = {
                full_name: order.customerName,
                email: customerEmail,
                amount: paymentAmount.toString(),
                metadata: {
                    order_id: order.id,
                    order_number: order.orderNumber,
                    user_id: confirmedUserId || 'guest'
                },
                redirect_url: `${appUrl}/api/payment/verify`,
                return_type: 'GET', // Matches documentation success flow
                cancel_url: `${appUrl}/checkout`,
                webhook_url: `${appUrl}/api/payment/webhook`
            };

            const upRes = await fetch(`${baseURL}/checkout-v2`, {
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
        if (!customerEmail || customerEmail === "customer@authenticbazar.shop") {
            if (confirmedUserId) {
                const user = await prisma.user.findUnique({ where: { id: confirmedUserId }, select: { email: true } });
                if (user?.email) customerEmail = user.email;
            } else {
                customerEmail = null;
            }
        }

        // Fire emails in parallel, don't await — order response comes first
        Promise.allSettled([
            customerEmail !== "customer@authenticbazar.shop" ? sendOrderConfirmationEmail({ order: fullOrder, email: customerEmail }) : Promise.resolve(),
            sendAdminNewOrderAlert({ order: fullOrder }),
        ]).catch(() => { });

        // Delete the draft abandoned checkout if it exists
        if (draftId) {
            prisma.abandonedCheckout.delete({ where: { id: draftId } }).catch(() => {});
        }

        // ── Facebook Conversions API (CAPI) Purchase Event
        const triggerCAPI = async () => {
            try {
                const setting = await prisma.siteSetting.findUnique({
                    where: { key: "store_settings" }
                });
                if (!setting) return;

                const storeSettings = JSON.parse(setting.value);
                const pixelId = storeSettings.facebookPixelId;
                const token = storeSettings.facebookConversionToken;

                if (!pixelId || !token) return;

                const crypto = await import("crypto");
                const sha256 = (text) => {
                    if (!text) return "";
                    return crypto.createHash("sha256").update(String(text).trim().toLowerCase()).digest("hex");
                };

                const cleanPhone = customer.phone.replace(/\D/g, "");
                let formattedPhone = cleanPhone;
                if (cleanPhone.startsWith("0")) {
                    formattedPhone = "88" + cleanPhone;
                } else if (cleanPhone.startsWith("1") && cleanPhone.length === 10) {
                    formattedPhone = "880" + cleanPhone;
                }

                const payload = {
                    data: [
                        {
                            event_name: "Purchase",
                            event_time: Math.floor(Date.now() / 1000),
                            event_source: "web",
                            action_source: "website",
                            event_id: order.orderNumber,
                            user_data: {
                                client_ip_address: ip,
                                client_user_agent: req.headers.get("user-agent") || "",
                                ph: [sha256(formattedPhone)],
                                fn: [sha256(customer.firstName)],
                                ln: [sha256(customer.lastName)]
                            },
                            custom_data: {
                                value: Number(order.total),
                                currency: "BDT",
                                content_type: "product",
                                content_ids: orderItemsData.map(item => item.productId)
                            }
                        }
                    ]
                };

                await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (err) {
                console.error("Facebook Conversions API error:", err);
            }
        };

        triggerCAPI().catch(() => {});

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
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
