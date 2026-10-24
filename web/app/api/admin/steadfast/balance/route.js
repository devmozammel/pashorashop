import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { getSteadfastBalance } from "@/lib/steadfast";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const result = await getSteadfastBalance();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({
            ok: false,
            currentBalance: 0,
            message: error.message || "Failed to fetch Steadfast balance"
        }, { status: 500 });
    }
}
