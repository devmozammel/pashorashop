import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, resolveStaffDbUserId, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { bookOrderWithCourier } from "@/lib/couriers";
import { sendChannelReply } from "@/lib/meta-api";
import { formatBangladeshiPhone } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

const CHANNEL_SOURCE_PREFIX = {
    WHATSAPP: "WA",
    MESSENGER: "FB",
    FB_COMMENT: "FBC",
    INSTAGRAM_DM: "IG",
    INSTAGRAM_COMMENT: "IGC",
};

const inboxOrderSchema = z.object({
    customerName: z.string().trim().min(1, "কাস্টমারের নাম দিন").max(120),
    phone: z.string().trim().min(10, "সঠিক ফোন নম্বর দিন").max(25),
    address: z.string().trim().min(3, "সম্পূর্ণ ঠিকানা দিন").max(500),
    city: z.string().max(100).optional().default(""),
    deliveryArea: z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA"]).optional().default("INSIDE_DHAKA"),
    deliveryFee: z.coerce.number().min(0).max(5000).optional().default(70),
    discount: z.coerce.number().min(0).max(100000).optional().default(0),
    advancePayment: z.coerce.number().min(0).max(1000000).optional().default(0),
    paymentMethod: z.enum(["COD", "ONLINE"]).optional().default("COD"),
    paymentStatus: z.enum(["PENDING", "PARTIAL_PAID", "PAID"]).optional().default("PENDING"),
    adminNote: z.string().max(1000).optional().default(""),
    courierName: z.enum(["Steadfast", "Pathao", "RedX"]).optional().default("Steadfast"),
    autoBookCourier: z.boolean().optional().default(true),
    sendConfirmationMessage: z.boolean().optional().default(true),
    items: z
        .array(
            z.object({
                productId: z.string().min(1),
                variantId: z.string().nullable().optional(),
                quantity: z.coerce.number().int().min(1).max(100),
                unitPrice: z.coerce.number().min(0).max(1000000),
            })
        )
        .min(1, "অন্তত ১টি প্রোডাক্ট সিলেক্ট করুন"),
});

/**
 * 1-Click Order Creation from Chat + Optional Instant Courier Booking (Steadfast / Pathao / RedX).
 */
export async function POST(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;
        const rawBody = await req.json();
        const parsed = inboxOrderSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { ok: false, message: parsed.error.issues[0]?.message || "Invalid order details" },
                { status: 400 }
            );
        }

        const {
            customerName,
            phone,
            address,
            city,
            deliveryArea,
            deliveryFee,
            discount,
            advancePayment,
            paymentMethod,
            paymentStatus,
            adminNote,
            items,
            courierName,
            autoBookCourier,
            sendConfirmationMessage,
        } = parsed.data;

        const conversation = await prisma.socialConversation.findUnique({ where: { id } });
        if (!conversation) {
            return NextResponse.json({ ok: false, message: "Conversation not found" }, { status: 404 });
        }

        const cleanPhone = formatBangladeshiPhone(phone) || phone;
        const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);
        const total = Math.max(0, subtotal + Number(deliveryFee || 0) - Number(discount || 0));

        const prefix = CHANNEL_SOURCE_PREFIX[conversation.channel] || "SOC";
        const orderNumber = `${prefix}-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
        const dbUserId = await resolveStaffDbUserId(staff);

        const createdOrder = await prisma.$transaction(async (tx) => {
            const orderItemsData = [];
            const stockUpdates = [];

            for (const item of items) {
                if (item.variantId) {
                    const variant = await tx.productVariant.findUnique({
                        where: { id: item.variantId },
                        include: { product: true },
                    });
                    if (!variant) throw new Error("Selected product variant not found");

                    orderItemsData.push({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: `${variant.product.name} (${variant.size || ""} ${variant.color || ""})`.trim(),
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.unitPrice) * Number(item.quantity),
                    });
                    stockUpdates.push({ type: "variant", id: item.variantId, quantity: Number(item.quantity) });
                } else {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                    });
                    if (!product) throw new Error("Selected product not found");

                    orderItemsData.push({
                        productId: item.productId,
                        name: product.name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.unitPrice) * Number(item.quantity),
                    });
                    stockUpdates.push({ type: "product", id: item.productId, quantity: Number(item.quantity) });
                }
            }

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerName,
                    phone: cleanPhone,
                    address,
                    city,
                    deliveryArea,
                    deliveryFee: Number(deliveryFee || 0),
                    discount: Number(discount || 0),
                    subtotal,
                    total,
                    paymentMethod,
                    paymentStatus,
                    advancePayment: Number(advancePayment || 0),
                    adminNote: adminNote || `Created from ${conversation.channel} Inbox`,
                    status: "CONFIRMED",
                    conversationId: conversation.id,
                    createdById: dbUserId,
                    adSource: conversation.adPlatform || "ORGANIC",
                    adId: conversation.adId || null,
                    adCampaign: conversation.campaignName || conversation.adName || null,
                    items: { create: orderItemsData },
                    history: {
                        create: {
                            status: "CONFIRMED",
                            note: `1-Click order created from ${conversation.channel} chat by ${staff.user?.name || staff.user?.email}`,
                        },
                    },
                },
                include: { items: true },
            });

            for (const update of stockUpdates) {
                if (update.type === "variant") {
                    await tx.productVariant.update({
                        where: { id: update.id },
                        data: { stock: { decrement: update.quantity } },
                    });
                } else {
                    await tx.product.update({
                        where: { id: update.id },
                        data: { stock: { decrement: update.quantity } },
                    });
                }
            }

            await tx.socialConversation.update({
                where: { id: conversation.id },
                data: {
                    status: "ORDERED",
                    phone: cleanPhone,
                    customerName,
                    unreadCount: 0,
                    ...(dbUserId && !conversation.assignedToId
                        ? { assignedToId: dbUserId, assignedAt: new Date() }
                        : {}),
                },
            });

            return order;
        });

        // ─── Instant Courier Auto-Booking ───
        let courierBooking = null;
        let finalOrder = createdOrder;

        if (autoBookCourier && courierName) {
            try {
                courierBooking = await bookOrderWithCourier(createdOrder, courierName);
                if (courierBooking.ok) {
                    finalOrder = await prisma.$transaction(async (tx) => {
                        const updated = await tx.order.update({
                            where: { id: createdOrder.id },
                            data: {
                                courierName: courierBooking.courierName || courierName,
                                trackingNumber: courierBooking.trackingCode,
                                status: "SHIPPED",
                            },
                            include: { items: true },
                        });
                        await tx.orderStatusHistory.create({
                            data: {
                                orderId: createdOrder.id,
                                status: "SHIPPED",
                                note: `Auto-booked with ${courierBooking.courierName || courierName}. Tracking: ${courierBooking.trackingCode}`,
                            },
                        });
                        return updated;
                    });
                }
            } catch (courierErr) {
                courierBooking = { ok: false, message: courierErr.message };
            }
        }

        // ─── Optional Chat Confirmation Reply ───
        if (sendConfirmationMessage) {
            const confirmMsg = courierBooking?.ok
                ? `ধন্যবাদ ${customerName}! আপনার অর্ডার #${finalOrder.orderNumber} কনফার্ম হয়েছে এবং ${courierBooking.courierName}-এ বুকিং সম্পন্ন হয়েছে। ট্র্যাকিং কোড: ${courierBooking.trackingCode}। মোট বিল: ৳${finalOrder.total}।`
                : `ধন্যবাদ ${customerName}! আপনার অর্ডার #${finalOrder.orderNumber} সফলভাবে কনফার্ম হয়েছে। মোট বিল: ৳${finalOrder.total}। শীঘ্রই পার্সেল পাঠানো হবে।`;

            const sendRes = await sendChannelReply({
                channel: conversation.channel,
                externalUserId: conversation.externalUserId,
                externalThreadId: conversation.externalThreadId,
                text: confirmMsg,
            }).catch(() => ({ ok: false }));

            await prisma.socialMessage.create({
                data: {
                    conversationId: conversation.id,
                    externalMessageId: sendRes?.externalMessageId || null,
                    direction: "OUTBOUND",
                    messageType: "SYSTEM",
                    senderType: "MODERATOR",
                    senderId: dbUserId,
                    body: confirmMsg,
                    metadata: { orderId: finalOrder.id, orderNumber: finalOrder.orderNumber, simulated: sendRes?.simulated ?? true },
                },
            });

            await prisma.socialConversation.update({
                where: { id: conversation.id },
                data: {
                    lastMessagePreview: confirmMsg.slice(0, 200),
                    lastMessageAt: new Date(),
                },
            });
        }

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: staff.user?.id || staff.user?.email,
            action: "CREATE_INBOX_ORDER",
            entityType: "Order",
            entityId: finalOrder.id,
            meta: {
                orderNumber: finalOrder.orderNumber,
                conversationId: conversation.id,
                channel: conversation.channel,
                courierBooked: Boolean(courierBooking?.ok),
                courierName,
            },
            ip,
        }).catch(() => {});

        return NextResponse.json({
            ok: true,
            data: finalOrder,
            courierBooking,
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
