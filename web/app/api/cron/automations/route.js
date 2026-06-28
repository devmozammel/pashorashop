
import { checkAbandonedCheckouts } from "@/lib/automations";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // SECURITY: No fallback allowed — must be explicitly set in environment
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET is not configured in environment variables.");
            return NextResponse.json({ error: "Cron service not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const count = await checkAbandonedCheckouts();
        return NextResponse.json({ success: true, processed: count });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
