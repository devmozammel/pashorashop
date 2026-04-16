import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { flashSaleSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const flashSale = await prisma.flashSale.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true,
                                stock: true,
                                variants: true // Include variants if needed for UI
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!flashSale) {
            return NextResponse.json({ ok: false, message: "Flash Sale not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, data: flashSale });
    } catch (error) {
        return apiError(error, "Get Flash Sale Details");
    }
}

export async function PATCH(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        const body = await req.json();
        const data = flashSaleSchema.partial().parse(body);

        // Validate overlap if changing dates/active
        if (data.isActive !== undefined || data.startsAt || data.endsAt) {
            const current = await prisma.flashSale.findUnique({ where: { id } });

            // Determine new state
            const willBeActive = data.isActive ?? current.isActive;
            const start = data.startsAt ? new Date(data.startsAt) : current.startsAt;
            const end = data.endsAt ? new Date(data.endsAt) : current.endsAt;

            if (willBeActive) {
                const overlapping = await prisma.flashSale.findFirst({
                    where: {
                        id: { not: id },
                        isActive: true, // Only checking against other ACTIVE sales
                        OR: [
                            { startsAt: { lte: end }, endsAt: { gte: start } },
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
        }

        const flashSale = await prisma.flashSale.update({
            where: { id },
            data: {
                ...data,
                startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
                endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
            },
        });

        return NextResponse.json({ ok: true, data: flashSale });
    } catch (error) {
        return apiError(error, "Update Flash Sale");
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { id } = await params;
        await prisma.flashSale.delete({ where: { id } });

        return NextResponse.json({ ok: true, message: "Flash Sale deleted" });
    } catch (error) {
        return apiError(error, "Delete Flash Sale");
    }
}
