import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { decrypt } from "@/lib/security";

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

        // 3. Fetch Settings & Credentials (with .env fallback)
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });

        let storeSettings = {};
        if (setting?.value) {
            try {
                storeSettings = JSON.parse(setting.value);
            } catch (e) {
                console.error("Error parsing store_settings:", e);
            }
        }

        const isValidPlaintextKey = (k) => k && typeof k === 'string' && !k.includes(':') && k.trim().length > 0;

        const dbApiKey = storeSettings.steadfastApiKey ? decrypt(storeSettings.steadfastApiKey) : null;
        const dbSecretKey = storeSettings.steadfastSecretKey ? decrypt(storeSettings.steadfastSecretKey) : null;

        const apiKey = (isValidPlaintextKey(dbApiKey) ? dbApiKey : (process.env.STEADFAST_API_KEY || "")).trim();
        const secretKey = (isValidPlaintextKey(dbSecretKey) ? dbSecretKey : (process.env.STEADFAST_SECRET_KEY || "")).trim();

        if (!apiKey || !secretKey) {
            return NextResponse.json({
                ok: false,
                message: "Steadfast API Key or Secret Key is not configured. Please set them in Admin > Shipping settings."
            }, { status: 400 });
        }

        // 4. Validate & Format Phone Number
        // Steadfast requires an 11-digit mobile number, e.g. 01XXXXXXXXX
        let cleanPhone = (order.phone || "").replace(/\D/g, ""); // remove all non-digits

        if (cleanPhone.startsWith("880") && cleanPhone.length === 14) {
            cleanPhone = cleanPhone.slice(3);
        } else if (cleanPhone.startsWith("88") && cleanPhone.length === 13) {
            cleanPhone = cleanPhone.slice(2);
        } else if (cleanPhone.length > 11 && cleanPhone.includes("880")) {
            cleanPhone = cleanPhone.split("880")[1];
        }

        if (cleanPhone.length === 10 && !cleanPhone.startsWith("0")) {
            cleanPhone = "0" + cleanPhone;
        }

        if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
            return NextResponse.json({
                ok: false,
                message: `Invalid phone number: "${order.phone}". Steadfast requires a valid 11-digit mobile number (e.g., 017XXXXXXXX).`
            }, { status: 400 });
        }

        // 5. Build Full Recipient Address
        const addressParts = [order.address, order.city, order.deliveryArea].filter(Boolean);
        const fullAddress = addressParts.join(", ");

        if (!fullAddress || fullAddress.trim().length < 3) {
            return NextResponse.json({
                ok: false,
                message: "Delivery address is missing or invalid. Please update the shipping address."
            }, { status: 400 });
        }

        // 6. Calculate COD Amount
        let codAmount = Number(order.total || 0) - Number(order.advancePayment || 0);
        if (codAmount < 0) codAmount = 0;

        // 7. Build Item Description
        const itemDescription = (order.items || []).map(item => `${item.name} (x${item.quantity})`).join(", ");

        // 8. Prepare Payload
        const payload = {
            invoice: order.orderNumber,
            recipient_name: order.customerName || "Customer",
            recipient_phone: cleanPhone,
            recipient_address: fullAddress,
            cod_amount: codAmount,
            note: order.customerNote || "Please handle with care.",
            item_description: itemDescription.slice(0, 250) || "Store order"
        };

        // 9. Dispatch to Steadfast API (with primary & secondary endpoints)
        const headers = {
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "Secret-Key": secretKey
        };

        let response;
        let result;

        try {
            response = await fetch("https://portal.packzy.com/api/v1/create_order", {
                method: "POST",
                headers,
                body: JSON.stringify(payload)
            });
            result = await response.json();
        } catch (fetchErr) {
            // Fallback URL if packzy domain fails
            try {
                response = await fetch("https://portal.steadfast.com.bd/api/v1/create_order", {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload)
                });
                result = await response.json();
            } catch (fallbackErr) {
                return NextResponse.json({
                    ok: false,
                    message: `Failed to connect to Steadfast Courier API: ${fetchErr.message}`
                }, { status: 500 });
            }
        }

        // 10. Process Response
        const trackingCode = result.consignment?.tracking_code || result.tracking_code || result.consignment?.consignment_id?.toString() || result.consignment_id?.toString();
        const isSuccess = (result.status === 200 || result.code === 200 || result.status === "200") && Boolean(trackingCode);

        if (isSuccess) {
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
                            message: `Your order #${updated.orderNumber} has been dispatched via Steadfast. Tracking Code: ${trackingCode}.`
                        }
                    });
                }

                return updated;
            });

            // Audit Log
            const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
            await createAuditLog({
                adminId: admin.user?.id || admin.user?.email || admin.id,
                action: "UPDATE",
                entityType: "Order",
                entityId: id,
                meta: { action: "steadfast_dispatch", trackingCode, orderNumber: order.orderNumber },
                ip
            });

            return NextResponse.json({ ok: true, data: updatedOrder, trackingCode });
        } else {
            const errorMsg = result.message || (typeof result.errors === 'object' ? JSON.stringify(result.errors) : null) || "Courier booking failed. Please verify Steadfast credentials.";
            return NextResponse.json({
                ok: false,
                message: errorMsg
            }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

