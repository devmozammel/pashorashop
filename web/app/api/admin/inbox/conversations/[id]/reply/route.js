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
        const isPublicCommentReply = Boolean(body.isPublicCommentReply);

        if (!text) {
            return NextResponse.json({ ok: false, message: "Reply message cannot be empty" }, { status: 400 });
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

        const [message, updatedConversation] = await prisma.$transaction([
            prisma.socialMessage.create({
                data: {
                    conversationId: id,
                    externalMessageId: sendRes.externalMessageId || null,
                    direction: "OUTBOUND",
                    messageType: isPublicCommentReply ? "COMMENT" : "TEXT",
                    senderType: "MODERATOR",
                    senderId: dbUserId,
                    body: text,
                    metadata: {
                        simulated: sendRes.simulated,
                        isPublicCommentReply,
                        staffName: staff.user?.name || staff.user?.email,
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
                    lastMessagePreview: text.slice(0, 200),
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
