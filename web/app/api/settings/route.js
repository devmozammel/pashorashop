
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET(req) {
    try {
        const settings = await prisma.siteSetting.findMany({
            where: {
                isPublic: true // Only return settings marked as public
            }
        });

        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Expose shipping fees but strip ALL sensitive credentials from store_settings
        if (settingsMap.store_settings) {
            try {
                const parsed = JSON.parse(settingsMap.store_settings);

                // Expose only the safe public fields
                settingsMap.shipping_fee_inside  = String(parsed.deliveryFeeInside  ?? 70);
                settingsMap.shipping_fee_outside = String(parsed.deliveryFeeOutside ?? 130);

                // Build a safe public store_settings (whitelist approach)
                const safeStoreSettings = {
                    storeName:        parsed.storeName,
                    storeEmail:       parsed.storeEmail,
                    storePhone:       parsed.storePhone,
                    storeAddress:     parsed.storeAddress,
                    whatsapp:         parsed.whatsapp || "8801620778044",
                    deliveryFeeInside:  parsed.deliveryFeeInside,
                    deliveryFeeOutside: parsed.deliveryFeeOutside,
                    currency:         parsed.currency,
                    facebookPixelId:  parsed.facebookPixelId,
                    tiktokPixelId:    parsed.tiktokPixelId,
                };
                settingsMap.store_settings = JSON.stringify(safeStoreSettings);
            } catch (_) { }
        }

        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}



export async function POST(req) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const updates = Object.entries(body).map(([key, value]) => {
            return prisma.siteSetting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value), type: typeof value === 'boolean' ? 'boolean' : 'text' }
            });
        });

        await prisma.$transaction(updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
