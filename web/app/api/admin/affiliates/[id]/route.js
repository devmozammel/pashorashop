import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const paramsObj = await params;
        const { id } = paramsObj;
        const body = await req.json();
        const { status, markPaid } = body;

        if (status) {
            if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
                return NextResponse.json({ error: "Invalid status" }, { status: 400 });
            }

            const updated = await prisma.affiliateProfile.update({
                where: { id },
                data: {
                    status,
                    isActive: status === "APPROVED"
                }
            });
            return NextResponse.json({ success: true, profile: updated });
        }

        if (markPaid) {
            // Move pending earnings to total earnings, reset pending to 0
            const profile = await prisma.affiliateProfile.findUnique({ where: { id } });
            if (!profile || profile.pendingEarnings <= 0) {
                return NextResponse.json({ error: "No pending earnings to pay out" }, { status: 400 });
            }

            const updated = await prisma.$transaction(async (tx) => {
                await tx.affiliateTransaction.updateMany({
                    where: { affiliateId: id, status: "PENDING" },
                    data: { status: "PAID" }
                });

                return await tx.affiliateProfile.update({
                    where: { id },
                    data: {
                        pendingEarnings: 0,
                        totalEarnings: { increment: profile.pendingEarnings }
                    }
                });
            });

            return NextResponse.json({ success: true, profile: updated });
        }

        return NextResponse.json({ error: "No action specified" }, { status: 400 });

    } catch (error) {
        console.error("Admin Affiliate PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
