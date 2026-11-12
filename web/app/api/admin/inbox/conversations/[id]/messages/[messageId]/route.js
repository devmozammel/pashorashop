import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { updateFacebookComment, deleteFacebookComment } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

function isLivePublicFbComment(conversation, message) {
    return (
        conversation?.channel === "FB_COMMENT" &&
        message?.direction === "OUTBOUND" &&
        Boolean(message?.metadata?.isPublicCommentReply) &&
        Boolean(message?.externalMessageId)
    );
}

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id, messageId } = await params;
        const bodyJson = await req.json().catch(() => ({}));
        const nextBody = String(bodyJson.body || "").trim();

        if (!nextBody) {
            return NextResponse.json(
                { ok: false, message: "মেসেজ খালি রাখা যাবে না" },
                { status: 400 }
            );
        }

        const existing = await prisma.socialMessage.findFirst({
            where: { id: messageId, conversationId: id },
            include: {
                conversation: {
                    select: {
                        id: true,
                        channel: true,
                        lastMessageAt: true,
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { ok: false, message: "মেসেজ পাওয়া যায়নি" },
                { status: 404 }
            );
        }

        let remoteUpdated = false;
        let remoteNote =
            "শুধু ড্যাশবোর্ডে এডিট হয়েছে (Meta API Messenger/WhatsApp মেসেজ এডিট সাপোর্ট করে না)";

        if (isLivePublicFbComment(existing.conversation, existing)) {
            const fbRes = await updateFacebookComment({
                commentId: existing.externalMessageId,
                message: nextBody,
            });
            if (!fbRes.ok) {
                return NextResponse.json(
                    { ok: false, message: fbRes.message || "Facebook কমেন্ট এডিট করা যায়নি" },
                    { status: 502 }
                );
            }
            remoteUpdated = !fbRes.simulated;
            remoteNote = remoteUpdated
                ? "ড্যাশবোর্ড এবং Facebook পোস্টের কমেন্টেও এডিট হয়েছে!"
                : "ড্যাশবোর্ডে এডিট হয়েছে (Demo Mode)";
        }

        const prevMeta =
            existing.metadata && typeof existing.metadata === "object"
                ? existing.metadata
                : {};

        const updatedMessage = await prisma.socialMessage.update({
            where: { id: messageId },
            data: {
                body: nextBody,
                metadata: {
                    ...prevMeta,
                    originalBody: prevMeta.originalBody || existing.body,
                    editedAt: new Date().toISOString(),
                    editedBy: staff.user?.name || staff.user?.email || "Staff",
                },
            },
            include: {
                sender: { select: { id: true, name: true, email: true, role: true } },
            },
        });

        // Update conversation preview if this is the latest message
        const latestMsg = await prisma.socialMessage.findFirst({
            where: { conversationId: id },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });
        if (latestMsg?.id === messageId) {
            await prisma.socialConversation.update({
                where: { id },
                data: { lastMessagePreview: nextBody.slice(0, 200) },
            });
        }

        return NextResponse.json({
            ok: true,
            remoteUpdated,
            remoteNote,
            data: { message: updatedMessage },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id, messageId } = await params;

        const existing = await prisma.socialMessage.findFirst({
            where: { id: messageId, conversationId: id },
            include: {
                conversation: {
                    select: {
                        id: true,
                        channel: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!existing) {
            return NextResponse.json(
                { ok: false, message: "মেসেজ পাওয়া যায়নি" },
                { status: 404 }
            );
        }

        let remoteDeleted = false;
        let remoteNote =
            "শুধু ড্যাশবোর্ড থেকে ডিলিট হয়েছে (Meta API Messenger/WhatsApp মেসেজ আনসেন্ড সাপোর্ট করে না)";

        if (isLivePublicFbComment(existing.conversation, existing)) {
            const fbRes = await deleteFacebookComment({
                commentId: existing.externalMessageId,
            });
            if (!fbRes.ok) {
                return NextResponse.json(
                    { ok: false, message: fbRes.message || "Facebook কমেন্ট ডিলিট করা যায়নি" },
                    { status: 502 }
                );
            }
            remoteDeleted = !fbRes.simulated;
            remoteNote = remoteDeleted
                ? "ড্যাশবোর্ড এবং Facebook পোস্ট থেকেও কমেন্ট ডিলিট হয়েছে!"
                : "ড্যাশবোর্ড থেকে ডিলিট হয়েছে (Demo Mode)";
        }

        await prisma.socialMessage.delete({
            where: { id: messageId },
        });

        const newLatest = await prisma.socialMessage.findFirst({
            where: { conversationId: id },
            orderBy: { createdAt: "desc" },
            select: { body: true, createdAt: true },
        });

        await prisma.socialConversation.update({
            where: { id },
            data: {
                lastMessagePreview: newLatest?.body ? newLatest.body.slice(0, 200) : null,
                lastMessageAt: newLatest?.createdAt || existing.conversation.createdAt,
            },
        });

        return NextResponse.json({
            ok: true,
            remoteDeleted,
            remoteNote,
            data: { deletedId: messageId },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
