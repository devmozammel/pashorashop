import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const pages = await prisma.landingPage.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { products: true } } }
        });

        return NextResponse.json(pages);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            title,
            slug,
            isActive,
            heroTitle,
            heroDescription,
            heroBtn,
            heroLink,
            heroImageUrl,
            ctaText,
            countdownEnd,
            discountCode,
            showTestimonials,
        } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
        }

        const page = await prisma.landingPage.create({
            data: {
                title,
                slug,
                isActive: isActive ?? true,
                heroTitle: heroTitle || title,
                heroDescription: heroDescription || null,
                heroBtn: heroBtn || "অর্ডার করুন এখনই",
                heroLink: heroLink || null,
                heroImageUrl: heroImageUrl || null,
                ctaText: ctaText || "অর্ডার করুন এখনই",
                countdownEnd: countdownEnd ? new Date(countdownEnd) : null,
                discountCode: discountCode || null,
                showTestimonials: showTestimonials ?? false,
            }
        });

        return NextResponse.json(page);

    } catch (error) {
        console.error("[Admin LP POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

