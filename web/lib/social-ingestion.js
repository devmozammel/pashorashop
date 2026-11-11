import { prisma } from "@/lib/prisma";
import { formatBangladeshiPhone } from "@/lib/steadfast";
import { generateGeminiCopilot } from "@/lib/gemini";
import { sendChannelReply } from "@/lib/meta-api";
import { getSocialSettings, getStoreBasicConfig } from "@/lib/social-settings";

/**
 * Fill template placeholders like {{product_name}}, {{price}}, {{delivery_fee}}, {{order_link}}.
 */
async function renderAutomationTemplate(template, product) {
    const store = await getStoreBasicConfig();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pashorashop.com";

    let productName = "আমাদের প্রোডাক্ট";
    let priceText = "";
    let orderLink = `${baseUrl}/shop`;

    if (product) {
        const effPrice = product.salePrice || product.discountPrice || product.price;
        productName = product.name;
        priceText = `${store.currencySymbol}${effPrice}`;
        orderLink = `${baseUrl}/product/${product.slug}`;
    }

    const deliveryFeeText = `ঢাকায় ${store.currencySymbol}${store.deliveryFeeInside}, ঢাকার বাইরে ${store.currencySymbol}${store.deliveryFeeOutside}`;

    return (template || "")
        .replace(/\{\{product_name\}\}/gi, productName)
        .replace(/\{\{price\}\}/gi, priceText)
        .replace(/\{\{delivery_fee\}\}/gi, deliveryFeeText)
        .replace(/\{\{order_link\}\}/gi, orderLink);
}

/**
 * Core ingestion pipeline for any inbound social message or comment (real webhook OR simulator).
 */
export async function ingestInboundSocialEvent({
    channel, // MESSENGER, FB_COMMENT, INSTAGRAM_DM, INSTAGRAM_COMMENT, WHATSAPP
    externalThreadId,
    externalUserId,
    externalMessageId,
    commentId,
    customerName,
    customerHandle,
    customerAvatar,
    phone,
    body,
    mediaUrl,
    postId,
    postTitle,
    postUrl,
    adPlatform,
    adId,
    adName,
    campaignName,
    adRef,
    metadata,
}) {
    if (!channel || !externalThreadId || !body) {
        throw new Error("Missing required channel, externalThreadId, or body");
    }

    // Idempotency check if externalMessageId is provided
    if (externalMessageId) {
        const existingMsg = await prisma.socialMessage.findUnique({
            where: { externalMessageId },
        });
        if (existingMsg) {
            return { ok: true, deduplicated: true, message: existingMsg };
        }
    }

    // Extract BD phone number from message body or WhatsApp number
    const bodyPhoneMatch = body.match(/(?:\+?88)?(01[3-9]\d{8})/);
    const detectedPhone = formatBangladeshiPhone(phone || (bodyPhoneMatch ? bodyPhoneMatch[0] : ""));
    const cleanPhone = detectedPhone && detectedPhone.length === 11 ? detectedPhone : null;

    const now = new Date();

    // Upsert Conversation
    const existingConv = await prisma.socialConversation.findUnique({
        where: {
            channel_externalThreadId: {
                channel,
                externalThreadId,
            },
        },
    });

    let conversation;
    if (existingConv) {
        conversation = await prisma.socialConversation.update({
            where: { id: existingConv.id },
            data: {
                customerName: customerName || existingConv.customerName,
                customerHandle: customerHandle || existingConv.customerHandle,
                customerAvatar: customerAvatar || existingConv.customerAvatar,
                phone: cleanPhone || existingConv.phone,
                postId: postId || existingConv.postId,
                postTitle: postTitle || existingConv.postTitle,
                postUrl: postUrl || existingConv.postUrl,
                adPlatform: adPlatform || existingConv.adPlatform,
                adId: adId || existingConv.adId,
                adName: adName || existingConv.adName,
                campaignName: campaignName || existingConv.campaignName,
                adRef: adRef || existingConv.adRef,
                status: existingConv.status === "RESOLVED" ? "OPEN" : existingConv.status,
                unreadCount: { increment: 1 },
                lastMessagePreview: body.slice(0, 200),
                lastMessageAt: now,
                lastCustomerMessageAt: now,
            },
        });
    } else {
        conversation = await prisma.socialConversation.create({
            data: {
                channel,
                externalThreadId,
                externalUserId: externalUserId || externalThreadId,
                customerName: customerName || "Social Customer",
                customerHandle: customerHandle || null,
                customerAvatar: customerAvatar || null,
                phone: cleanPhone,
                postId: postId || null,
                postTitle: postTitle || null,
                postUrl: postUrl || null,
                adPlatform: adPlatform || "ORGANIC",
                adId: adId || null,
                adName: adName || null,
                campaignName: campaignName || null,
                adRef: adRef || null,
                status: "OPEN",
                unreadCount: 1,
                lastMessagePreview: body.slice(0, 200),
                lastMessageAt: now,
                lastCustomerMessageAt: now,
            },
        });
    }

    // Save inbound message
    const inboundMessage = await prisma.socialMessage.create({
        data: {
            conversationId: conversation.id,
            externalMessageId: externalMessageId || null,
            direction: "INBOUND",
            messageType: channel.includes("COMMENT") ? "COMMENT" : mediaUrl ? "IMAGE" : "TEXT",
            senderType: "CUSTOMER",
            body,
            mediaUrl: mediaUrl || null,
            metadata: metadata || (commentId ? { commentId } : undefined),
        },
    });

    // ─── Comment-to-Inbox Automation ───
    let commentAutoTriggered = null;
    if (channel === "FB_COMMENT" || channel === "INSTAGRAM_COMMENT") {
        const rules = await prisma.commentAutomationRule.findMany({
            where: {
                isActive: true,
                channel: { in: ["ALL", channel] },
            },
            include: { product: true },
        });

        const lowerBody = body.toLowerCase();
        const matchedRule = rules.find((r) => {
            if (r.postId && postId && r.postId !== postId) return false;
            const kws = (r.keywords || "")
                .split(",")
                .map((k) => k.trim().toLowerCase())
                .filter(Boolean);
            return kws.some((kw) => lowerBody.includes(kw));
        });

        if (matchedRule) {
            const publicText = await renderAutomationTemplate(matchedRule.publicReplyTemplate, matchedRule.product);
            const dmText = await renderAutomationTemplate(matchedRule.dmTemplate, matchedRule.product);

            // 1) Public comment reply
            await sendChannelReply({
                channel,
                externalUserId: conversation.externalUserId,
                externalThreadId: conversation.externalThreadId,
                commentId,
                text: publicText,
                isPublicCommentReply: true,
            }).catch((e) => console.error("[CommentAuto] Public reply error:", e.message));

            // 2) Private Inbox DM with product details
            const dmResult = await sendChannelReply({
                channel,
                externalUserId: conversation.externalUserId,
                externalThreadId: conversation.externalThreadId,
                commentId,
                text: dmText,
                isPublicCommentReply: false,
            }).catch((e) => ({ ok: false, message: e.message }));

            // Log both in the unified inbox thread + create/update DM conversation so moderator sees the sent product details
            await prisma.socialMessage.create({
                data: {
                    conversationId: conversation.id,
                    direction: "OUTBOUND",
                    messageType: "AUTO_REPLY",
                    senderType: "AI_AUTO",
                    body: `[Comment Reply]: ${publicText}\n[Private Inbox Sent]: ${dmText}`,
                    isAutoReply: true,
                    metadata: { ruleId: matchedRule.id, ruleName: matchedRule.name, simulated: dmResult?.simulated ?? true },
                },
            });

            await prisma.commentAutomationRule.update({
                where: { id: matchedRule.id },
                data: { triggerCount: { increment: 1 } },
            });

            commentAutoTriggered = matchedRule.name;
        }
    }

    // ─── Gemini AI Co-pilot Draft + Optional Auto-Reply ───
    const settings = await getSocialSettings();
    let aiCopilot = null;

    if (settings.aiAutoDraftEnabled || settings.aiAutoReplyEnabled) {
        const recentMessages = await prisma.socialMessage.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "asc" },
            take: 20,
        });

        aiCopilot = await generateGeminiCopilot({
            conversation,
            messages: recentMessages,
        });

        const extractedPhone = aiCopilot?.extractedData?.phone;
        const updateData = {
            aiSuggestedReply: aiCopilot.suggestedReply || null,
            extractedData: aiCopilot.extractedData || undefined,
            ...(extractedPhone && !conversation.phone ? { phone: extractedPhone } : {}),
        };

        // If Auto-Reply is enabled AND it's a direct DM/WA message with a simple price/delivery FAQ (and comment rule didn't already reply)
        if (
            settings.aiAutoReplyEnabled &&
            !commentAutoTriggered &&
            !channel.includes("COMMENT") &&
            aiCopilot.isSimpleFaq &&
            aiCopilot.suggestedReply
        ) {
            const sendRes = await sendChannelReply({
                channel,
                externalUserId: conversation.externalUserId,
                externalThreadId: conversation.externalThreadId,
                text: aiCopilot.suggestedReply,
            });

            if (sendRes.ok) {
                await prisma.socialMessage.create({
                    data: {
                        conversationId: conversation.id,
                        externalMessageId: sendRes.externalMessageId || null,
                        direction: "OUTBOUND",
                        messageType: "AUTO_REPLY",
                        senderType: "AI_AUTO",
                        body: aiCopilot.suggestedReply,
                        isAutoReply: true,
                        metadata: { provider: aiCopilot.provider, simulated: sendRes.simulated },
                    },
                });
                updateData.lastMessagePreview = aiCopilot.suggestedReply.slice(0, 200);
                updateData.lastMessageAt = new Date();
                updateData.unreadCount = 0;
            }
        }

        conversation = await prisma.socialConversation.update({
            where: { id: conversation.id },
            data: updateData,
        });
    }

    return {
        ok: true,
        conversation,
        message: inboundMessage,
        commentAutoTriggered,
        aiCopilot,
    };
}
