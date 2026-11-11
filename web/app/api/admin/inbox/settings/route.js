import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { getSocialSettings, saveSocialSettings } from "@/lib/social-settings";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const settings = await getSocialSettings();
        return NextResponse.json({ ok: true, data: settings });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const saved = await saveSocialSettings(body);

        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        await createAuditLog({
            adminId: admin.user?.id || admin.user?.email,
            action: "UPDATE",
            entityType: "SocialSettings",
            meta: { keys: Object.keys(body) },
            ip,
        }).catch(() => {});

        return NextResponse.json({ ok: true, data: saved });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
