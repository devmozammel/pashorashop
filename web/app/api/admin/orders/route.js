import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/error-handler";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";

export async function GET(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const where = {};
        if (status === "ABNORMAL") {
            where.isAbnormal = true;
        } else {
            where.isAbnormal = false;
            if (status && status !== "ALL") {
                where.status = status;
            }
        }

        if (search) {
            where.OR = [
                { orderNumber: { contains: search } }, // Case insensitive usually depends on DB collation
                { customerName: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit,
                skip,
                select: {
                    id: true,
                    orderNumber: true,
                    customerName: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    paymentStatus: true,
                    paymentMethod: true,
                    _count: {
                        select: { items: true }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        return NextResponse.json({
            ok: true,
            data: orders,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        return apiError(error, "Get Orders");
    }
}
