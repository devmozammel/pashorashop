import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

const DEFAULT_TOGGLES = {
    banners: false,
    inventory: false,
    shipping: false,
    payments: false,
    pricing: false,
    orderTimeline: false,
    activity: false,
    feedExport: false,
    tracking: false,
    images: false,
    variants: false,
};

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const setting = await prisma.siteSetting.findUnique({
            where: { key: "feature_toggles" }
        });

        const toggles = setting ? JSON.parse(setting.value) : DEFAULT_TOGGLES;

        // Merge with defaults in case new ones were added
        const mergedToggles = { ...DEFAULT_TOGGLES, ...toggles };

        return NextResponse.json({ ok: true, data: mergedToggles });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();

        // Merge to ensure no garbage keys
        const mergedToggles = { ...DEFAULT_TOGGLES, ...body };

        // Filter out keys not in defaults
        const cleanToggles = Object.keys(DEFAULT_TOGGLES).reduce((acc, key) => {
            acc[key] = !!mergedToggles[key];
            return acc;
        }, {});

        const setting = await prisma.siteSetting.upsert({
            where: { key: "feature_toggles" },
            update: { value: JSON.stringify(cleanToggles), type: "json" },
            create: { key: "feature_toggles", value: JSON.stringify(cleanToggles), type: "json" }
        });

        return NextResponse.json({ ok: true, data: JSON.parse(setting.value) });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
