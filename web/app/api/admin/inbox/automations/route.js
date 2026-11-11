import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff, requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { getSocialSettings, saveSocialSettings } from "@/lib/social-settings";

export const dynamic = "force-dynamic";

const channelEnum = z.enum(["ALL", "FB_COMMENT", "IG_COMMENT"]);

const aiToggleSchema = z.object({
    type: z.literal("AI_TOGGLE"),
    aiAutoDraftEnabled: z.boolean().optional(),
    aiAutoReplyEnabled: z.boolean().optional(),
});

const createRuleSchema = z.object({
    name: z.string().trim().min(1, "Rule name is required").max(120),
    channel: channelEnum.default("ALL"),
    postId: z.string().trim().max(120).optional().nullable(),
    keywords: z.string().trim().min(1, "Keywords are required").max(500),
    publicReplyTemplate: z.string().trim().min(1, "Public reply template is required").max(1000),
    dmTemplate: z.string().trim().min(1, "DM template is required").max(2000),
    productId: z.string().trim().max(64).optional().nullable(),
});

const patchRuleSchema = z.object({
    id: z.string().trim().min(1, "Rule ID required").max(64),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1).max(120).optional(),
    channel: channelEnum.optional(),
    postId: z.string().trim().max(120).optional().nullable(),
    keywords: z.string().trim().min(1).max(500).optional(),
    publicReplyTemplate: z.string().trim().min(1).max(1000).optional(),
    dmTemplate: z.string().trim().min(1).max(2000).optional(),
    productId: z.string().trim().max(64).optional().nullable(),
});

export async function GET() {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const [rules, settings, products] = await Promise.all([
            prisma.commentAutomationRule.findMany({
                orderBy: { createdAt: "desc" },
                include: {
                    product: {
                        select: { id: true, name: true, slug: true, price: true, salePrice: true },
                    },
                },
            }),
            getSocialSettings(),
            prisma.product.findMany({
                where: { isActive: true },
                select: { id: true, name: true, price: true, salePrice: true },
                orderBy: { name: "asc" },
                take: 100,
            }),
        ]);

        return NextResponse.json({
            ok: true,
            data: {
                rules,
                products,
                aiSettings: {
                    aiAutoDraftEnabled: settings.aiAutoDraftEnabled,
                    aiAutoReplyEnabled: settings.aiAutoReplyEnabled,
                    hasGeminiKey: Boolean(settings.geminiApiKey),
                },
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to load automations" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const body = await req.json();

        // Update AI toggle settings if requested (ADMIN only)
        if (body?.type === "AI_TOGGLE") {
            const admin = await requireAdmin();
            if (!admin) return unauthorizedResponse();

            const parsedToggle = aiToggleSchema.safeParse(body);
            if (!parsedToggle.success) {
                return NextResponse.json(
                    { ok: false, message: parsedToggle.error.issues?.[0]?.message || "Invalid AI toggle payload" },
                    { status: 400 }
                );
            }

            const updated = await saveSocialSettings({
                ...(parsedToggle.data.aiAutoDraftEnabled !== undefined && {
                    aiAutoDraftEnabled: parsedToggle.data.aiAutoDraftEnabled,
                }),
                ...(parsedToggle.data.aiAutoReplyEnabled !== undefined && {
                    aiAutoReplyEnabled: parsedToggle.data.aiAutoReplyEnabled,
                }),
            });
            return NextResponse.json({
                ok: true,
                data: {
                    aiAutoDraftEnabled: updated.aiAutoDraftEnabled,
                    aiAutoReplyEnabled: updated.aiAutoReplyEnabled,
                },
            });
        }

        const parsed = createRuleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { ok: false, message: parsed.error.issues?.[0]?.message || "Invalid automation rule payload" },
                { status: 400 }
            );
        }

        const { name, channel, postId, keywords, publicReplyTemplate, dmTemplate, productId } = parsed.data;

        const rule = await prisma.commentAutomationRule.create({
            data: {
                name,
                channel,
                postId: postId || null,
                keywords,
                publicReplyTemplate,
                dmTemplate,
                productId: productId || null,
                isActive: true,
            },
            include: {
                product: { select: { id: true, name: true, slug: true, price: true, salePrice: true } },
            },
        });

        return NextResponse.json({ ok: true, data: rule });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to save automation" }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const body = await req.json();
        const parsed = patchRuleSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { ok: false, message: parsed.error.issues?.[0]?.message || "Invalid update payload" },
                { status: 400 }
            );
        }

        const { id, isActive, name, channel, postId, keywords, publicReplyTemplate, dmTemplate, productId } = parsed.data;
        const existing = await prisma.commentAutomationRule.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            return NextResponse.json({ ok: false, message: "Automation rule not found" }, { status: 404 });
        }

        const updated = await prisma.commentAutomationRule.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(name !== undefined && { name }),
                ...(channel !== undefined && { channel }),
                ...(postId !== undefined && { postId: postId || null }),
                ...(keywords !== undefined && { keywords }),
                ...(publicReplyTemplate !== undefined && { publicReplyTemplate }),
                ...(dmTemplate !== undefined && { dmTemplate }),
                ...(productId !== undefined && { productId: productId || null }),
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to update automation" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id")?.trim();
        if (!id) return NextResponse.json({ ok: false, message: "Rule ID required" }, { status: 400 });

        const existing = await prisma.commentAutomationRule.findUnique({ where: { id }, select: { id: true } });
        if (!existing) {
            return NextResponse.json({ ok: false, message: "Automation rule not found" }, { status: 404 });
        }

        await prisma.commentAutomationRule.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message || "Failed to delete automation" }, { status: 500 });
    }
}

