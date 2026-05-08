import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
        const { success } = rateLimit(ip, 3); // 3 messages per minute
        if (!success) {
            return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
        }

        const body = await req.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
        }

        const newContact = await prisma.contactMessage.create({
            data: {
                name,
                email,
                message,
                status: "NEW", // NEW, READ, REPLIED
            },
        });

        // Notify Admin
        await prisma.notification.create({
            data: {
                userId: null, // Admin
                type: "NEW_CONTACT",
                message: `New message from ${name} (${email}): ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`
            }
        });

        return NextResponse.json({ success: true, contact: newContact }, { status: 201 });
    } catch (error) {
        console.error("Error creating contact message:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
}
