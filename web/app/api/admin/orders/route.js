import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where = {};
        if (status === "ABNORMAL") {
            where.isAbnormal = true;
        } else {
            where.isAbnormal = false;
            if (status && status !== "ALL") {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search } }, // Case insensitive usually depends on DB collation
                { customerName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    paymentStatus: true,
                    paymentMethod: true,
                    _count: {
                        select: { items: true }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            ok: true,
            data: orders,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        return apiError(error, "Get Orders");
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { 
            customerName, phone, address, city, deliveryArea, 
            deliveryFee = 0, discount = 0, advancePayment = 0,
            paymentMethod = "COD", paymentStatus = "PENDING",
            adminNote = "", items = [], source = "WA"
        } = body;

        if (!customerName || !phone || !address || items.length === 0) {
            return NextResponse.json({ ok: false, message: "Missing required order details" }, { status: 400 });
        }

        // Calculate Subtotal & Total
        const subtotal = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
        const total = subtotal + Number(deliveryFee) - Number(discount);

        // Generate custom order number based on source channel (e.g. WA-1700000000000)
        const orderNumber = `${source.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Process inside transaction to update stock and save order
        const createdOrder = await prisma.$transaction(async (tx) => {
            const orderItemsData = [];
            const stockUpdates = [];

            for (const item of items) {
                if (item.variantId) {
                    const variant = await tx.productVariant.findUnique({
                        where: { id: item.variantId },
                        include: { product: true }
                    });
                    if (!variant) throw new Error(`Product variant not found`);
                    
                    orderItemsData.push({
                        productId: item.productId,
                        variantId: item.variantId,
                        name: `${variant.product.name} (${variant.size || ""} ${variant.color || ""})`.trim(),
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.unitPrice) * Number(item.quantity)
                    });

                    stockUpdates.push({ type: 'variant', id: item.variantId, quantity: Number(item.quantity) });
                } else {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId }
                    });
                    if (!product) throw new Error(`Product not found`);

                    orderItemsData.push({
                        productId: item.productId,
                        name: product.name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.unitPrice) * Number(item.quantity)
                    });

                    stockUpdates.push({ type: 'product', id: item.productId, quantity: Number(item.quantity) });
                }
            }

            // Create Order
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    customerName,
                    phone,
                    address,
                    city,
                    deliveryArea,
                    deliveryFee: Number(deliveryFee),
                    discount: Number(discount),
                    subtotal,
                    total,
                    paymentMethod,
                    paymentStatus,
                    advancePayment: Number(advancePayment),
                    adminNote,
                    status: "PENDING",
                    items: {
                        create: orderItemsData
                    },
                    history: {
                        create: {
                            status: "PENDING",
                            note: `Manual order created via ${source === 'WA' ? 'WhatsApp' : source === 'FB' ? 'Facebook' : source === 'PH' ? 'Phone' : 'Admin Entry'}`
                        }
                    }
                }
            });

            // Decrement Stock
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

            return order;
        });

        // Audit Log
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "CREATE_MANUAL_ORDER",
            entityType: "Order",
            entityId: createdOrder.id,
            meta: { orderNumber: createdOrder.orderNumber, customerName, total },
            ip
        }).catch(err => console.error("Error creating audit log:", err));

        return NextResponse.json({ ok: true, data: createdOrder });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

