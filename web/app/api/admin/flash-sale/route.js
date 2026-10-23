import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { flashSaleSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const data = flashSaleSchema.parse(body);

        const startsAt = new Date(data.startsAt);
        const endsAt = new Date(data.endsAt);

        // Check for overlap
        if (data.isActive) {
            const overlapping = await prisma.flashSale.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { startsAt: { lte: endsAt }, endsAt: { gte: startsAt } },
                    ],
                },
            });

            if (overlapping) {
                return NextResponse.json(
                    { ok: false, message: "Another active flash sale overlaps with this time range" },
                    { status: 409 }
                );
            }
        }

        const flashSale = await prisma.flashSale.create({
            data: {
                title: data.title,
                startsAt: startsAt,
                endsAt: endsAt,
                isActive: data.isActive,
            },
        });

        return NextResponse.json({ ok: true, data: flashSale }, { status: 201 });
    } catch (error) {
        return apiError(error, "Create Flash Sale");
    }
}

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const flashSales = await prisma.flashSale.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { items: true },
                },
            },
        });

        return NextResponse.json({ ok: true, data: flashSales });
    } catch (error) {
        return apiError(error, "Get Flash Sales");
    }
}
