
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";


export async function GET(req) {
    try {
        const settings = await prisma.siteSetting.findMany();
        // Convert array to object for easier consumption { key: value }
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Also expose shipping fees from the store_settings JSON blob
        // so that checkout page can read them as shipping_fee_inside / shipping_fee_outside
        if (settingsMap.store_settings) {
            try {
                const parsed = JSON.parse(settingsMap.store_settings);
                if (parsed.deliveryFeeInside !== undefined) {
                    settingsMap.shipping_fee_inside = String(parsed.deliveryFeeInside);
                }
                if (parsed.deliveryFeeOutside !== undefined) {
                    settingsMap.shipping_fee_outside = String(parsed.deliveryFeeOutside);
                }
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
