import { NextResponse } from "next/server";
import { cleanupExpiredInboxData } from "@/lib/inbox-retention";

export const dynamic = "force-dynamic";

async function handleCron(request) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret) {
            return NextResponse.json({ error: "Cron service not configured" }, { status: 503 });
        }

        const authHeader = request.headers.get("Authorization");
        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await cleanupExpiredInboxData({ force: true });
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    return handleCron(request);
}

export async function POST(request) {
    return handleCron(request);
}
