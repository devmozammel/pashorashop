import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";

export async function GET(req) {
    try {
        const config = await prisma.homepageConfig.findFirst();
        return NextResponse.json({ ok: true, data: config });
    } catch (error) {
        return apiError(error, "Get Public Homepage Config");
    }
}
