import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

// GET: Fetch affiliate stats for the current user
export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId: session.user.id },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        order: {
                            select: { orderNumber: true, status: true }
                        }
                    }
                },
                withdrawRequests: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                }
            }
        });

        if (!profile) {
            return NextResponse.json({ enrolled: false }, { status: 200 });
        }

        return NextResponse.json({ enrolled: true, profile }, { status: 200 });
    } catch (error) {
        console.error("[AFFILIATE_GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Enroll the current user as an affiliate
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existingProfile = await prisma.affiliateProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (existingProfile) {
            return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
        }

        // Generate a unique 8-character code
        let newCode;
        let isUnique = false;
        while (!isUnique) {
            newCode = nanoid(8).toUpperCase();
            const exists = await prisma.affiliateProfile.findUnique({ where: { code: newCode } });
            if (!exists) isUnique = true;
        }

        const profile = await prisma.affiliateProfile.create({
            data: {
                userId: session.user.id,
                code: newCode
                // status defaults to PENDING
            }
        });

        return NextResponse.json({ message: "Request submitted for approval", profile }, { status: 201 });
    } catch (error) {
        console.error("[AFFILIATE_POST]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
