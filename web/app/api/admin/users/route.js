import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const users = await prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                createdAt: true,
                _count: {
                    select: { orders: true }
                }
            }
        });

        const formattedUsers = users.map(user => ({
            ...user,
            status: 'ACTIVE', // Default since schema has no block field
            totalOrders: user._count.orders
        }));

        return NextResponse.json({ ok: true, data: formattedUsers });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
