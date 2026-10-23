import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const transactions = await prisma.affiliateTransaction.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                affiliate: {
                    include: {
                        user: { select: { name: true, email: true } }
                    }
                },
                order: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        slug: true,
                                        productImages: {
                                            orderBy: { sortOrder: 'asc' },
                                            take: 1
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(transactions, { status: 200 });
    } catch (error) {
        console.error("Admin Affiliate Transactions GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
