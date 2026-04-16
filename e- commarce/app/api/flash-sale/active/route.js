import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";

export async function GET(req) {
    try {
        const now = new Date();

        const activeSale = await prisma.flashSale.findFirst({
            where: {
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gte: now },
            },
            include: {
                items: {
                    where: { isActive: true },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                price: true,
                                images: true,
                                stock: true
                            }
                        }
                    }
                },
            },
        });

        if (!activeSale) {
            return NextResponse.json({ ok: true, data: null });
        }

        // Format response
        const formattedData = {
            ...activeSale,
            items: activeSale.items.map(item => ({
                ...item.product,
                salePrice: item.salePrice,
                flashSaleItemId: item.id
            }))
        };

        return NextResponse.json({ ok: true, data: formattedData });
    } catch (error) {
        return apiError(error, "Get Active Flash Sale");
    }
}
