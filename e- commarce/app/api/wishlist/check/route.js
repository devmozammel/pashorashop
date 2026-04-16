
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        // Missing productId
        if (!productId) {
            return NextResponse.json({ exists: false, error: "Missing productId" });
        }

        // Guest user (not logged in)
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ exists: false, guest: true });
        }

        // Query DB safely
        const entry = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId
                }
            }
        });

        return NextResponse.json({ exists: !!entry });

    } catch (error) {
        // DB error, missing table, etc. — never crash, always return JSON
        console.error("Wishlist check error:", error?.message || error);
        return NextResponse.json({ exists: false });
    }
}
