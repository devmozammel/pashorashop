import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { getCustomerScore } from "@/lib/customer-scoring";

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

        const score = await getCustomerScore(phone);
        return NextResponse.json({ ok: true, data: score });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to calculate customer score" }, { status: 500 });
    }
}
