import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";
const STEADFAST_FALLBACK_URL = "https://portal.steadfast.com.bd/api/v1";

/**
 * Fetch and decrypt Steadfast API credentials from DB or fallback to environment variables.
 */
export async function getSteadfastCredentials() {
    try {
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

        return { apiKey, secretKey };
    } catch (err) {
        console.error("Error retrieving Steadfast credentials:", err);
        return {
            apiKey: (process.env.STEADFAST_API_KEY || "").trim(),
            secretKey: (process.env.STEADFAST_SECRET_KEY || "").trim()
        };
    }
}

/**
 * Make an authenticated request to Steadfast API with automatic fallback.
 */
export async function fetchSteadfast(endpoint, options = {}) {
    const { apiKey, secretKey } = await getSteadfastCredentials();

    if (!apiKey || !secretKey) {
        throw new Error("Steadfast API Key or Secret Key is not configured. Please check Admin > Shipping settings.");
    }

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        ...(options.headers || {})
    };

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    try {
        const res = await fetch(`${STEADFAST_BASE_URL}${cleanEndpoint}`, {
            ...options,
            headers
        });
        const data = await res.json().catch(async () => {
            const text = await res.text();
            return { status: res.status, rawText: text };
        });
        return { ok: res.ok, status: res.status, data };
    } catch (primaryErr) {
        // Fallback endpoint attempt
        try {
            const res = await fetch(`${STEADFAST_FALLBACK_URL}${cleanEndpoint}`, {
                ...options,
                headers
            });
            const data = await res.json().catch(async () => {
                const text = await res.text();
                return { status: res.status, rawText: text };
            });
            return { ok: res.ok, status: res.status, data };
        } catch (fallbackErr) {
            throw new Error(`Failed to connect to Steadfast Courier: ${primaryErr.message}`);
        }
    }
}

/**
 * Fetch current real-time merchant COD balance.
 */
export async function getSteadfastBalance() {
    const response = await fetchSteadfast("/get_balance", { method: "GET" });
    if (response.data && (response.data.status === 200 || response.data.current_balance !== undefined)) {
        return {
            ok: true,
            currentBalance: Number(response.data.current_balance || 0)
        };
    }
    return {
        ok: false,
        currentBalance: 0,
        message: response.data?.message || "Failed to fetch Steadfast balance"
    };
}

/**
 * Normalize and clean Bangladeshi mobile numbers to 11 digits: 01XXXXXXXXX
 */
export function formatBangladeshiPhone(rawPhone) {
    let clean = (rawPhone || "").toString().replace(/\D/g, "");
    if (clean.startsWith("880") && clean.length === 14) {
        clean = clean.slice(3);
    } else if (clean.startsWith("88") && clean.length === 13) {
        clean = clean.slice(2);
    } else if (clean.length > 11 && clean.includes("880")) {
        clean = clean.split("880")[1];
    }
    if (clean.length === 10 && !clean.startsWith("0")) {
        clean = "0" + clean;
    }
    return clean;
}

/**
 * Book / Dispatch a single order to Steadfast.
 */
export async function createSteadfastOrder(order) {
    const cleanPhone = formatBangladeshiPhone(order.phone);
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
        throw new Error(`Invalid phone number: "${order.phone}". Steadfast requires an 11-digit mobile number starting with 01.`);
    }

    const addressParts = [order.address, order.city, order.deliveryArea].filter(Boolean);
    const fullAddress = addressParts.join(", ");
    if (!fullAddress || fullAddress.trim().length < 3) {
        throw new Error("Delivery address is required for courier dispatch.");
    }

    let codAmount = Number(order.total || 0) - Number(order.advancePayment || 0);
    if (order.paymentStatus === "PAID" || order.paymentMethod === "ONLINE") {
        codAmount = 0;
    }
    if (codAmount < 0) codAmount = 0;

    const itemDesc = (order.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ");

    const payload = {
        invoice: order.orderNumber,
        recipient_name: order.customerName || "Customer",
        recipient_phone: cleanPhone,
        recipient_address: fullAddress,
        cod_amount: codAmount,
        note: order.customerNote || order.adminNote || "Please handle with care.",
        item_description: itemDesc.slice(0, 250) || "Store order"
    };

    const response = await fetchSteadfast("/create_order", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    const result = response.data;
    const trackingCode = result.consignment?.tracking_code || result.tracking_code || result.consignment?.consignment_id?.toString() || result.consignment_id?.toString();
    const consignmentId = result.consignment?.consignment_id || result.consignment_id || null;

    const isSuccess = (result.status === 200 || result.code === 200 || result.status === "200") && Boolean(trackingCode);

    if (isSuccess) {
        return {
            ok: true,
            trackingCode,
            consignmentId,
            consignment: result.consignment || result
        };
    } else {
        const errorMsg = result.message || (typeof result.errors === 'object' ? JSON.stringify(result.errors) : null) || "Failed to book parcel with Steadfast";
        return {
            ok: false,
            message: errorMsg
        };
    }
}

/**
 * Check delivery status from Steadfast by tracking code, consignment id, or invoice.
 */
export async function checkSteadfastStatus({ trackingCode, consignmentId, invoice }) {
    let result = null;

    // 1. Try by tracking code
    if (trackingCode) {
        try {
            const res = await fetchSteadfast(`/status_by_trackingcode/${encodeURIComponent(trackingCode)}`, { method: "GET" });
            if (res.data && res.data.delivery_status) {
                result = res.data;
            }
        } catch (e) {
            console.error("Status check by tracking code failed:", e.message);
        }
    }

    // 2. Try by consignment id if not found
    if (!result && consignmentId) {
        try {
            const res = await fetchSteadfast(`/status_by_cid/${encodeURIComponent(consignmentId)}`, { method: "GET" });
            if (res.data && res.data.delivery_status) {
                result = res.data;
            }
        } catch (e) {
            console.error("Status check by CID failed:", e.message);
        }
    }

    // 3. Try by invoice if still not found
    if (!result && invoice) {
        try {
            const res = await fetchSteadfast(`/status_by_invoice/${encodeURIComponent(invoice)}`, { method: "GET" });
            if (res.data && res.data.delivery_status) {
                result = res.data;
            }
        } catch (e) {
            console.error("Status check by invoice failed:", e.message);
        }
    }

    if (result && result.delivery_status) {
        return {
            ok: true,
            rawStatus: result.delivery_status,
            mappedStatus: mapSteadfastStatus(result.delivery_status),
            data: result
        };
    }

    return {
        ok: false,
        message: "Could not retrieve status from Steadfast"
    };
}

/**
 * Map Steadfast's status to our internal Order status.
 */
export function mapSteadfastStatus(deliveryStatus) {
    if (!deliveryStatus) return null;
    const s = deliveryStatus.toString().toLowerCase().trim();

    if (s.includes("delivered") && !s.includes("cancelled")) {
        return {
            orderStatus: "DELIVERED",
            paymentStatus: "PAID",
            label: "Delivered",
            isFinal: true
        };
    }

    if (s.includes("cancel") || s.includes("return") || s.includes("rejected")) {
        return {
            orderStatus: "CANCELLED",
            paymentStatus: "FAILED",
            label: "Cancelled / Returned",
            isFinal: true
        };
    }

    if (s.includes("partial")) {
        return {
            orderStatus: "DELIVERED",
            paymentStatus: "PARTIAL_PAID",
            label: "Partially Delivered",
            isFinal: true
        };
    }

    if (s.includes("picked") || s.includes("transit") || s.includes("review") || s.includes("pending") || s.includes("hold") || s.includes("reschedule")) {
        return {
            orderStatus: "SHIPPED",
            paymentStatus: null,
            label: s.replace(/_/g, " ").toUpperCase(),
            isFinal: false
        };
    }

    return {
        orderStatus: "SHIPPED",
        paymentStatus: null,
        label: s,
        isFinal: false
    };
}


/**
 * Check customer's courier delivery history and fraud risk directly via Steadfast's live fraud score API.
 * Endpoint: GET /fraud_check/score/{phone}
 * Returns delivery_ratio (%), cancellation_ratio (%), return_ratio (%), total_reports, fraud_categories, volume_range.
 */
export async function checkSteadfastFraud(rawPhone) {
    const cleanPhone = formatBangladeshiPhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 11) {
        return {
            ok: false,
            message: 'সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন'
        };
    }

    try {
        const response = await fetchSteadfast('/fraud_check/score/' + cleanPhone, { method: 'GET' });
        if (response.data && (response.data.status === 200 || response.data.delivery_ratio !== undefined)) {
            const d = response.data;
            const deliveryRatio = d.delivery_ratio !== null && d.delivery_ratio !== undefined ? Number(d.delivery_ratio) : null;
            const cancellationRatio = d.cancellation_ratio !== null && d.cancellation_ratio !== undefined ? Number(d.cancellation_ratio) : null;
            const returnRatio = d.return_ratio !== null && d.return_ratio !== undefined ? Number(d.return_ratio) : (cancellationRatio || 0);
            const totalReports = Number(d.total_reports || 0);

            // Risk Assessment
            let riskLevel = 'SAFE';
            let riskLabel = 'নিরাপদ কাস্টমার';
            let riskColor = 'emerald';

            if (totalReports > 0 || (deliveryRatio !== null && deliveryRatio < 50) || returnRatio > 50) {
                riskLevel = 'HIGH_RISK';
                riskLabel = '⚠️ অতি ঝুঁকিপূর্ণ কাস্টমার';
                riskColor = 'rose';
            } else if ((deliveryRatio !== null && deliveryRatio < 75) || returnRatio > 25) {
                riskLevel = 'MODERATE';
                riskLabel = 'মাঝারি ঝুঁকি (ক্যানসেল বেশি)';
                riskColor = 'amber';
            } else if (deliveryRatio !== null && deliveryRatio >= 85) {
                riskLevel = 'TRUSTED';
                riskLabel = '⭐ অত্যন্ত বিশ্বস্ত ক্রেতা';
                riskColor = 'emerald';
            }

            return {
                ok: true,
                phone: cleanPhone,
                deliveryRatio,
                cancellationRatio,
                returnRatio,
                totalReports,
                volumeRange: d.volume_range || 'N/A',
                volumeBand: d.volume_band || 'N/A',
                fraudCategories: d.fraud_categories || {},
                riskLevel,
                riskLabel,
                riskColor,
                checkedAt: new Date().toISOString()
            };
        }

        return {
            ok: false,
            message: response.data?.message || 'Steadfast থেকে কোনো তথ্য পাওয়া যায়নি'
        };
    } catch (err) {
        console.error('Error checking Steadfast fraud:', err);
        return {
            ok: false,
            message: err.message
        };
    }
}
