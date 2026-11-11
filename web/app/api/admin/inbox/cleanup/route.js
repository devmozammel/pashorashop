import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import {
    cleanupExpiredInboxData,
    getInboxRetentionStats,
    INBOX_RETENTION_DAYS,
} from "@/lib/inbox-retention";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const stats = await getInboxRetentionStats();
    return NextResponse.json({
        ok: true,
        retentionDays: INBOX_RETENTION_DAYS,
        stats,
    });
}

export async function POST() {
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const result = await cleanupExpiredInboxData({ force: true });
    return NextResponse.json({
        ok: Boolean(result.ok),
        retentionDays: INBOX_RETENTION_DAYS,
        ...result,
    });
}
