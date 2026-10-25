import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/security";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

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
 * Make an authenticated request to Steadfast API with timeout protection.
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

        const res = await fetch(`${STEADFAST_BASE_URL}${cleanEndpoint}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json().catch(async () => {
            const text = await res.text();
            return { status: res.status, rawText: text };
        });
        return { ok: res.ok, status: res.status, data };
    } catch (primaryErr) {
        if (primaryErr.name === 'AbortError') {
            throw new Error("Steadfast API request timed out (12s).");
        }
        throw new Error(`Failed to connect to Steadfast Courier: ${primaryErr.message}`);
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
    if (!rawPhone) return "";
    let clean = rawPhone.toString().replace(/\D/g, "");
    if (clean.startsWith("880") && clean.length >= 13) {
        clean = clean.slice(3);
        if (!clean.startsWith("0")) clean = "0" + clean;
    } else if (clean.startsWith("88") && clean.length >= 12) {
        clean = clean.slice(2);
        if (!clean.startsWith("0")) clean = "0" + clean;
    }
    if (clean.length === 10 && clean.startsWith("1")) {
        clean = "0" + clean;
    }
    if (clean.length > 11 && clean.includes("01")) {
        const idx = clean.indexOf("01");
        const candidate = clean.slice(idx, idx + 11);
        if (candidate.length === 11) clean = candidate;
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

    const result = response.data || {};
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
    }

    // If order was already dispatched to Steadfast (invoice taken), attempt to recover existing tracking code
    const rawErrorStr = JSON.stringify(result);
    if (rawErrorStr.includes("invoice has already been taken") || rawErrorStr.includes("already been taken")) {
        try {
            const existingStatus = await checkSteadfastStatus({ invoice: order.orderNumber });
            if (existingStatus.ok && existingStatus.data) {
                const recoveredTracking = existingStatus.data.tracking_code || existingStatus.data.consignment_id || order.orderNumber;
                const recoveredCid = existingStatus.data.consignment_id || null;
                return {
                    ok: true,
                    trackingCode: recoveredTracking,
                    consignmentId: recoveredCid,
                    consignment: existingStatus.data,
                    recovered: true,
                    message: `Order was already booked with Steadfast. Recovered Tracking Code: ${recoveredTracking}`
                };
            }
        } catch {}
        return {
            ok: false,
            message: `এই অর্ডারটি (#${order.orderNumber}) ইতিমধ্যে Steadfast-এ বুকিং করা হয়েছে।`
        };
    }

    let errorMsg = result.message || result.error;
    if (!errorMsg && result.errors && typeof result.errors === "object") {
        errorMsg = Object.values(result.errors).flat().join(". ");
    }
    if (!errorMsg) {
        errorMsg = "Failed to book parcel with Steadfast";
    }

    return {
        ok: false,
        message: errorMsg
    };
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


// In-memory fraud score cache (24 hour TTL) to avoid exceeding Steadfast's 10 queries/day limit
const fraudMemoryCache = new Map();
const FRAUD_CACHE_TTL = 24 * 60 * 60 * 1000;

export function getCachedSteadfastFraud(rawPhone) {
    const clean = formatBangladeshiPhone(rawPhone);
    if (!clean) return null;
    const entry = fraudMemoryCache.get(clean);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > FRAUD_CACHE_TTL) {
        fraudMemoryCache.delete(clean);
        return null;
    }
    return entry.data;
}

export function setCachedSteadfastFraud(rawPhone, data) {
    const clean = formatBangladeshiPhone(rawPhone);
    if (!clean || !data) return;
    fraudMemoryCache.set(clean, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Check customer's courier delivery history and fraud risk directly via Steadfast's live fraud score API.
 * Endpoint: GET /fraud_check/score/{phone} (fallback /fraud_check/{phone})
 * Includes smart caching & rate limit detection.
 */
export async function checkSteadfastFraud(rawPhone, options = {}) {
    const cleanPhone = formatBangladeshiPhone(rawPhone);
    if (!cleanPhone || cleanPhone.length !== 11) {
        return {
            ok: false,
            message: 'সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন'
        };
    }

    // 1. Check in-memory cache unless caller explicitly requested force refresh
    if (!options.force) {
        const cached = getCachedSteadfastFraud(cleanPhone);
        if (cached && cached.ok) {
            return { ...cached, isCached: true };
        }
    }

    try {
        const response = await fetchSteadfast('/fraud_check/score/' + cleanPhone, { method: 'GET' });
        const d = response.data || {};

        // 2. Check for Steadfast API Rate Limit (e.g. 10/10 limit exceeded)
        const isRateLimited = response.status === 429 ||
            (typeof d.error === 'string' && d.error.toLowerCase().includes('rate limit')) ||
            (typeof d.message === 'string' && d.message.toLowerCase().includes('rate limit'));

        if (isRateLimited) {
            const existingCache = fraudMemoryCache.get(cleanPhone);
            if (existingCache?.data?.ok) {
                return {
                    ...existingCache.data,
                    isCached: true,
                    rateLimitWarning: "Steadfast লাইভ লিমিট (১০/১০) শেষ হওয়ায় পূর্বে সংরক্ষিত তথ্য দেখানো হচ্ছে।"
                };
            }
            return {
                ok: false,
                isRateLimited: true,
                message: "Steadfast ফ্রড চেক লিমিট (১০/১০) শেষ হয়েছে। Steadfast মার্চেন্ট পোর্টালে লিমিট রিনিউ হলে পুনরায় চেক করা যাবে।"
            };
        }

        // 3. Check for successful response (handles both score endpoint and standard history endpoint)
        const hasScoreData = d.status === 200 || d.delivery_ratio !== undefined || d.Total_parcels !== undefined || d.total_delivered !== undefined;

        if (response.ok && hasScoreData) {
            let deliveryRatio = null;
            let cancellationRatio = null;
            let returnRatio = 0;
            let totalReports = 0;
            let totalParcels = null;
            let volumeRange = d.volume_range || d.volume_band || null;

            if (d.delivery_ratio !== undefined && d.delivery_ratio !== null) {
                deliveryRatio = Number(d.delivery_ratio);
                cancellationRatio = d.cancellation_ratio !== undefined && d.cancellation_ratio !== null ? Number(d.cancellation_ratio) : null;
                returnRatio = d.return_ratio !== undefined && d.return_ratio !== null ? Number(d.return_ratio) : (cancellationRatio || 0);
            } else if (d.Total_parcels !== undefined || d.total_delivered !== undefined) {
                totalParcels = Number(d.Total_parcels || 0);
                const delivered = Number(d.total_delivered || 0);
                const cancelled = Number(d.total_cancelled || 0);
                deliveryRatio = totalParcels > 0 ? Math.round((delivered / totalParcels) * 100) : 100;
                cancellationRatio = totalParcels > 0 ? Math.round((cancelled / totalParcels) * 100) : 0;
                returnRatio = cancellationRatio;
                volumeRange = `${totalParcels}টি পার্সেল (${delivered} ডেলিভারি, ${cancelled} ক্যানসেল)`;
            }

            if (Array.isArray(d.total_fraud_reports)) {
                totalReports = d.total_fraud_reports.length;
            } else if (d.total_reports !== undefined && d.total_reports !== null) {
                totalReports = Number(d.total_reports);
            }

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

            const parsedResult = {
                ok: true,
                phone: cleanPhone,
                deliveryRatio,
                cancellationRatio,
                returnRatio,
                totalReports,
                totalParcels,
                volumeRange: volumeRange || 'N/A',
                volumeBand: d.volume_band || 'N/A',
                fraudCategories: d.fraud_categories || {},
                riskLevel,
                riskLabel,
                riskColor,
                checkedAt: new Date().toISOString()
            };

            setCachedSteadfastFraud(cleanPhone, parsedResult);
            return parsedResult;
        }

        // 4. Extract meaningful error message from Steadfast
        let errorMessage = d.error || d.message;
        if (!errorMessage && d.errors && typeof d.errors === 'object') {
            errorMessage = Object.values(d.errors).flat().join('. ');
        }
        if (!errorMessage) {
            errorMessage = 'Steadfast থেকে কোনো তথ্য পাওয়া যায়নি';
        }

        return {
            ok: false,
            message: errorMessage
        };

    } catch (err) {
        console.error('Error checking Steadfast fraud:', err);
        return {
            ok: false,
            message: err.message
        };
    }
}
