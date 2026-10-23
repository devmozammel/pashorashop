import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { pricingSchema } from "@/lib/zod-schemas";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        // Join product variants if needed, or just product
        // "List products for pricing"
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                price: true,
                salePrice: true,
                stock: true,
                category: {
                    select: { name: true }
                },
                images: true
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ ok: true, data: products });
    } catch (error) {
        return apiError(error, "Get Pricing Products");
    }
}

export async function PATCH(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        const { updates } = pricingSchema.parse(body);

        // Use transaction for bulk update
        await prisma.$transaction(
            updates.map(update =>
                prisma.product.update({
                    where: { id: update.id },
                    data: {
                        price: update.price,
                        salePrice: update.salePrice
                    }
                })
            )
        );

        return NextResponse.json({ ok: true, message: "Prices updated successfully" });
    } catch (error) {
        return apiError(error, "Bulk Update Pricing");
    }
}
