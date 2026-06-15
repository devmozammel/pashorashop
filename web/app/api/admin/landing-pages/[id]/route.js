import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, props) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await props.params;
        const page = await prisma.landingPage.findUnique({
            where: { id },
            include: {
                products: {
                    select: { productId: true }
                }
            }
        });

        if (!page) return NextResponse.json({ error: "Page not found" }, { status: 404 });

        return NextResponse.json(page);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req, props) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await props.params;
        const body = await req.json();
        
        // Extract productId and map fields to schema
        const {
            productId,
            title,
            slug,
            isActive,
            heroTitle,
            heroDescription,
            heroImageUrl,
            heroBtn,
            heroLink,
            ctaText,
            countdownEnd,
            discountCode,
            showTestimonials
        } = body;

        // Update landing page
        const updated = await prisma.landingPage.update({
            where: { id },
            data: {
                title,
                slug,
                isActive: isActive ?? true,
                heroTitle: heroTitle || null,
                heroDescription: heroDescription || null,
                heroImageUrl: heroImageUrl || null,
                heroBtn: heroBtn || null,
                heroLink: heroLink || null,
                ctaText: ctaText || null,
                countdownEnd: countdownEnd ? new Date(countdownEnd) : null,
                discountCode: discountCode || null,
                showTestimonials: showTestimonials ?? false,
            }
        });

        // Update associated product
        if (productId) {
            await prisma.landingPageProduct.deleteMany({
                where: { landingPageId: id }
            });

            await prisma.landingPageProduct.create({
                data: {
                    landingPageId: id,
                    productId: productId,
                    sortOrder: 0
                }
            });
        } else {
            await prisma.landingPageProduct.deleteMany({
                where: { landingPageId: id }
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[LP PUT Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await props.params;
        await prisma.landingPage.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

