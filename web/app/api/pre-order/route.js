import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { rateLimit } from "@/lib/rate-limit";

// Configure Cloudinary from env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FALLBACK_TO_LOCAL = !process.env.CLOUDINARY_CLOUD_NAME;

export async function POST(request) {
    try {
        // --- 🔒 RATE LIMITING ---
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { success } = rateLimit(ip, 3); // 3 pre-orders per minute per IP
        if (!success) {
            return NextResponse.json({ error: "Too many pre-order requests. Please try again later." }, { status: 429 });
        }

        const data = await request.formData();
        
        const name = data.get("name");
        const phone = data.get("phone");
        const details = data.get("details");

        // --- 🔒 INPUT VALIDATION & SANITIZATION ---
        const nameStr = name ? String(name).trim() : "";
        const phoneStr = phone ? String(phone).trim() : "";
        const detailsStr = details ? String(details).trim() : "";

        if (!nameStr || !phoneStr || !detailsStr) {
            return NextResponse.json({ error: "Name, phone, and details are required." }, { status: 400 });
        }

        if (nameStr.length < 2 || nameStr.length > 100) {
            return NextResponse.json({ error: "Name must be between 2 and 100 characters." }, { status: 400 });
        }

        if (phoneStr.length < 10 || phoneStr.length > 20) {
            return NextResponse.json({ error: "Please enter a valid phone number (10-20 characters)." }, { status: 400 });
        }

        if (detailsStr.length < 10 || detailsStr.length > 1000) {
            return NextResponse.json({ error: "Details must be between 10 and 1000 characters." }, { status: 400 });
        }

        const preOrder = await prisma.preOrderRequest.create({
            data: {
                name: nameStr,
                phone: phoneStr,
                details: detailsStr,
                imageUrl: null,
            }
        });

        return NextResponse.json({ success: true, preOrder });
    } catch (error) {
        console.error("Pre-order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
