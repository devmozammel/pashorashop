import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import { serializePrisma } from "@/lib/serialize";


export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        // 1. Total Orders
        const totalOrders = await prisma.order.count();

        // 2. Total Revenue (Only count DELIVERED orders)
        const revenueAgg = await prisma.order.aggregate({
            where: {
                status: 'DELIVERED'
            },
            _sum: {
                total: true
            }
        });
        const totalRevenue = revenueAgg._sum.total || 0;

        // 3. Active Products count
        const activeProducts = await prisma.product.count({
            where: { isActive: true }
        });

        // 4. Total Users Count
        const totalUsers = await prisma.user.count();

        // 5. Low Stock Products
        const lowStockProductsRaw = await prisma.product.findMany({
            where: { stock: { lt: 10 }, isActive: true },
            take: 5,
            orderBy: { stock: 'asc' }
        });

        // 6. Recent Orders
        const recentOrdersRaw = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                orderNumber: true,
                customerName: true,
                total: true,
                status: true,
                createdAt: true
            }
        });

        const data = {
            stats: {
                revenue: totalRevenue,
                orders: totalOrders,
                products: activeProducts,
                users: totalUsers
            },
            lowStockProducts: serializePrisma(lowStockProductsRaw),
            recentOrders: serializePrisma(recentOrdersRaw)
        };

        return NextResponse.json({ ok: true, data });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
