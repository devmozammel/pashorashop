import {
    createSteadfastOrder,
    checkSteadfastFraud,
    formatBangladeshiPhone,
} from "@/lib/steadfast";
import { getCustomerScore } from "@/lib/customer-scoring";

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
 * Courier Booking entry point for Steadfast.
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

    return { ok: false, message: `Unsupported courier: ${courierName}` };
}

