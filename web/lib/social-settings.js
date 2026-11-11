import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/security";

export const SOCIAL_SETTINGS_KEY = "social_commerce_settings";

export const DEFAULT_SOCIAL_SETTINGS = {
    // Meta (Facebook Page, Messenger)
    metaAppSecret: "",
    metaVerifyToken: "pashora_meta_verify_2026",
    fbPageId: "",
    fbPageAccessToken: "",

    // WhatsApp Cloud API
    waPhoneNumberId: "",
    waAccessToken: "",

    // Default Courier & Delivery
    defaultCourier: "Steadfast",
};

const SECRET_FIELDS = [
    "metaAppSecret",
    "fbPageAccessToken",
    "waAccessToken",
];

function safeDecrypt(val, fallback = "") {
    if (!val || typeof val !== "string") return fallback;
    if (!val.includes(":")) return val;
    const dec = decrypt(val);
    return dec && !dec.includes(":") ? dec : fallback;
}

/**
 * Retrieve decrypted Facebook, WhatsApp, and Steadfast inbox settings.
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
        metaAppSecret: safeDecrypt(merged.metaAppSecret, process.env.META_APP_SECRET || ""),
        metaVerifyToken: merged.metaVerifyToken || process.env.META_VERIFY_TOKEN || DEFAULT_SOCIAL_SETTINGS.metaVerifyToken,
        fbPageId: merged.fbPageId || process.env.FB_PAGE_ID || "",
        fbPageAccessToken: safeDecrypt(merged.fbPageAccessToken, process.env.FB_PAGE_ACCESS_TOKEN || ""),

        waPhoneNumberId: merged.waPhoneNumberId || process.env.WA_PHONE_NUMBER_ID || "",
        waAccessToken: safeDecrypt(merged.waAccessToken, process.env.WA_ACCESS_TOKEN || ""),

        defaultCourier: "Steadfast",
    };
}

/**
 * Save Facebook & WhatsApp inbox settings with AES-256 encryption for secrets.
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
        defaultCourier: "Steadfast",
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
