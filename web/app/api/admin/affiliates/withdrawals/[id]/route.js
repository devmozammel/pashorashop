import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH: Approve or Reject a withdrawal request
export async function PATCH(req, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, adminNote } = body; // action: "APPROVE" | "REJECT"

        if (!["APPROVE", "REJECT"].includes(action)) {
            return NextResponse.json({ error: "Invalid action. Use APPROVE or REJECT" }, { status: 400 });
        }

        const withdrawRequest = await prisma.withdrawRequest.findUnique({
            where: { id },
            include: { affiliate: true },
        });

        if (!withdrawRequest) {
            return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
        }

        if (withdrawRequest.status !== "PENDING") {
            return NextResponse.json({ error: "This request has already been processed" }, { status: 400 });
        }

        if (action === "APPROVE") {
            // Guard: ensure pendingEarnings won't go negative
            if (withdrawRequest.affiliate.pendingEarnings < withdrawRequest.amount) {
                return NextResponse.json({ error: "Affiliate does not have sufficient pending earnings" }, { status: 400 });
            }
            // Deduct from pendingEarnings, update request status
            await prisma.$transaction([
                prisma.affiliateProfile.update({
                    where: { id: withdrawRequest.affiliateId },
                    data: {
                        pendingEarnings: {
                            decrement: withdrawRequest.amount,
                        },
                    },
                }),
                prisma.withdrawRequest.update({
                    where: { id },
                    data: {
                        status: "APPROVED",
                        adminNote: adminNote || null,
                    },
                }),
            ]);
        } else {
            // Just reject
            await prisma.withdrawRequest.update({
                where: { id },
                data: {
                    status: "REJECTED",
                    adminNote: adminNote || null,
                },
            });
        }

        return NextResponse.json({ message: `Withdrawal ${action === "APPROVE" ? "approved" : "rejected"} successfully` }, { status: 200 });
    } catch (error) {
        console.error("[ADMIN_WITHDRAWAL_PATCH]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
