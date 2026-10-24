import prisma from "@/lib/prisma";
import { formatBangladeshiPhone } from "@/lib/steadfast";

/**
 * Calculate Customer Trust Score, Star Rating & Fraud Detection
 */
export async function getCustomerScore(rawPhone) {
    if (!rawPhone) {
        return {
            phone: "",
            stars: 3,
            riskLevel: "UNKNOWN",
            badgeText: "Unknown",
            badgeColor: "bg-gray-100 text-gray-700",
            totalOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            pendingOrders: 0,
            successRate: 0,
            cancelRate: 0,
            isBlacklisted: false,
            recommendation: "কোনো তথ্য পাওয়া যায়নি"
        };
    }

    const cleanPhone = formatBangladeshiPhone(rawPhone);
    const phoneVariants = [cleanPhone, `880${cleanPhone.replace(/^0/, "")}`, cleanPhone.replace(/^0/, "")];

    // Check blacklist
    const blacklistEntry = await prisma.blacklist.findFirst({
        where: {
            phone: { in: phoneVariants }
        }
    });

    // Fetch all orders with this customer phone
    const orders = await prisma.order.findMany({
        where: {
            phone: { in: phoneVariants }
        },
        select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            isAbnormal: true,
            createdAt: true
        }
    });

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;
    const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;
    const abnormalOrders = orders.filter(o => o.isAbnormal).length;
    const pendingOrders = orders.filter(o => ["PENDING", "CONFIRMED", "PACKED", "SHIPPED"].includes(o.status)).length;
    const totalSpent = orders
        .filter(o => o.status === "DELIVERED")
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const completedOrders = deliveredOrders + cancelledOrders;
    const successRate = completedOrders > 0 ? Math.round((deliveredOrders / completedOrders) * 100) : (deliveredOrders > 0 ? 100 : 0);
    const cancelRate = completedOrders > 0 ? Math.round((cancelledOrders / completedOrders) * 100) : 0;

    let stars = 3;
    let riskLevel = "NEW";
    let badgeText = "নতুন কাস্টমার";
    let badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
    let recommendation = "নতুন কাস্টমার। অর্ডারটি ফোনে কনফার্ম করে নিন।";

    const isBlacklisted = Boolean(blacklistEntry);

    if (isBlacklisted) {
        stars = 0;
        riskLevel = "BLOCKED";
        badgeText = "🚫 ব্লকলিস্টেড";
        badgeColor = "bg-red-600 text-white border-red-700 animate-pulse";
        recommendation = `কাস্টমার ব্লকলিস্টে আছে (${blacklistEntry.reason || "সন্দেহভাজন ফ্রড"})! এই অর্ডারে পার্সেল পাঠাবেন না।`;
    } else if (abnormalOrders > 0 || (cancelledOrders >= 2 && deliveredOrders === 0)) {
        stars = 1;
        riskLevel = "HIGH_RISK";
        badgeText = "⚠️ হাই রিস্ক কাস্টমার";
        badgeColor = "bg-red-100 text-red-800 border-red-300";
        recommendation = `সতর্কতা: একাধিক ক্যানসেলের রেকর্ড রয়েছে (${cancelledOrders}টি বাতিল)। অবশ্যই অ্যাডভান্স ডেলিভারি চার্জ নিয়ে পার্সেল পাঠান।`;
    } else if (cancelledOrders > deliveredOrders && cancelledOrders >= 1) {
        stars = 2;
        riskLevel = "MODERATE_RISK";
        badgeText = "সতর্কতা (ক্যানসেল বেশি)";
        badgeColor = "bg-amber-100 text-amber-800 border-amber-300";
        recommendation = `ক্যানসেল রেট ${cancelRate}%। ডেলিভারির আগে ফোন করে অর্ডার নিশ্চিত করুন।`;
    } else if (deliveredOrders >= 3 && cancelRate <= 15) {
        stars = 5;
        riskLevel = "VIP";
        badgeText = "⭐⭐⭐⭐⭐ বিশ্বস্ত VIP";
        badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
        recommendation = `১০০% নিরাপদ ও বিশ্বস্ত কাস্টমার (${deliveredOrders}টি সফল ডেলিভারি)। দ্রুত পার্সেল পাঠানো যাবে।`;
    } else if (deliveredOrders >= 1 && cancelRate <= 25) {
        stars = 4;
        riskLevel = "TRUSTED";
        badgeText = "⭐⭐⭐⭐ নিয়মিত ক্রেতা";
        badgeColor = "bg-green-100 text-green-800 border-green-300";
        recommendation = `বিশ্বস্ত কাস্টমার (${deliveredOrders}টি সফল ডেলিভারি)। নিশ্চিন্তে পাঠানো যাবে।`;
    } else if (totalOrders === 1) {
        stars = 3;
        riskLevel = "NEW";
        badgeText = "🆕 প্রথম অর্ডার";
        badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
        recommendation = "কাস্টমারের এটি প্রথম অর্ডার। ফোনে কনফার্ম করে বুকিং দিন।";
    }

    return {
        phone: cleanPhone,
        stars,
        riskLevel,
        badgeText,
        badgeColor,
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        pendingOrders,
        abnormalOrders,
        successRate,
        cancelRate,
        totalSpent,
        isBlacklisted,
        blacklistReason: blacklistEntry?.reason || null,
        recommendation
    };
}

/**
 * Batch score customer phones for efficient table rendering.
 */
export async function batchGetCustomerScores(phoneList) {
    if (!phoneList || phoneList.length === 0) return {};

    const cleanPhones = Array.from(new Set(phoneList.map(formatBangladeshiPhone).filter(Boolean)));
    const allVariants = cleanPhones.flatMap(p => [p, `880${p.replace(/^0/, "")}`, p.replace(/^0/, "")]);

    const [blacklists, orders] = await Promise.all([
        prisma.blacklist.findMany({
            where: { phone: { in: allVariants } }
        }),
        prisma.order.findMany({
            where: { phone: { in: allVariants } },
            select: {
                id: true,
                phone: true,
                status: true,
                isAbnormal: true,
            }
        })
    ]);

    const blacklistMap = new Map();
    blacklists.forEach(b => {
        if (b.phone) {
            blacklistMap.set(formatBangladeshiPhone(b.phone), b);
        }
    });

    const ordersByPhone = new Map();
    orders.forEach(o => {
        const p = formatBangladeshiPhone(o.phone);
        if (!ordersByPhone.has(p)) ordersByPhone.set(p, []);
        ordersByPhone.get(p).push(o);
    });

    const scoreMap = {};

    cleanPhones.forEach(phone => {
        const customerOrders = ordersByPhone.get(phone) || [];
        const isBlacklisted = blacklistMap.has(phone);
        const blEntry = blacklistMap.get(phone);

        const totalOrders = customerOrders.length;
        const deliveredOrders = customerOrders.filter(o => o.status === "DELIVERED").length;
        const cancelledOrders = customerOrders.filter(o => o.status === "CANCELLED").length;
        const abnormalOrders = customerOrders.filter(o => o.isAbnormal).length;
        const completed = deliveredOrders + cancelledOrders;
        const successRate = completed > 0 ? Math.round((deliveredOrders / completed) * 100) : (deliveredOrders > 0 ? 100 : 0);
        const cancelRate = completed > 0 ? Math.round((cancelledOrders / completed) * 100) : 0;

        let stars = 3;
        let riskLevel = "NEW";
        let badgeText = "নতুন";
        let badgeColor = "bg-blue-100 text-blue-800";

        if (isBlacklisted) {
            stars = 0;
            riskLevel = "BLOCKED";
            badgeText = "🚫 ব্লকলিস্ট";
            badgeColor = "bg-red-600 text-white animate-pulse font-bold";
        } else if (abnormalOrders > 0 || (cancelledOrders >= 2 && deliveredOrders === 0)) {
            stars = 1;
            riskLevel = "HIGH_RISK";
            badgeText = "⚠️ হাই রিস্ক";
            badgeColor = "bg-red-100 text-red-800 font-semibold";
        } else if (cancelledOrders > deliveredOrders && cancelledOrders >= 1) {
            stars = 2;
            riskLevel = "MODERATE_RISK";
            badgeText = "⚠️ ক্যানসেল বেশি";
            badgeColor = "bg-amber-100 text-amber-800";
        } else if (deliveredOrders >= 3 && cancelRate <= 15) {
            stars = 5;
            riskLevel = "VIP";
            badgeText = "⭐ VIP";
            badgeColor = "bg-emerald-100 text-emerald-800 font-bold";
        } else if (deliveredOrders >= 1 && cancelRate <= 25) {
            stars = 4;
            riskLevel = "TRUSTED";
            badgeText = "⭐ বিশ্বস্ত";
            badgeColor = "bg-green-100 text-green-800";
        }

        scoreMap[phone] = {
            stars,
            riskLevel,
            badgeText,
            badgeColor,
            totalOrders,
            deliveredOrders,
            cancelledOrders,
            successRate,
            cancelRate,
            isBlacklisted,
            blacklistReason: blEntry?.reason || null
        };
    });

    return scoreMap;
}
