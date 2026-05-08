import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { homepageConfigSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const config = await prisma.homepageConfig.findFirst();
        return NextResponse.json({ ok: true, data: config });
    } catch (error) {
        return apiError(error, "Get Homepage Config");
    }
}

export async function PUT(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const data = homepageConfigSchema.parse(body);

        const existing = await prisma.homepageConfig.findFirst();

        let config;
        if (existing) {
            config = await prisma.homepageConfig.update({
                where: { id: existing.id },
                data
            });
        } else {
            config = await prisma.homepageConfig.create({
                data
            });
        }
        const { revalidatePath } = await import("next/cache");
        revalidatePath("/");

        return NextResponse.json({ ok: true, data: config });
    } catch (error) {
        return apiError(error, "Update Homepage Config");
    }
}
