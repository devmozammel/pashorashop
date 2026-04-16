import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: { product: { select: { slug: true, images: true } } }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(orders);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
