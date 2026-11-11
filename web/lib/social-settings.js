import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/security";

export const SOCIAL_SETTINGS_KEY = "social_commerce_settings";

export const DEFAULT_SOCIAL_SETTINGS = {
    // Meta (Facebook Page, Messenger, Instagram)
    metaAppSecret: "",
    metaVerifyToken: "pashora_meta_verify_2026",
    tiktokWebhookSecret: "pashora_tiktok_verify_2026",
    fbPageId: "",
    fbPageAccessToken: "",
    igAccountId: "",

    // WhatsApp Cloud API
    waPhoneNumberId: "",
    waAccessToken: "",

    // Gemini AI Co-pilot
    geminiApiKey: "",
    geminiModel: "gemini-2.5-flash",
    aiAutoDraftEnabled: true,
    aiAutoReplyEnabled: false, // When true, auto-replies to clear price/delivery questions

    // Pathao Courier
    pathaoClientId: "",
    pathaoClientSecret: "",
    pathaoUsername: "",
    pathaoPassword: "",
    pathaoStoreId: "",
    pathaoSandbox: false,

    // RedX Courier
    redxApiToken: "",
    redxStoreId: "",
    redxSandbox: false,

    // Default Courier & Delivery
    defaultCourier: "Steadfast",
};

const SECRET_FIELDS = [
    "metaAppSecret",
    "tiktokWebhookSecret",
    "fbPageAccessToken",
    "waAccessToken",
    "geminiApiKey",
    "pathaoClientSecret",
    "pathaoPassword",
    "redxApiToken",
];

function safeDecrypt(val, fallback = "") {
    if (!val || typeof val !== "string") return fallback;
    if (!val.includes(":")) return val;
    const dec = decrypt(val);
    return dec && !dec.includes(":") ? dec : fallback;
}

/**
 * Retrieve decrypted Social Commerce, Courier, and Gemini settings.
 */
export async function getSocialSettings() {
    let raw = {};
    try {
        const row = await prisma.siteSetting.findUnique({
            where: { key: SOCIAL_SETTINGS_KEY },
        });
        if (row?.value) {
            raw = JSON.parse(row.value);
        }
    } catch (err) {
        console.error("[SocialSettings] Failed to read:", err.message);
    }

    const merged = { ...DEFAULT_SOCIAL_SETTINGS, ...raw };

    // Decrypt secret fields and allow env fallbacks
    return {
        ...merged,
        metaAppSecret: safeDecrypt(merged.metaAppSecret, process.env.META_APP_SECRET || ""),
        metaVerifyToken: merged.metaVerifyToken || process.env.META_VERIFY_TOKEN || DEFAULT_SOCIAL_SETTINGS.metaVerifyToken,
        tiktokWebhookSecret: safeDecrypt(merged.tiktokWebhookSecret, process.env.TIKTOK_WEBHOOK_SECRET || DEFAULT_SOCIAL_SETTINGS.tiktokWebhookSecret),
        fbPageId: merged.fbPageId || process.env.FB_PAGE_ID || "",
        fbPageAccessToken: safeDecrypt(merged.fbPageAccessToken, process.env.FB_PAGE_ACCESS_TOKEN || ""),
        igAccountId: merged.igAccountId || process.env.IG_ACCOUNT_ID || "",

        waPhoneNumberId: merged.waPhoneNumberId || process.env.WA_PHONE_NUMBER_ID || "",
        waAccessToken: safeDecrypt(merged.waAccessToken, process.env.WA_ACCESS_TOKEN || ""),

        geminiApiKey: safeDecrypt(merged.geminiApiKey, process.env.GEMINI_API_KEY || ""),
        geminiModel: merged.geminiModel || process.env.GEMINI_MODEL || "gemini-2.5-flash",
        aiAutoDraftEnabled: merged.aiAutoDraftEnabled !== false,
        aiAutoReplyEnabled: Boolean(merged.aiAutoReplyEnabled),

        pathaoClientId: merged.pathaoClientId || process.env.PATHAO_CLIENT_ID || "",
        pathaoClientSecret: safeDecrypt(merged.pathaoClientSecret, process.env.PATHAO_CLIENT_SECRET || ""),
        pathaoUsername: merged.pathaoUsername || process.env.PATHAO_USERNAME || "",
        pathaoPassword: safeDecrypt(merged.pathaoPassword, process.env.PATHAO_PASSWORD || ""),
        pathaoStoreId: merged.pathaoStoreId || process.env.PATHAO_STORE_ID || "",
        pathaoSandbox: Boolean(merged.pathaoSandbox),

        redxApiToken: safeDecrypt(merged.redxApiToken, process.env.REDX_API_TOKEN || ""),
        redxStoreId: merged.redxStoreId || process.env.REDX_STORE_ID || "",
        redxSandbox: Boolean(merged.redxSandbox),

        defaultCourier: merged.defaultCourier || "Steadfast",
    };
}

/**
 * Save Social Commerce settings with AES-256 encryption for secrets.
 */
export async function saveSocialSettings(input) {
    const current = await getSocialSettings();
    const allowedKeys = Object.keys(DEFAULT_SOCIAL_SETTINGS);
    const sanitizedInput = {};
    for (const key of allowedKeys) {
        if (input && input[key] !== undefined) {
            sanitizedInput[key] = input[key];
        }
    }

    const updated = {
        ...current,
        ...sanitizedInput,
        aiAutoDraftEnabled: sanitizedInput.aiAutoDraftEnabled !== undefined ? Boolean(sanitizedInput.aiAutoDraftEnabled) : current.aiAutoDraftEnabled,
        aiAutoReplyEnabled: sanitizedInput.aiAutoReplyEnabled !== undefined ? Boolean(sanitizedInput.aiAutoReplyEnabled) : current.aiAutoReplyEnabled,
        pathaoSandbox: sanitizedInput.pathaoSandbox !== undefined ? Boolean(sanitizedInput.pathaoSandbox) : current.pathaoSandbox,
        redxSandbox: sanitizedInput.redxSandbox !== undefined ? Boolean(sanitizedInput.redxSandbox) : current.redxSandbox,
    };

    const toStore = { ...updated };
    for (const key of SECRET_FIELDS) {
        if (toStore[key]) {
            toStore[key] = encrypt(String(toStore[key]).trim());
        }
    }

    await prisma.siteSetting.upsert({
        where: { key: SOCIAL_SETTINGS_KEY },
        update: { value: JSON.stringify(toStore), type: "json", isPublic: false },
        create: { key: SOCIAL_SETTINGS_KEY, value: JSON.stringify(toStore), type: "json", isPublic: false },
    });

    return updated;
}

/**
 * Also read store delivery fees & site name from store_settings.
 */
export async function getStoreBasicConfig() {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" },
        });
        const parsed = setting?.value ? JSON.parse(setting.value) : {};
        return {
            siteName: parsed.siteName || "Pashora Shop",
            currencySymbol: parsed.currencySymbol || "৳",
            deliveryFeeInside: Number(parsed.deliveryFeeInside ?? 70),
            deliveryFeeOutside: Number(parsed.deliveryFeeOutside ?? 130),
        };
    } catch {
        return {
            siteName: "Pashora Shop",
            currencySymbol: "৳",
            deliveryFeeInside: 70,
            deliveryFeeOutside: 130,
        };
    }
}
