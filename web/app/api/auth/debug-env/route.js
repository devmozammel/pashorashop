import { NextResponse } from "next/server";

export async function GET() {
    // Collect all env keys starting with GOOG or NEXT
    const foundKeys = Object.keys(process.env)
        .filter(key => key.toUpperCase().startsWith("GOOG") || key.toUpperCase().startsWith("NEXT"))
        .map(key => ({
            keyName: key,
            keyLength: key.length,
            hasLeadingTrailingSpaces: key.trim() !== key,
            valueLength: process.env[key] ? process.env[key].length : 0
        }));

    return NextResponse.json({
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET",
        GOOGLE_CLIENT_ID_exists: !!(process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE__CLIENT_ID),
        GOOGLE_CLIENT_SECRET_exists: !!(process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE__CLIENT_SECRET),
        NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
        foundKeys: foundKeys,
        NODE_ENV: process.env.NODE_ENV
    });
}
