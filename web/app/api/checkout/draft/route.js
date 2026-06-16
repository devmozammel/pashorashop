import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
    try {
        const body = await req.json();
        const { id, name, phone, address, city, items, total } = body;

        if (!id || !name || !phone) {
            return NextResponse.json({ error: "Missing required fields (id, name, phone)" }, { status: 400 });
        }

        const draft = await prisma.abandonedCheckout.upsert({
            where: { id },
            update: {
                name,
                phone,
                address: address || null,
                city: city || null,
                items: items || [],
                total: Number(total || 0),
                updatedAt: new Date()
            },
            create: {
                id,
                name,
                phone,
                address: address || null,
                city: city || null,
                items: items || [],
                total: Number(total || 0)
            }
        });

        return NextResponse.json({ ok: true, data: draft });
    } catch (error) {
        console.error("Draft checkout error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
