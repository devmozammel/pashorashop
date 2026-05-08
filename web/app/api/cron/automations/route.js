
import { checkAbandonedCheckouts } from "@/lib/automations";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Verify secret or admin session here if needed
        const count = await checkAbandonedCheckouts();
        return NextResponse.json({ success: true, processed: count });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
