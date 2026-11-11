import { NextResponse } from "next/server";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { fetchWhatsAppMedia } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET(_req, props) {
    const staff = await requireStaff();
    if (!staff) return unauthorizedResponse();

    try {
        const params = await props.params;
        const mediaId = params?.mediaId;
        if (!mediaId || !/^[a-zA-Z0-9_-]+$/.test(mediaId)) {
            return NextResponse.json({ ok: false, message: "Invalid media ID" }, { status: 400 });
        }

        const asset = await fetchWhatsAppMedia(mediaId);
        if (!asset) {
            return NextResponse.json({ ok: false, message: "Media not found or expired" }, { status: 404 });
        }

        return new Response(asset.buffer, {
            status: 200,
            headers: {
                "Content-Type": asset.mimeType,
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
