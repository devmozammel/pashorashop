import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSocialSettings } from "@/lib/social-settings";
import { ingestInboundSocialEvent } from "@/lib/social-ingestion";

export const dynamic = "force-dynamic";

const tiktokLeadSchema = z.object({
    name: z.string().max(120).optional(),
    customerName: z.string().max(120).optional(),
    phone: z.string().max(30).optional(),
    phone_number: z.string().max(30).optional(),
    message: z.string().max(2000).optional(),
    text: z.string().max(2000).optional(),
    productName: z.string().max(200).optional(),
    ad_id: z.string().max(100).optional(),
    adId: z.string().max(100).optional(),
    ad_name: z.string().max(200).optional(),
    adName: z.string().max(200).optional(),
    campaign_name: z.string().max(200).optional(),
    campaignName: z.string().max(200).optional(),
    ttclid: z.string().max(200).optional(),
    lead_id: z.string().max(120).optional(),
    event_id: z.string().max(120).optional(),
    channel: z.enum(["WHATSAPP", "MESSENGER", "INSTAGRAM_DM"]).optional(),
});

function timingSafeMatch(provided, expected) {
    if (!provided || !expected) return false;
    const a = Buffer.from(String(provided));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

/**
 * TikTok Lead / Ad-Click Attribution Webhook.
 * Requires `x-webhook-secret` header or `?token=` matching `tiktokWebhookSecret`.
 */
export async function POST(req) {
    try {
        const settings = await getSocialSettings();
        const { searchParams } = new URL(req.url);
        const providedSecret =
            req.headers.get("x-webhook-secret") || searchParams.get("token") || "";

        if (!timingSafeMatch(providedSecret, settings.tiktokWebhookSecret)) {
            return NextResponse.json({ ok: false, message: "Unauthorized webhook token" }, { status: 401 });
        }

        const rawBody = await req.json();
        const parsed = tiktokLeadSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { ok: false, message: "Invalid webhook payload", errors: parsed.error.issues },
                { status: 400 }
            );
        }

        const body = parsed.data;
        const customerName = body.name || body.customerName || "TikTok Lead";
        const phone = body.phone || body.phone_number || "";
        const messageText =
            body.message ||
            body.text ||
            `TikTok Ad Lead${body.productName ? ` — Product: ${body.productName}` : ""}`;

        const adId = body.ad_id || body.adId || body.ttclid || "tiktok_boost";
        const adName = body.ad_name || body.adName || "TikTok Boost Ad";
        const campaignName = body.campaign_name || body.campaignName || "TikTok Campaign";
        const channel = body.channel || "WHATSAPP";

        const res = await ingestInboundSocialEvent({
            channel,
            externalThreadId: phone || body.lead_id || `tt_${Date.now()}`,
            externalUserId: phone || body.lead_id,
            externalMessageId: body.lead_id || body.event_id,
            customerName,
            phone,
            body: messageText,
            adPlatform: "TIKTOK",
            adId: String(adId),
            adName,
            campaignName,
            adRef: body.ttclid || null,
        });

        return NextResponse.json({ ok: true, data: res.conversation });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
