import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";


export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const profiles = await prisma.costProfile.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ ok: true, data: profiles });
    } catch (e) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const body = await req.json();
        
        const profile = await prisma.costProfile.create({
            data: {
                name: body.name,
                totalBuyingCost: Number(body.totalBuyingCost),
                quantity: Number(body.quantity),
                shippingCost: Number(body.shippingCost || 0),
                adSpend: Number(body.adSpend || 0),
                packagingCost: Number(body.packagingCost || 0),
                otherCosts: Number(body.otherCosts || 0),
                targetMargin: Number(body.targetMargin || 0),
                suggestedPrice: Number(body.suggestedPrice || 0),
                costPerItem: Number(body.costPerItem || 0),
            }
        });

        return NextResponse.json({ ok: true, data: profile });
    } catch (e) {
        return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
    }
}
