import { getSocialSettings } from "@/lib/social-settings";

const GRAPH_BASE = "https://graph.facebook.com/v21.0";

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Send an outbound message/reply to the appropriate Meta / WhatsApp channel.
 * Falls back cleanly to `simulated: true` when API tokens are not yet configured,
 * allowing full end-to-end testing in the admin inbox before Meta App Review.
 */
export async function sendChannelReply({
    channel,
    externalUserId,
    externalThreadId,
    commentId,
    text,
    isPublicCommentReply = false,
}) {
    const settings = await getSocialSettings();

    // 1. WhatsApp Cloud API
    if (channel === "WHATSAPP") {
        if (!settings.waPhoneNumberId || !settings.waAccessToken) {
            return { ok: true, simulated: true, externalMessageId: `sim_wa_${Date.now()}` };
        }
        const to = (externalUserId || externalThreadId || "").replace(/\D/g, "");
        const res = await fetchWithTimeout(`${GRAPH_BASE}/${settings.waPhoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${settings.waAccessToken}`,
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "text",
                text: { preview_url: true, body: text },
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { ok: false, message: data?.error?.message || "WhatsApp send failed", raw: data };
        }
        return {
            ok: true,
            simulated: false,
            externalMessageId: data?.messages?.[0]?.id || `wa_${Date.now()}`,
        };
    }

    // 2. Facebook Public Comment Reply
    if (channel === "FB_COMMENT" && isPublicCommentReply) {
        if (!settings.fbPageAccessToken || !commentId) {
            return { ok: true, simulated: true, externalMessageId: `sim_cmt_${Date.now()}` };
        }
        const res = await fetchWithTimeout(`${GRAPH_BASE}/${commentId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${settings.fbPageAccessToken}`,
            },
            body: JSON.stringify({ message: text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { ok: false, message: data?.error?.message || "Comment reply failed", raw: data };
        }
        return { ok: true, simulated: false, externalMessageId: data?.id || `cmt_${Date.now()}` };
    }

    // 3. Facebook Messenger / Comment-to-Private-Inbox
    if (!settings.fbPageAccessToken) {
        return { ok: true, simulated: true, externalMessageId: `sim_meta_${Date.now()}` };
    }

    const pageId = settings.fbPageId || "me";
    const recipient = commentId && channel === "FB_COMMENT"
        ? { comment_id: commentId }
        : { id: externalUserId || externalThreadId };

    const res = await fetchWithTimeout(`${GRAPH_BASE}/${pageId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${settings.fbPageAccessToken}`,
        },
        body: JSON.stringify({
            recipient,
            messaging_type: "RESPONSE",
            message: { text },
        }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        return { ok: false, message: data?.error?.message || "Meta send API failed", raw: data };
    }

    return {
        ok: true,
        simulated: false,
        externalMessageId: data?.message_id || `meta_${Date.now()}`,
    };
}
