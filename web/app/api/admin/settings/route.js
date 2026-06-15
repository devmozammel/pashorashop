import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { createAuditLog } from "@/lib/audit";

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
    // Payment Gateways
    sslcommerzStoreId: "",
    sslcommerzStorePassword: "",
    // Advanced
    maintenanceMode: false,
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

        return NextResponse.json({ ok: true, data: mergedSettings });
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

        const cleanSettings = {
            ...currentSettings,
            // Store info
            siteName: body.siteName ?? currentSettings.siteName ?? DEFAULT_SETTINGS.siteName,
            currencySymbol: body.currencySymbol ?? currentSettings.currencySymbol ?? DEFAULT_SETTINGS.currencySymbol,
            supportEmail: body.supportEmail ?? currentSettings.supportEmail ?? "",
            whatsapp: body.whatsapp ?? currentSettings.whatsapp ?? "",
            address: body.address ?? currentSettings.address ?? "",

            // Shipping
            deliveryFeeInside: body.deliveryFeeInside !== undefined ? Number(body.deliveryFeeInside) : (currentSettings.deliveryFeeInside ?? 70),
            deliveryFeeOutside: body.deliveryFeeOutside !== undefined ? Number(body.deliveryFeeOutside) : (currentSettings.deliveryFeeOutside ?? 130),
            // Tracking
            facebookPixelId: body.facebookPixelId ?? currentSettings.facebookPixelId ?? "",
            facebookConversionToken: body.facebookConversionToken ?? currentSettings.facebookConversionToken ?? "",
            // Payments
            sslcommerzStoreId: body.sslcommerzStoreId ?? currentSettings.sslcommerzStoreId ?? "",
            sslcommerzStorePassword: body.sslcommerzStorePassword ?? currentSettings.sslcommerzStorePassword ?? "",
            // Advanced
            maintenanceMode: body.maintenanceMode !== undefined ? Boolean(body.maintenanceMode) : (currentSettings.maintenanceMode ?? false),
        };

        const setting = await prisma.siteSetting.upsert({
            where: { key: "store_settings" },
            update: { value: JSON.stringify(cleanSettings), type: "json" },
            create: { key: "store_settings", value: JSON.stringify(cleanSettings), type: "json" }
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

        return NextResponse.json({ ok: true, data: JSON.parse(setting.value) });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
