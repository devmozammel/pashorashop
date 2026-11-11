import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, resolveStaffDbUserId, unauthorizedResponse } from "@/lib/require-admin";
import { sendChannelReply } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function POST(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const text = (body.text || "").trim();
        const mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : null;
        const rawMediaType = String(body.mediaType || "").toUpperCase();
        const mediaType = mediaUrl
            ? ["AUDIO", "IMAGE", "VIDEO"].includes(rawMediaType)
                ? rawMediaType
                : "IMAGE"
            : "TEXT";
        const mediaMeta = body.mediaMeta && typeof body.mediaMeta === "object" ? body.mediaMeta : {};
        const isPublicCommentReply = Boolean(body.isPublicCommentReply);

        if (!text && !mediaUrl) {
            return NextResponse.json({ ok: false, message: "মেসেজ বা মিডিয়া খালি হতে পারবে না" }, { status: 400 });
        }

        const conversation = await prisma.socialConversation.findUnique({
            where: { id },
            include: {
                messages: {
                    where: { direction: "INBOUND" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!conversation) {
            return NextResponse.json({ ok: false, message: "Conversation not found" }, { status: 404 });
        }

        const latestInbound = conversation.messages[0];
        const commentId = latestInbound?.metadata?.commentId || null;

        const sendRes = await sendChannelReply({
            channel: conversation.channel,
            externalUserId: conversation.externalUserId,
            externalThreadId: conversation.externalThreadId,
            commentId,
            text,
            mediaUrl,
            mediaType,
            isPublicCommentReply,
        });

        if (!sendRes.ok) {
            return NextResponse.json({ ok: false, message: sendRes.message || "Failed to send message" }, { status: 502 });
        }

        const dbUserId = await resolveStaffDbUserId(staff);
        const now = new Date();

        // Compute first-response SLA if this is the first moderator reply
        let firstResponseUpdate = {};
        if (!conversation.firstResponseAt && conversation.lastCustomerMessageAt) {
            const diffSec = Math.max(
                1,
                Math.round((now.getTime() - new Date(conversation.lastCustomerMessageAt).getTime()) / 1000)
            );
            firstResponseUpdate = {
                firstResponseAt: now,
                firstResponseSeconds: diffSec,
            };
        }

        const fallbackLabel =
            mediaType === "AUDIO" ? "[Voice Message]" : mediaType === "VIDEO" ? "[Video]" : "[Image]";
        const bodyToStore = text || fallbackLabel;
        const messageTypeToStore = isPublicCommentReply ? "COMMENT" : mediaType;

        const [message, updatedConversation] = await prisma.$transaction([
            prisma.socialMessage.create({
                data: {
                    conversationId: id,
                    externalMessageId: sendRes.externalMessageId || null,
                    direction: "OUTBOUND",
                    messageType: messageTypeToStore,
                    senderType: "MODERATOR",
                    senderId: dbUserId,
                    body: bodyToStore,
                    mediaUrl,
                    metadata: {
                        simulated: sendRes.simulated,
                        isPublicCommentReply,
                        staffName: staff.user?.name || staff.user?.email,
                        ...(mediaMeta.publicId ? { cloudinaryPublicId: mediaMeta.publicId } : {}),
                        ...(mediaMeta.resourceType ? { cloudinaryResourceType: mediaMeta.resourceType } : {}),
                    },
                },
                include: {
                    sender: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
            prisma.socialConversation.update({
                where: { id },
                data: {
                    unreadCount: 0,
                    lastMessagePreview: bodyToStore.slice(0, 200),
                    lastMessageAt: now,
                    aiSuggestedReply: null,
                    ...(dbUserId && !conversation.assignedToId ? { assignedToId: dbUserId, assignedAt: now } : {}),
                    ...firstResponseUpdate,
                },
                include: {
                    assignedTo: { select: { id: true, name: true, email: true, role: true } },
                },
            }),
        ]);

        return NextResponse.json({
            ok: true,
            simulated: sendRes.simulated,
            data: {
                message,
                conversation: updatedConversation,
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
