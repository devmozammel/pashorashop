import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";
import { encrypt, decrypt } from "@/lib/security";


export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
    siteName: "Fashion House",
    currencySymbol: "৳",
    supportEmail: "support@fashionhouse.com",
    whatsapp: "",
    address: "",
    // Shipping
    deliveryFeeInside: 70,
    deliveryFeeOutside: 130,
    // Tracking & Analytics
    facebookPixelId: "",
    facebookConversionToken: "",
    tiktokPixelId: "",
    // Payment Gateways
    sslcommerzStoreId: "",
    sslcommerzStorePassword: "",
    // Advanced
    maintenanceMode: false,
    // Steadfast Courier
    steadfastApiKey: "",
    steadfastSecretKey: "",
};


export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });

        const settings = setting ? JSON.parse(setting.value) : DEFAULT_SETTINGS;
        const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

        const isValidKey = (k) => k && typeof k === 'string' && !k.includes(':') && k.trim().length > 0;
        const safeDecrypt = (val, fallback = "") => {
            if (!val) return fallback;
            const dec = decrypt(val);
            return isValidKey(dec) ? dec : fallback;
        };

        // Decrypt sensitive fields
        const decryptedSettings = {
            ...mergedSettings,
            facebookConversionToken: decrypt(mergedSettings.facebookConversionToken) || "",
            sslcommerzStorePassword: decrypt(mergedSettings.sslcommerzStorePassword) || "",
            steadfastApiKey: safeDecrypt(mergedSettings.steadfastApiKey, process.env.STEADFAST_API_KEY || ""),
            steadfastSecretKey: safeDecrypt(mergedSettings.steadfastSecretKey, process.env.STEADFAST_SECRET_KEY || ""),
        };

        return NextResponse.json({ ok: true, data: decryptedSettings });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();

        // Load existing settings to merge (not overwrite unknown keys)
        const existing = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });
        const currentSettings = existing ? JSON.parse(existing.value) : {};

        const isValidKey = (k) => k && typeof k === 'string' && !k.includes(':') && k.trim().length > 0;
        const safeDecrypt = (val, fallback = "") => {
            if (!val) return fallback;
            const dec = decrypt(val);
            return isValidKey(dec) ? dec : fallback;
        };

        // Decrypt current settings to work with plaintext values internally
        const decryptedCurrent = {
            ...currentSettings,
            facebookConversionToken: decrypt(currentSettings.facebookConversionToken) || "",
            sslcommerzStorePassword: decrypt(currentSettings.sslcommerzStorePassword) || "",
            steadfastApiKey: safeDecrypt(currentSettings.steadfastApiKey, process.env.STEADFAST_API_KEY || ""),
            steadfastSecretKey: safeDecrypt(currentSettings.steadfastSecretKey, process.env.STEADFAST_SECRET_KEY || ""),
        };

        const cleanSettings = {
            ...decryptedCurrent,
            // Store info
            siteName: body.siteName ?? decryptedCurrent.siteName ?? DEFAULT_SETTINGS.siteName,
            currencySymbol: body.currencySymbol ?? decryptedCurrent.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
            supportEmail: body.supportEmail ?? decryptedCurrent.supportEmail ?? "",
            whatsapp: body.whatsapp ?? decryptedCurrent.whatsapp ?? "",
            address: body.address ?? decryptedCurrent.address ?? "",

            // Shipping
            deliveryFeeInside: body.deliveryFeeInside !== undefined ? Number(body.deliveryFeeInside) : (decryptedCurrent.deliveryFeeInside ?? 70),
            deliveryFeeOutside: body.deliveryFeeOutside !== undefined ? Number(body.deliveryFeeOutside) : (decryptedCurrent.deliveryFeeOutside ?? 130),
            // Tracking
            facebookPixelId: body.facebookPixelId ?? decryptedCurrent.facebookPixelId ?? "",
            facebookConversionToken: body.facebookConversionToken ?? decryptedCurrent.facebookConversionToken ?? "",
            tiktokPixelId: body.tiktokPixelId ?? decryptedCurrent.tiktokPixelId ?? "",
            // Payments
            sslcommerzStoreId: body.sslcommerzStoreId ?? decryptedCurrent.sslcommerzStoreId ?? "",
            sslcommerzStorePassword: body.sslcommerzStorePassword ?? decryptedCurrent.sslcommerzStorePassword ?? "",
            // Advanced
            maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : (decryptedCurrent.maintenanceMode ?? false),
            // Steadfast Courier
            steadfastApiKey: body.steadfastApiKey ?? decryptedCurrent.steadfastApiKey ?? "",
            steadfastSecretKey: body.steadfastSecretKey ?? decryptedCurrent.steadfastSecretKey ?? "",
        };

        // Encrypt sensitive fields before saving
        const encryptedSettings = {
            ...cleanSettings,
            facebookConversionToken: encrypt(cleanSettings.facebookConversionToken),
            sslcommerzStorePassword: encrypt(cleanSettings.sslcommerzStorePassword),
            steadfastApiKey: encrypt(cleanSettings.steadfastApiKey),
            steadfastSecretKey: encrypt(cleanSettings.steadfastSecretKey),
        };

        const setting = await prisma.siteSetting.upsert({
            where: { key: "store_settings" },
            update: { value: JSON.stringify(encryptedSettings), type: "json" },
            create: { key: "store_settings", value: JSON.stringify(encryptedSettings), type: "json" }
        });

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email || admin.id,
            action: "UPDATE",
            entityType: "SiteSetting",
            entityId: setting.id,
            meta: { key: "store_settings", changes: Object.keys(body) },
            ip
        });

        return NextResponse.json({ ok: true, data: cleanSettings });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
