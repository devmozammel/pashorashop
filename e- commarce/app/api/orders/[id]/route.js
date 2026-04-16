
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request, props) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    // Await params if necessary (Next.js 15+), but standard route handlers usually get params object.
    // Wait, in previous task I learned params are promises in latest Next.js?
    // Use await params if props.params. 
    // API routes: function GET(request, { params }) 
    // params is just an object in standard App Router unless specific version changes.
    // Actually, for safety with latest Next.js 15 changes, let's treat it carefully, 
    // but usually standard API routes receive params as second arg.
    // Safe approach: const { id } = await params;

    const id = params.id;

    if (!session) {
        // Allow if we implemented guest order tracking with token, but for now strict auth or admin.
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true, history: true }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Access control
        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = order.userId === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
