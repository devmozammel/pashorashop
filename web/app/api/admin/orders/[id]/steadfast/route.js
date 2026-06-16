import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";

export async function POST(req, props) {
    const params = await props.params;

    try {
        // 1. Authenticate Admin
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;

        // 2. Fetch Order
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!order) {
            return NextResponse.json({ ok: false, message: "Order not found" }, { status: 404 });
        }

        // 3. Fetch Settings
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });

        if (!setting) {
            return NextResponse.json({ ok: false, message: "Store settings not configured. Please configure credentials." }, { status: 400 });
        }

        const storeSettings = JSON.parse(setting.value);
        const apiKey = storeSettings.steadfastApiKey;
        const secretKey = storeSettings.steadfastSecretKey;

        if (!apiKey || !secretKey) {
            return NextResponse.json({ ok: false, message: "Steadfast API Key or Secret Key is not configured. Please set them in Shipping settings." }, { status: 400 });
        }

        // 4. Validate & Format Phone Number
        // Steadfast requires an 11-digit mobile number, e.g. 01XXXXXXXXX
        let cleanPhone = order.phone.replace(/\D/g, ""); // remove all non-digits

        // Handle prefixes like +880 or 880
        if (cleanPhone.startsWith("880") && cleanPhone.length === 14) {
            cleanPhone = cleanPhone.slice(3);
        } else if (cleanPhone.startsWith("88") && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length > 11 && cleanPhone.includes("880")) {
            cleanPhone = cleanPhone.split("880")[1];
        }

        // Add leading 0 if missing
        if (cleanPhone.length === 10 && !cleanPhone.startsWith("0")) {
            cleanPhone = "0" + cleanPhone;
        }

        // Final sanity check
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
            return NextResponse.json({
                ok: false,
                message: `Invalid phone number: "${order.phone}". Steadfast requires a valid 11-digit mobile number (e.g., 017XXXXXXXX).`
            }, { status: 400 });
        }

        // 5. Calculate COD Amount
        let codAmount = order.total - order.advancePayment;
        if (codAmount < 0) codAmount = 0;

        // 6. Build Item Description
        const itemDescription = order.items.map(item => `${item.name} (x${item.quantity})`).join(", ");

        // 7. Prepare Payload
        const payload = {
            invoice: order.orderNumber,
            recipient_name: order.customerName,
            recipient_phone: cleanPhone,
            recipient_address: order.address,
            cod_amount: codAmount,
            note: order.customerNote || "Please handle with care.",
            item_description: itemDescription.slice(0, 250)
        };

        // 8. Dispatch to Steadfast API
        const response = await fetch("https://portal.packzy.com/api/v1/create_order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
                "secret-key": secretKey
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // 9. Process Response
        if (result.status === 200 && result.consignment) {
            const trackingCode = result.consignment.tracking_code;

            const updatedOrder = await prisma.$transaction(async (tx) => {
                // Update Order fields
                const updated = await tx.order.update({
                    where: { id },
                    data: {
                        courierName: "Steadfast",
                        trackingNumber: trackingCode,
                        status: "SHIPPED"
                    }
                });

                // Create Order Timeline Entry
                await tx.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        status: "SHIPPED",
                        note: `Order dispatched to Steadfast Courier. Tracking Code: ${trackingCode}`
                    }
                });

                // Create user notification (if user exists)
                if (updated.userId) {
                    await tx.notification.create({
                        data: {
                            userId: updated.userId,
                            type: "ORDER_STATUS_UPDATE",
                            message: `Your order #${updated.orderNumber} has been dispatched. Steadfast Tracking Code: ${trackingCode}.`
                        }
                    });
                }

                return updated;
            });

            // 10. Audit Log
            const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
            await createAuditLog({
                adminId: admin.user?.id || admin.user?.email || admin.id,
                action: "UPDATE",
                entityType: "Order",
                entityId: id,
                meta: { action: "steadfast_dispatch", trackingCode, orderNumber: order.orderNumber },
                ip
            });

            return NextResponse.json({ ok: true, data: updatedOrder });
        } else {
            return NextResponse.json({
                ok: false,
                message: result.message || "Courier booking failed. Check Steadfast credentials/status."
            }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
