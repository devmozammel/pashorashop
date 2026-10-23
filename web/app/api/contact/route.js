import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";


export const dynamic = "force-dynamic";

// Basic email format validator (RFC-compliant lightweight check)
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
        const { success } = rateLimit(ip, 3); // 3 messages per minute
        if (!success) {
            return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
        }

        const body = await req.json();
        const { name, email, message } = body;

        // --- Presence check ---
        if (!name || !email || !message) {
            return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
        }

        // --- Email format validation ---
        if (!isValidEmail(email)) {
            return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
        }

        // --- Length limits ---
        if (String(name).trim().length > 100) {
            return NextResponse.json({ error: "Name is too long (max 100 characters)" }, { status: 400 });
        }
        if (String(email).trim().length > 254) {
            return NextResponse.json({ error: "Email address is too long" }, { status: 400 });
        }
        if (String(message).trim().length < 10) {
            return NextResponse.json({ error: "Message is too short (min 10 characters)" }, { status: 400 });
        }
        if (String(message).trim().length > 2000) {
            return NextResponse.json({ error: "Message is too long (max 2000 characters)" }, { status: 400 });
        }

        const sanitizedName    = String(name).trim();
        const sanitizedEmail   = String(email).trim().toLowerCase();
        const sanitizedMessage = String(message).trim();

        const newContact = await prisma.contactMessage.create({
            data: {
                name:    sanitizedName,
                email:   sanitizedEmail,
                message: sanitizedMessage,
                status: "NEW",
            },
        });

        // Notify Admin
        await prisma.notification.create({
            data: {
                userId: null,
                type: "NEW_CONTACT",
                message: `New message from ${sanitizedName} (${sanitizedEmail}): ${sanitizedMessage.substring(0, 100)}${sanitizedMessage.length > 100 ? "..." : ""}`
            }
        });

        return NextResponse.json({ success: true, contact: newContact }, { status: 201 });
    } catch (error) {
        console.error("Error creating contact message:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
