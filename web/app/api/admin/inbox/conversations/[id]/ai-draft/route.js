import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { generateGeminiCopilot } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req, props) {
    const params = await props.params;
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { id } = await params;

        const conversation = await prisma.socialConversation.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 25,
                },
            },
        });

        if (!conversation) {
            return NextResponse.json({ ok: false, message: "Conversation not found" }, { status: 404 });
        }

        const result = await generateGeminiCopilot({
            conversation,
            messages: conversation.messages,
        });

        const updated = await prisma.socialConversation.update({
            where: { id },
            data: {
                aiSuggestedReply: result.suggestedReply,
                extractedData: result.extractedData,
                ...(result.extractedData?.phone && !conversation.phone
                    ? { phone: result.extractedData.phone }
                    : {}),
            },
        });

        return NextResponse.json({
            ok: true,
            provider: result.provider,
            suggestedReply: result.suggestedReply,
            extractedData: result.extractedData,
            conversation: updated,
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
