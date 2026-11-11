import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getSocialSettings } from "@/lib/social-settings";
import { fetchFacebookUserProfile, fetchMessengerConversations, rememberEphemeralImage } from "@/lib/meta-api";
import { formatBangladeshiPhone } from "@/lib/steadfast";
import { INBOX_RETENTION_DAYS } from "@/lib/inbox-retention";

export const dynamic = "force-dynamic";

function extractMessageTextAndMedia(msg) {
    const firstAtt = msg?.attachments?.data?.[0];
    const mime = String(firstAtt?.mime_type || "").toLowerCase();
    const mediaUrl =
        firstAtt?.image_data?.url ||
        firstAtt?.file_url ||
        firstAtt?.video_data?.url ||
        null;
    const messageType = mime.startsWith("audio/")
        ? "AUDIO"
        : mime.startsWith("video/")
        ? "VIDEO"
        : mediaUrl
        ? "IMAGE"
        : "TEXT";
    const fallbackText =
        messageType === "AUDIO"
            ? "[Voice Message]"
            : messageType === "VIDEO"
            ? "[Video]"
            : mediaUrl
            ? "[Customer Image]"
            : "";
    const text = msg?.message?.trim() || fallbackText;
    return { text, mediaUrl, messageType };
}

export async function POST() {
    const session = await requireAdmin();
    if (!session) return unauthorizedResponse();

    try {
        const settings = await getSocialSettings();
        const fbRes = await fetchMessengerConversations({
            pageId: settings.fbPageId,
            accessToken: settings.fbPageAccessToken,
            limit: 25,
        });

        if (!fbRes.ok) {
            return NextResponse.json(
                { ok: false, message: fbRes.message, code: fbRes.code || null },
                { status: 400 }
            );
        }

        const retentionCutoff = new Date(Date.now() - INBOX_RETENTION_DAYS * 24 * 60 * 60 * 1000);
        let syncedConversations = 0;
        let importedMessages = 0;

        for (const thread of fbRes.conversations) {
            const threadUpdatedAt = thread.updated_time ? new Date(thread.updated_time) : new Date();
            if (threadUpdatedAt < retentionCutoff) continue;

            const participants = Array.isArray(thread?.participants?.data)
                ? thread.participants.data
                : [];
            const rawMessages = Array.isArray(thread?.messages?.data)
                ? thread.messages.data
                : [];

            // Sort oldest -> newest so timeline order stays accurate and keep only within retention window
            const sortedMessages = [...rawMessages]
                .filter((m) => !m.created_time || new Date(m.created_time) >= retentionCutoff)
                .sort((a, b) => new Date(a.created_time || 0) - new Date(b.created_time || 0));

            // Identify customer participant (anyone other than the FB Page)
            let customerParticipant = participants.find(
                (p) => p?.id && (!settings.fbPageId || p.id !== settings.fbPageId)
            );
            if (!customerParticipant) {
                const inboundMsg = sortedMessages.find(
                    (m) => m?.from?.id && (!settings.fbPageId || m.from.id !== settings.fbPageId)
                );
                customerParticipant = inboundMsg?.from || null;
            }

            const customerId = customerParticipant?.id;
            if (!customerId) continue;

            // Fetch real profile name/avatar if participant name is missing or generic
            const profile = await fetchFacebookUserProfile(customerId, settings.fbPageAccessToken);
            const customerName =
                profile?.name ||
                customerParticipant?.name ||
                `FB User ${customerId.slice(-4)}`;
            const customerAvatar = profile?.avatarUrl || null;

            // Detect phone number & latest timestamps from synced messages
            let detectedPhone = null;
            let lastCustomerMessageAt = null;
            let lastMessageAt = threadUpdatedAt;
            let lastMessagePreview = "";

            const parsedMessages = [];
            for (const m of sortedMessages) {
                const { text, mediaUrl, messageType } = extractMessageTextAndMedia(m);
                if (!text && !mediaUrl) continue;

                const isPage = Boolean(settings.fbPageId && m.from?.id === settings.fbPageId);
                const msgDate = m.created_time ? new Date(m.created_time) : new Date();

                if (!isPage) {
                    lastCustomerMessageAt = msgDate;
                    const phoneMatch = text.match(/(?:\+?88)?(01[3-9]\d{8})/);
                    if (phoneMatch) {
                        const formatted = formatBangladeshiPhone(phoneMatch[0]);
                        if (formatted && formatted.length === 11) {
                            detectedPhone = formatted;
                        }
                    }
                }

                lastMessageAt = msgDate;
                lastMessagePreview = (text || "[attachment]").slice(0, 120);

                if (messageType === "IMAGE" && mediaUrl && m.id) {
                    rememberEphemeralImage(m.id, mediaUrl);
                }

                parsedMessages.push({
                    externalMessageId: m.id,
                    direction: isPage ? "OUTBOUND" : "INBOUND",
                    senderType: isPage ? "MODERATOR" : "CUSTOMER",
                    messageType,
                    body: text || "[attachment]",
                    mediaUrl: messageType === "IMAGE" ? null : mediaUrl,
                    createdAt: msgDate,
                });
            }

            const existingConv = await prisma.socialConversation.findUnique({
                where: {
                    channel_externalThreadId: {
                        channel: "MESSENGER",
                        externalThreadId: customerId,
                    },
                },
            });

            let conversation;
            if (existingConv) {
                const shouldAdvanceTimestamp =
                    !existingConv.lastMessageAt || lastMessageAt > existingConv.lastMessageAt;
                conversation = await prisma.socialConversation.update({
                    where: { id: existingConv.id },
                    data: {
                        customerName:
                            profile?.name ||
                            (existingConv.customerName?.startsWith("FB User ")
                                ? customerName
                                : existingConv.customerName),
                        customerAvatar: customerAvatar || existingConv.customerAvatar,
                        phone: existingConv.phone || detectedPhone,
                        lastMessagePreview: shouldAdvanceTimestamp
                            ? lastMessagePreview || existingConv.lastMessagePreview
                            : existingConv.lastMessagePreview,
                        lastMessageAt: shouldAdvanceTimestamp
                            ? lastMessageAt
                            : existingConv.lastMessageAt,
                        lastCustomerMessageAt:
                            lastCustomerMessageAt &&
                            (!existingConv.lastCustomerMessageAt ||
                                lastCustomerMessageAt > existingConv.lastCustomerMessageAt)
                                ? lastCustomerMessageAt
                                : existingConv.lastCustomerMessageAt,
                    },
                });
            } else {
                conversation = await prisma.socialConversation.create({
                    data: {
                        channel: "MESSENGER",
                        externalThreadId: customerId,
                        externalUserId: customerId,
                        customerName,
                        customerAvatar,
                        phone: detectedPhone,
                        adPlatform: "ORGANIC",
                        status: "OPEN",
                        unreadCount: parsedMessages.some((m) => m.direction === "INBOUND") ? 1 : 0,
                        lastMessagePreview: lastMessagePreview || "Messenger conversation synced",
                        lastMessageAt,
                        lastCustomerMessageAt: lastCustomerMessageAt || lastMessageAt,
                    },
                });
            }

            syncedConversations++;

            if (parsedMessages.length > 0) {
                const candidateIds = parsedMessages.map((m) => m.externalMessageId).filter(Boolean);
                const existingMsgs = candidateIds.length
                    ? await prisma.socialMessage.findMany({
                          where: { externalMessageId: { in: candidateIds } },
                          select: { externalMessageId: true },
                      })
                    : [];
                const existingSet = new Set(existingMsgs.map((e) => e.externalMessageId));

                for (const m of parsedMessages) {
                    if (m.externalMessageId && existingSet.has(m.externalMessageId)) continue;
                    await prisma.socialMessage.create({
                        data: {
                            conversationId: conversation.id,
                            externalMessageId: m.externalMessageId || null,
                            direction: m.direction,
                            messageType: m.messageType,
                            senderType: m.senderType,
                            body: m.body,
                            mediaUrl: m.mediaUrl,
                            createdAt: m.createdAt,
                        },
                    });
                    importedMessages++;
                }
            }
        }

        return NextResponse.json({
            ok: true,
            syncedConversations,
            importedMessages,
        });
    } catch (error) {
        console.error("[Sync Messenger Error]:", error);
        return NextResponse.json(
            { ok: false, message: error.message || "Messenger সিঙ্ক ব্যর্থ হয়েছে" },
            { status: 500 }
        );
    }
}
