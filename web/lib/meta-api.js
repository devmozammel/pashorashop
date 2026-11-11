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
 * Look up a Facebook Messenger PSID's name & profile picture cleanly.
 * Never throws so webhook ingestion stays resilient.
 */
export async function fetchFacebookUserProfile(psid, pageAccessToken) {
    if (!psid || !pageAccessToken) return {};
    try {
        const res = await fetchWithTimeout(
            `${GRAPH_BASE}/${encodeURIComponent(psid)}?fields=name,first_name,last_name,profile_pic`,
            {
                headers: { Authorization: `Bearer ${pageAccessToken}` },
            },
            3000
        );
        if (!res.ok) return {};
        const data = await res.json().catch(() => ({}));
        const fullName =
            data.name ||
            [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
            null;
        return {
            name: fullName,
            avatarUrl: data.profile_pic || null,
        };
    } catch {
        return {};
    }
}

/**
 * Pull recent Messenger conversations & message history from Facebook Graph API.
 */
export async function fetchMessengerConversations({ pageId, accessToken, limit = 25 }) {
    if (!pageId || !accessToken) {
        return {
            ok: false,
            message: "আগে Facebook Page ID ও Page Access Token সেভ করুন।",
            conversations: [],
        };
    }

    const fields = encodeURIComponent(
        "id,updated_time,participants,messages.limit(15){id,message,from,created_time,attachments}"
    );
    const url = `${GRAPH_BASE}/${encodeURIComponent(
        pageId
    )}/conversations?platform=messenger&fields=${fields}&limit=${limit}`;

    try {
        const res = await fetchWithTimeout(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                ok: false,
                message: data?.error?.message || "Facebook Messenger চ্যাট লোড করা যায়নি",
                code: data?.error?.code,
                conversations: [],
            };
        }
        return {
            ok: true,
            conversations: Array.isArray(data.data) ? data.data : [],
        };
    } catch (error) {
        return {
            ok: false,
            message: error.message || "Graph API নেটওয়ার্ক সমস্যা",
            conversations: [],
        };
    }
}

/**
 * Diagnostic test for saved Facebook Page, Subscribed Apps, and WhatsApp Cloud API credentials.
 */
export async function checkMetaConnections() {
    const settings = await getSocialSettings();

    const result = {
        config: {
            hasAppSecret: Boolean(settings.metaAppSecret),
            hasVerifyToken: Boolean(settings.metaVerifyToken),
            verifyToken: settings.metaVerifyToken,
            hasFbPageId: Boolean(settings.fbPageId),
            hasFbToken: Boolean(settings.fbPageAccessToken),
            hasWaPhoneId: Boolean(settings.waPhoneNumberId),
            hasWaToken: Boolean(settings.waAccessToken),
        },
        facebook: {
            ok: false,
            message: "Facebook Page ID বা Token দেওয়া হয়নি",
            pageName: null,
            appSubscribed: false,
            subscribedFields: [],
        },
        whatsapp: {
            ok: false,
            message: "WhatsApp Phone Number ID বা Token দেওয়া হয়নি",
            displayPhoneNumber: null,
            verifiedName: null,
        },
    };

    if (settings.fbPageId && settings.fbPageAccessToken) {
        try {
            const pageRes = await fetchWithTimeout(
                `${GRAPH_BASE}/${encodeURIComponent(settings.fbPageId)}?fields=id,name`,
                { headers: { Authorization: `Bearer ${settings.fbPageAccessToken}` } },
                6000
            );
            const pageData = await pageRes.json().catch(() => ({}));
            if (pageRes.ok && pageData.id) {
                result.facebook.ok = true;
                result.facebook.pageName = pageData.name || settings.fbPageId;
                result.facebook.message = `Connected: ${pageData.name || pageData.id}`;

                // Check app webhook subscription on this Page
                const subRes = await fetchWithTimeout(
                    `${GRAPH_BASE}/${encodeURIComponent(settings.fbPageId)}/subscribed_apps`,
                    { headers: { Authorization: `Bearer ${settings.fbPageAccessToken}` } },
                    6000
                );
                const subData = await subRes.json().catch(() => ({}));
                if (subRes.ok && Array.isArray(subData.data) && subData.data.length > 0) {
                    result.facebook.appSubscribed = true;
                    result.facebook.subscribedFields = subData.data.flatMap(
                        (app) => app.subscribed_fields || []
                    );
                }
            } else {
                result.facebook.message = pageData?.error?.message || "Facebook Page Token ভেরিফাই হয়নি";
            }
        } catch (err) {
            result.facebook.message = err.message || "Facebook API সংযোগ ব্যর্থ";
        }
    }

    if (settings.waPhoneNumberId && settings.waAccessToken) {
        try {
            const waRes = await fetchWithTimeout(
                `${GRAPH_BASE}/${encodeURIComponent(
                    settings.waPhoneNumberId
                )}?fields=id,display_phone_number,verified_name,quality_rating`,
                { headers: { Authorization: `Bearer ${settings.waAccessToken}` } },
                6000
            );
            const waData = await waRes.json().catch(() => ({}));
            if (waRes.ok && waData.id) {
                result.whatsapp.ok = true;
                result.whatsapp.displayPhoneNumber = waData.display_phone_number || null;
                result.whatsapp.verifiedName = waData.verified_name || null;
                result.whatsapp.message = `Connected: ${waData.display_phone_number || waData.id}`;
            } else {
                result.whatsapp.message = waData?.error?.message || "WhatsApp Token ভেরিফাই হয়নি";
            }
        } catch (err) {
            result.whatsapp.message = err.message || "WhatsApp API সংযোগ ব্যর্থ";
        }
    }

    return result;
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
