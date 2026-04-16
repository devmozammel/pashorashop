import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(request) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const returns = await prisma.returnRequest.findMany({
            include: {
                order: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(returns);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
