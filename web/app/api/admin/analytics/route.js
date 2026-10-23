export const dynamic = "force-dynamic";


import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    // Add Admin Check here if needed (omitted for MVP speed)

    try {
        // 1. Sales by Day (Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
                status: { not: "CANCELLED" }
            },
            select: {
                createdAt: true,
                total: true
            }
        });

        // Agregate
        const salesMap = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            salesMap[date] = (salesMap[date] || 0) + Number(order.total);
        });

        const salesByDay = Object.keys(salesMap).map(date => ({
            date,
            sales: salesMap[date]
        })).sort((a, b) => a.date.localeCompare(b.date));

        // 2. Top Products
        const topProductsRaw = await prisma.orderItem.groupBy({
            by: ['productId', 'name'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        });

        const topProducts = topProductsRaw.map(item => ({
            name: item.name,
            quantity: item._sum.quantity
        }));

        return NextResponse.json({ salesByDay, topProducts });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
