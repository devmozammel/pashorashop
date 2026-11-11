import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSocialSettings } from "@/lib/social-settings";
import { ingestInboundSocialEvent } from "@/lib/social-ingestion";

export const dynamic = "force-dynamic";

/**
 * Meta Webhook Verification (Facebook Page, Instagram, WhatsApp Cloud API).
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const settings = await getSocialSettings();

    if (mode === "subscribe" && token && token === settings.metaVerifyToken) {
        return new NextResponse(challenge || "OK", { status: 200 });
    }

    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
}

/**
 * Verify x-hub-signature-256 when metaAppSecret is configured.
 */
function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
    if (!appSecret) return true; // Not configured yet -> skip HMAC check
    if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

    const expected =
        "sha256=" +
        crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");

    const sigBuf = Buffer.from(signatureHeader);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Meta Webhook Event Ingestion (Messenger, FB Comments, IG DM, IG Comments, WhatsApp).
 */
export async function POST(req) {
    try {
        const rawBody = await req.text();
        const settings = await getSocialSettings();
        const sig = req.headers.get("x-hub-signature-256");

        if (!verifyMetaSignature(rawBody, sig, settings.metaAppSecret)) {
            return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody || "{}");
        const objectType = payload.object;
        const entries = Array.isArray(payload.entry) ? payload.entry : [];

        for (const entry of entries) {
            // 1) Messenger or Instagram DM messaging events
            if (Array.isArray(entry.messaging)) {
                const isIg = objectType === "instagram";
                for (const event of entry.messaging) {
                    if (event.message?.is_echo) continue;
                    const senderId = event.sender?.id;
                    const text = event.message?.text || (event.message?.attachments?.[0]?.type ? `[${event.message.attachments[0].type}]` : "");
                    const mediaUrl = event.message?.attachments?.[0]?.payload?.url || null;
                    if (!senderId || !text) continue;

                    const referral = event.referral || event.message?.referral || event.postback?.referral;
                    const adId = referral?.ad_id || referral?.ads_context_data?.ad_id || null;
                    const adName = referral?.ads_context_data?.ad_title || (adId ? `Ad #${adId}` : null);

                    await ingestInboundSocialEvent({
                        channel: isIg ? "INSTAGRAM_DM" : "MESSENGER",
                        externalThreadId: senderId,
                        externalUserId: senderId,
                        externalMessageId: event.message?.mid,
                        customerName: isIg ? `IG User ${senderId.slice(-4)}` : `FB User ${senderId.slice(-4)}`,
                        body: text,
                        mediaUrl,
                        adPlatform: adId ? (isIg ? "INSTAGRAM" : "FACEBOOK") : "ORGANIC",
                        adId,
                        adName,
                        adRef: referral?.ref || null,
                    });
                }
            }

            // 2) Facebook Page Feed Comments OR Instagram Comments OR WhatsApp
            if (Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    const val = change.value || {};

                    // WhatsApp Cloud API
                    if (objectType === "whatsapp_business_account" && Array.isArray(val.messages)) {
                        const contacts = Array.isArray(val.contacts) ? val.contacts : [];
                        for (const msg of val.messages) {
                            const contact = contacts.find((c) => c.wa_id === msg.from) || contacts[0];
                            const text =
                                msg.text?.body ||
                                msg.button?.text ||
                                msg.interactive?.button_reply?.title ||
                                `[${msg.type || "media"}]`;
                            if (!msg.from || !text) continue;

                            const referral = msg.referral || {};
                            const adId = referral.source_id || null;

                            await ingestInboundSocialEvent({
                                channel: "WHATSAPP",
                                externalThreadId: msg.from,
                                externalUserId: msg.from,
                                externalMessageId: msg.id,
                                customerName: contact?.profile?.name || msg.from,
                                customerHandle: `+${msg.from}`,
                                phone: msg.from,
                                body: text,
                                adPlatform: adId ? "FACEBOOK" : "ORGANIC",
                                adId,
                                adName: referral.headline || (adId ? `Click-to-WA Ad #${adId}` : null),
                                adRef: referral.ctwa_clid || null,
                            });
                        }
                    }

                    // Facebook Page Post Comment
                    if (objectType === "page" && change.field === "feed" && val.item === "comment" && val.verb === "add") {
                        // Ignore replies made by the page itself
                        if (val.from?.id && settings.fbPageId && val.from.id === settings.fbPageId) continue;
                        if (!val.message) continue;

                        await ingestInboundSocialEvent({
                            channel: "FB_COMMENT",
                            externalThreadId: `${val.post_id || "post"}_${val.from?.id || val.comment_id}`,
                            externalUserId: val.from?.id || val.comment_id,
                            externalMessageId: val.comment_id,
                            commentId: val.comment_id,
                            customerName: val.from?.name || "Facebook User",
                            body: val.message,
                            postId: val.post_id || null,
                            postUrl: val.post?.permalink_url || null,
                            postTitle: val.post?.status_type ? `Facebook Post (${val.post_id})` : "Facebook Page Post",
                        });
                    }

                    // Instagram Post Comment
                    if (objectType === "instagram" && change.field === "comments") {
                        if (!val.text) continue;
                        const igUserId = val.from?.id || val.id;
                        await ingestInboundSocialEvent({
                            channel: "INSTAGRAM_COMMENT",
                            externalThreadId: `${val.media?.id || "media"}_${igUserId}`,
                            externalUserId: igUserId,
                            externalMessageId: val.id,
                            commentId: val.id,
                            customerName: val.from?.username ? `@${val.from.username}` : "Instagram User",
                            customerHandle: val.from?.username ? `@${val.from.username}` : null,
                            body: val.text,
                            postId: val.media?.id || null,
                            postTitle: "Instagram Post",
                        });
                    }
                }
            }
        }

        return NextResponse.json({ ok: true, received: true });
    } catch (error) {
        console.error("[Meta Webhook Error]:", error);
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
