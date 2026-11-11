import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, resolveStaffDbUserId, unauthorizedResponse } from "@/lib/require-admin";
import { sendChannelReply, sendDirectImageReply } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;
        const contentType = req.headers.get("content-type") || "";

        let text = "";
        let mediaUrl = null;
        let mediaType = "TEXT";
        let mediaMeta = {};
        let isPublicCommentReply = false;
        let directImageFile = null;

        if (contentType.includes("multipart/form-data")) {
            const form = await req.formData();
            text = String(form.get("text") || "").trim();
            isPublicCommentReply = form.get("isPublicCommentReply") === "true";
            const file = form.get("file");
            if (file && typeof file === "object" && file.size > 0) {
                if (!String(file.type || "").startsWith("image/")) {
                    return NextResponse.json({ ok: false, message: "শুধুমাত্র ছবি আপলোড করা যাবে" }, { status: 400 });
                }
                if (file.size > MAX_IMAGE_BYTES) {
                    return NextResponse.json({ ok: false, message: "ছবির সাইজ ৫ এমবি-এর বেশি হতে পারবে না" }, { status: 400 });
                }
                directImageFile = file;
                mediaType = "IMAGE";
            }
        } else {
            const body = await req.json();
            text = (body.text || "").trim();
            mediaUrl = body.mediaUrl ? String(body.mediaUrl).trim() : null;
            const rawMediaType = String(body.mediaType || "").toUpperCase();
            mediaType = mediaUrl
                ? ["AUDIO", "IMAGE", "VIDEO"].includes(rawMediaType)
                    ? rawMediaType
                    : "IMAGE"
                : "TEXT";
            mediaMeta = body.mediaMeta && typeof body.mediaMeta === "object" ? body.mediaMeta : {};
            isPublicCommentReply = Boolean(body.isPublicCommentReply);
        }

        if (!text && !mediaUrl && !directImageFile) {
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

        const sendRes = directImageFile
            ? await sendDirectImageReply({
                  channel: conversation.channel,
                  externalUserId: conversation.externalUserId,
                  externalThreadId: conversation.externalThreadId,
                  commentId,
                  text,
                  file: directImageFile,
                  isPublicCommentReply,
              })
            : await sendChannelReply({
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
            mediaType === "AUDIO"
                ? "[Voice Message]"
                : mediaType === "VIDEO"
                ? "[Video]"
                : "[ছবি পাঠানো হয়েছে]";
        const bodyToStore = text || fallbackLabel;
        const messageTypeToStore = isPublicCommentReply ? "COMMENT" : mediaType;
        // Never store IMAGE URLs in database — images are transmitted ephemerally
        const persistedMediaUrl = mediaType === "IMAGE" ? null : mediaUrl;

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
                    mediaUrl: persistedMediaUrl,
                    metadata: {
                        simulated: sendRes.simulated,
                        isPublicCommentReply,
                        staffName: staff.user?.name || staff.user?.email,
                        ...(sendRes.waMediaId ? { waMediaId: sendRes.waMediaId } : {}),
                        ...(mediaType !== "IMAGE" && mediaMeta.publicId ? { cloudinaryPublicId: mediaMeta.publicId } : {}),
                        ...(mediaType !== "IMAGE" && mediaMeta.resourceType
                            ? { cloudinaryResourceType: mediaMeta.resourceType }
                            : {}),
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
