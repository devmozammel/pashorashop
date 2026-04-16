import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const { slug } = await params;

        const page = await prisma.landingPage.findUnique({
            where: { slug },
            include: {
                products: {
                    include: {
                        product: {
                            include: {
                                productImages: { orderBy: { sortOrder: "asc" }, take: 5 },
                                variants: { where: { isActive: true } },
                            }
                        }
                    },
                    orderBy: { sortOrder: "asc" }
                }
            }
        });

        if (!page) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(page);
    } catch (error) {
        console.error("Error fetching landing page:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

