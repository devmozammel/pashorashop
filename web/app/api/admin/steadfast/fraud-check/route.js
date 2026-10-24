import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { checkSteadfastFraud } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ ok: false, message: "Phone number is required" }, { status: 400 });
        }

        const fraudResult = await checkSteadfastFraud(phone);
        return NextResponse.json(fraudResult);
    } catch (err) {
        console.error("Steadfast fraud check route error:", err);
        return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
    }
}
