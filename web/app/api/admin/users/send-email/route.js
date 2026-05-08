import { NextResponse } from "next/server";
import { requireAdmin, unauthorizedResponse } from "@/lib/require-admin";
import nodemailer from "nodemailer";

export async function POST(req) {
    try {
        const admin = await requireAdmin();
        if (!admin) return unauthorizedResponse();

        const { emails, subject, message } = await req.json();

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return NextResponse.json(
                { ok: false, message: "Please select at least one valid recipient." },
                { status: 400 }
            );
        }

        if (!subject || !message) {
            return NextResponse.json(
                { ok: false, message: "Subject and message body are required." },
                { status: 400 }
            );
        }

        // Production Setup Check
        if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
            console.log("===============================");
            console.log("MOCK BULK EMAIL DISPATCHED (DEV MODE)");
            console.log(`To: ${emails.length} recipients`);
            console.log(`Emails: ${emails.join(", ")}`);
            console.log(`Subject: ${subject}`);
            console.log(`Content length: ${message.length} chars`);
            console.log("===============================");

            return NextResponse.json({
                ok: true,
                message: `Simulated sending to ${emails.length} users. Configure SMTP in .env to send real emails.`,
                devMode: true
            });
        }

        // Live Setup
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
            port: Number(process.env.EMAIL_SERVER_PORT) || 587,
            secure: process.env.EMAIL_SERVER_PORT === "465",
            auth: {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
            },
        });

        // Loop through all emails asynchronously but isolated so one failure doesn't stop the rest
        let successCount = 0;
        let failCount = 0;

        const emailPromises = emails.map(async (email) => {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"Authentic Bazar" <noreply@authenticbazar.com>',
                    to: email,
                    subject: subject,
                    html: message,
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to send email to ${email}:`, err);
                failCount++;
            }
        });

        await Promise.allSettled(emailPromises);

        return NextResponse.json({
            ok: true,
            message: `Successfully sent ${successCount} emails. ${failCount > 0 ? `Failed to send ${failCount}.` : ""}`
        });

    } catch (error) {
        console.error("Bulk Email Error:", error);
        return NextResponse.json(
            { ok: false, message: "Internal server error." },
            { status: 500 }
        );
    }
}
