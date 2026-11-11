import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchFacebookUserProfile, rememberEphemeralImage } from "@/lib/meta-api";
import { getSocialSettings } from "@/lib/social-settings";
import { ingestInboundSocialEvent } from "@/lib/social-ingestion";
import { maybeRunInboxRetentionCleanup } from "@/lib/inbox-retention";

export const dynamic = "force-dynamic";

const LAST_WEBHOOK_KEY = "social_last_webhook_event";

async function recordWebhookStatus({ status, objectType = null, summary = null, error = null }) {
    try {
        const payload = JSON.stringify({
            timestamp: new Date().toISOString(),
            status,
            objectType,
            summary,
            error: error ? String(error).slice(0, 200) : null,
        });
        await prisma.siteSetting.upsert({
            where: { key: LAST_WEBHOOK_KEY },
            update: { value: payload, type: "json", isPublic: false },
            create: { key: LAST_WEBHOOK_KEY, value: payload, type: "json", isPublic: false },
        });
    } catch {
        // Non-blocking diagnostic logging must never break webhook ACK
    }
}

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
    let objectType = null;
    try {
        const rawBody = await req.text();
        const settings = await getSocialSettings();
        const sig = req.headers.get("x-hub-signature-256");

        if (!verifyMetaSignature(rawBody, sig, settings.metaAppSecret)) {
            await recordWebhookStatus({
                status: "ERROR",
                error: "Invalid X-Hub-Signature-256 header",
            });
            return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 });
        }

        maybeRunInboxRetentionCleanup();

        const payload = JSON.parse(rawBody || "{}");
        objectType = payload.object || null;
        const entries = Array.isArray(payload.entry) ? payload.entry : [];
        const profileCache = new Map();
        let ingestedCount = 0;

        for (const entry of entries) {
            // 1) Facebook Messenger messaging events
            if (objectType === "page" && Array.isArray(entry.messaging)) {
                for (const event of entry.messaging) {
                    if (event.message?.is_echo) continue;
                    const senderId = event.sender?.id;
                    if (!senderId || (settings.fbPageId && senderId === settings.fbPageId)) continue;

                    const att = event.message?.attachments?.[0];
                    const attType = String(att?.type || "").toLowerCase();
                    const rawMediaUrl = att?.payload?.url || null;
                    const messageType =
                        attType === "audio"
                            ? "AUDIO"
                            : attType === "video"
                            ? "VIDEO"
                            : rawMediaUrl
                            ? "IMAGE"
                            : "TEXT";
                    // Never store customer images/image URLs in our database — hold briefly in RAM only
                    if (messageType === "IMAGE" && rawMediaUrl && event.message?.mid) {
                        rememberEphemeralImage(event.message.mid, rawMediaUrl);
                    }
                    const mediaUrlToPersist = messageType === "IMAGE" ? null : rawMediaUrl;
                    const text =
                        event.message?.text ||
                        event.postback?.title ||
                        (attType === "audio"
                            ? "[Voice Message]"
                            : messageType === "IMAGE"
                            ? "[Customer Image]"
                            : attType
                            ? `[${attType}]`
                            : "");
                    if (!text && !rawMediaUrl) continue;

                    let profile = profileCache.get(senderId);
                    if (!profile) {
                        profile = await fetchFacebookUserProfile(senderId, settings.fbPageAccessToken);
                        profileCache.set(senderId, profile);
                    }

                    const referral = event.referral || event.message?.referral || event.postback?.referral;
                    const adId = referral?.ad_id || referral?.ads_context_data?.ad_id || null;
                    const adName = referral?.ads_context_data?.ad_title || (adId ? `Ad #${adId}` : null);

                    await ingestInboundSocialEvent({
                        channel: "MESSENGER",
                        externalThreadId: senderId,
                        externalUserId: senderId,
                        externalMessageId: event.message?.mid,
                        customerName: profile?.name || `FB User ${senderId.slice(-4)}`,
                        customerAvatar: profile?.avatarUrl || null,
                        body: text || `[${messageType}]`,
                        messageType,
                        mediaUrl: mediaUrlToPersist,
                        adPlatform: adId ? "FACEBOOK" : "ORGANIC",
                        adId,
                        adName,
                        adRef: referral?.ref || null,
                    });
                    ingestedCount++;
                }
            }

            // 2) Facebook Page Feed Comments OR WhatsApp Cloud API
            if (Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    const val = change.value || {};

                    // WhatsApp Cloud API
                    if (objectType === "whatsapp_business_account" && Array.isArray(val.messages)) {
                        const contacts = Array.isArray(val.contacts) ? val.contacts : [];
                        for (const msg of val.messages) {
                            const contact = contacts.find((c) => c.wa_id === msg.from) || contacts[0];
                            const msgKind = String(msg.type || "").toLowerCase();
                            const mediaId =
                                msg.image?.id ||
                                msg.audio?.id ||
                                msg.voice?.id ||
                                msg.video?.id ||
                                null;
                            const messageType =
                                msgKind === "audio" || msgKind === "voice"
                                    ? "AUDIO"
                                    : msgKind === "video"
                                    ? "VIDEO"
                                    : mediaId
                                    ? "IMAGE"
                                    : "TEXT";
                            // Images never persist URL in DB; keep tiny ephemeral Meta ID only for live view
                            const mediaUrlToPersist =
                                mediaId && messageType !== "IMAGE" ? `/api/admin/inbox/media/${mediaId}` : null;
                            const text =
                                msg.text?.body ||
                                msg.image?.caption ||
                                msg.video?.caption ||
                                msg.button?.text ||
                                msg.interactive?.button_reply?.title ||
                                (messageType === "AUDIO"
                                    ? "[Voice Message]"
                                    : messageType === "IMAGE"
                                    ? "[Customer Image]"
                                    : `[${msgKind || "media"}]`);
                            if (!msg.from || (!text && !mediaId)) continue;

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
                                messageType,
                                mediaUrl: mediaUrlToPersist,
                                metadata:
                                    mediaId && messageType === "IMAGE"
                                        ? { waMediaId: mediaId }
                                        : undefined,
                                adPlatform: adId ? "FACEBOOK" : "ORGANIC",
                                adId,
                                adName: referral.headline || (adId ? `Click-to-WA Ad #${adId}` : null),
                                adRef: referral.ctwa_clid || null,
                            });
                            ingestedCount++;
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
                        ingestedCount++;
                    }
                }
            }
        }

        await recordWebhookStatus({
            status: "OK",
            objectType,
            summary: `${ingestedCount} message/comment event(s) processed`,
        });

        return NextResponse.json({ ok: true, received: true });
    } catch (error) {
        console.error("[Meta Webhook Error]:", error);
        await recordWebhookStatus({
            status: "ERROR",
            objectType,
            error: error?.message || "Webhook handler failure",
        });
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
