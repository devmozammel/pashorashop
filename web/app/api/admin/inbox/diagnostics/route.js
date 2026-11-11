import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { checkMetaConnections } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    const database = {
        ok: false,
        conversations: 0,
        messages: 0,
        error: null,
    };

    try {
        const [conversations, messages] = await Promise.all([
            prisma.socialConversation.count(),
            prisma.socialMessage.count(),
        ]);
        database.ok = true;
        database.conversations = conversations;
        database.messages = messages;
    } catch (err) {
        database.error = err?.message || "Database table check failed";
    }

    let meta = null;
    try {
        meta = await checkMetaConnections();
    } catch (err) {
        meta = { error: err?.message || "Meta check failed" };
    }

    let lastWebhook = null;
    try {
        const row = await prisma.siteSetting.findUnique({
            where: { key: "social_last_webhook_event" },
        });
        if (row?.value) {
            lastWebhook = JSON.parse(row.value);
        }
    } catch {
        lastWebhook = null;
    }

    return NextResponse.json({
        ok: true,
        data: {
            database,
            meta,
            lastWebhook,
        },
    });
}
