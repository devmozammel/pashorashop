import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
        GOOGLE_CLIENT_ID_exists: !!(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE__CLIENT_ID),
        GOOGLE_CLIENT_SECRET_exists: !!(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE__CLIENT_SECRET),
        NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV
    });
}
