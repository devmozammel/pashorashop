import {
    createSteadfastOrder,
    checkSteadfastFraud,
    formatBangladeshiPhone,
} from "@/lib/steadfast";
import { getCustomerScore } from "@/lib/customer-scoring";
import { getSocialSettings } from "@/lib/social-settings";

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Combined Customer Delivery Success Ratio & Fake Order Risk check.
 * Merges local Pashora Shop order history + Steadfast courier fraud score.
 */
export async function getUnifiedCustomerRisk(rawPhone, options = {}) {
    const cleanPhone = formatBangladeshiPhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 11) {
        return {
            ok: false,
            phone: rawPhone || "",
            local: null,
            courier: null,
            combinedSuccessRatio: null,
            riskLevel: "UNKNOWN",
            riskLabel: "ফোন নম্বর প্রয়োজন",
        };
    }

    const [local, courier] = await Promise.all([
        getCustomerScore(cleanPhone).catch(() => null),
        options.includeCourier !== false
            ? checkSteadfastFraud(cleanPhone, { force: Boolean(options.force) }).catch((e) => ({
                  ok: false,
                  message: e.message,
              }))
            : Promise.resolve(null),
    ]);

    const courierRatio = courier?.ok && courier.deliveryRatio !== null ? Number(courier.deliveryRatio) : null;
    const localCompleted = (local?.deliveredOrders || 0) + (local?.cancelledOrders || 0);
    const localRatio = localCompleted > 0 ? Number(local.successRate) : null;

    let combinedSuccessRatio = courierRatio ?? localRatio;
    if (courierRatio !== null && localRatio !== null) {
        combinedSuccessRatio = Math.round((courierRatio * 0.7) + (localRatio * 0.3));
    }

    let riskLevel = local?.riskLevel || "NEW";
    let riskLabel = local?.badgeText || "নতুন কাস্টমার";

    if (local?.isBlacklisted) {
        riskLevel = "BLOCKED";
        riskLabel = "🚫 ব্লকলিস্টেড কাস্টমার";
    } else if (courier?.ok && courier.riskLevel === "HIGH_RISK") {
        riskLevel = "HIGH_RISK";
        riskLabel = courier.riskLabel;
    } else if (courier?.ok && courier.riskLevel === "TRUSTED" && riskLevel !== "HIGH_RISK") {
        riskLevel = "TRUSTED";
        riskLabel = courier.riskLabel;
    } else if (combinedSuccessRatio !== null && combinedSuccessRatio < 50) {
        riskLevel = "HIGH_RISK";
        riskLabel = "⚠️ ফেক/বাতিল রিস্ক বেশি";
    }

    return {
        ok: true,
        phone: cleanPhone,
        local,
        courier,
        combinedSuccessRatio,
        riskLevel,
        riskLabel,
    };
}

/**
 * Book an order with Pathao Merchant API v1.
 */
async function createPathaoOrder(order, settings) {
    const { pathaoClientId, pathaoClientSecret, pathaoUsername, pathaoPassword, pathaoStoreId, pathaoSandbox } = settings;
    if (!pathaoClientId || !pathaoClientSecret || !pathaoUsername || !pathaoPassword || !pathaoStoreId) {
        return {
            ok: false,
            message: "Pathao API credentials / Store ID সেট করা নেই (Inbox Settings থেকে সেট করুন)।",
        };
    }

    const baseUrl = pathaoSandbox ? "https://courier-api-sandbox.pathao.com" : "https://api-hermes.pathao.com";
    const cleanPhone = formatBangladeshiPhone(order.phone);
    if (cleanPhone.length !== 11) {
        return { ok: false, message: `সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন: ${order.phone}` };
    }

    // 1. Issue access token
    const tokenRes = await fetchWithTimeout(`${baseUrl}/aladdin/api/v1/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            client_id: pathaoClientId,
            client_secret: pathaoClientSecret,
            username: pathaoUsername,
            password: pathaoPassword,
            grant_type: "password",
        }),
    });
    const tokenData = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenData.access_token) {
        return { ok: false, message: tokenData.message || "Pathao authentication failed" };
    }

    const codAmount =
        order.paymentStatus === "PAID" || order.paymentMethod === "ONLINE"
            ? 0
            : Math.max(0, Number(order.total || 0) - Number(order.advancePayment || 0));

    const itemDesc = (order.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ");
    const totalQty = (order.items || []).reduce((acc, i) => acc + Number(i.quantity || 1), 0) || 1;

    // Default city/zone IDs (1=Dhaka) if caller doesn't pass specific IDs
    const recipientCity = Number(order.pathaoCityId || (order.deliveryArea === "INSIDE_DHAKA" ? 1 : 1));
    const recipientZone = Number(order.pathaoZoneId || 1);

    const payload = {
        store_id: Number(pathaoStoreId),
        merchant_order_id: order.orderNumber,
        recipient_name: order.customerName,
        recipient_phone: cleanPhone,
        recipient_address: `${order.address}${order.city ? `, ${order.city}` : ""}`,
        recipient_city: recipientCity,
        recipient_zone: recipientZone,
        delivery_type: 48, // Normal Delivery
        item_type: 2, // Parcel
        special_instruction: order.adminNote || "Deliver carefully",
        item_quantity: totalQty,
        item_weight: 0.5,
        amount_to_collect: codAmount,
        item_description: itemDesc.slice(0, 200),
    };

    const orderRes = await fetchWithTimeout(`${baseUrl}/aladdin/api/v1/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify(payload),
    });
    const orderData = await orderRes.json().catch(() => ({}));

    if (orderRes.ok && (orderData.data?.consignment_id || orderData.consignment_id)) {
        const consignmentId = String(orderData.data?.consignment_id || orderData.consignment_id);
        return {
            ok: true,
            courierName: "Pathao",
            trackingCode: consignmentId,
            consignmentId,
            rawResponse: orderData,
        };
    }

    return {
        ok: false,
        message: orderData.message || JSON.stringify(orderData.errors || "Pathao order creation failed"),
    };
}

/**
 * Book an order with RedX Open API.
 */
async function createRedxOrder(order, settings) {
    const { redxApiToken, redxStoreId, redxSandbox } = settings;
    if (!redxApiToken) {
        return {
            ok: false,
            message: "RedX API Token সেট করা নেই (Inbox Settings থেকে সেট করুন)।",
        };
    }

    const baseUrl = redxSandbox ? "https://sandbox.redx.com.bd" : "https://openapi.redx.com.bd";
    const cleanPhone = formatBangladeshiPhone(order.phone);
    if (cleanPhone.length !== 11) {
        return { ok: false, message: `সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন: ${order.phone}` };
    }

    const codAmount =
        order.paymentStatus === "PAID" || order.paymentMethod === "ONLINE"
            ? 0
            : Math.max(0, Number(order.total || 0) - Number(order.advancePayment || 0));

    const payload = {
        customer_name: order.customerName,
        customer_phone: cleanPhone,
        delivery_area: order.city || (order.deliveryArea === "INSIDE_DHAKA" ? "Dhaka" : "Outside Dhaka"),
        delivery_area_id: Number(order.redxAreaId || 1),
        customer_address: order.address,
        merchant_invoice_id: order.orderNumber,
        cash_collection_amount: String(codAmount),
        parcel_weight: 500,
        instruction: order.adminNote || "",
        value: Number(order.total || 0),
        ...(redxStoreId ? { pickup_store_id: Number(redxStoreId) } : {}),
    };

    const res = await fetchWithTimeout(`${baseUrl}/v1.0.0-beta/parcel`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "API-ACCESS-TOKEN": `Bearer ${redxApiToken}`,
        },
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.tracking_id) {
        return {
            ok: true,
            courierName: "RedX",
            trackingCode: String(data.tracking_id),
            consignmentId: String(data.tracking_id),
            rawResponse: data,
        };
    }

    return {
        ok: false,
        message: data.message || data.error || "RedX parcel creation failed",
    };
}

/**
 * Unified Courier Booking entry point for Steadfast, Pathao, or RedX.
 */
export async function bookOrderWithCourier(order, courierName = "Steadfast") {
    const normalized = (courierName || "Steadfast").toLowerCase();

    if (normalized === "steadfast") {
        const res = await createSteadfastOrder(order);
        return {
            ...res,
            courierName: "Steadfast",
        };
    }

    const settings = await getSocialSettings();

    if (normalized === "pathao") {
        return await createPathaoOrder(order, settings);
    }

    if (normalized === "redx") {
        return await createRedxOrder(order, settings);
    }

    return { ok: false, message: `Unsupported courier: ${courierName}` };
}
