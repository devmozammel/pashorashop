import { NextResponse } from "next/server";
import { requireStaff, unauthorizedResponse } from "@/lib/require-admin";
import { ingestInboundSocialEvent } from "@/lib/social-ingestion";

export const dynamic = "force-dynamic";

const PRESETS = {
    MESSENGER_AD: {
        channel: "MESSENGER",
        customerName: "Nusrat Jahan",
        customerHandle: "fb.com/nusrat.jahan",
        phone: "01711223344",
        body: "ভাইয়া এই ড্রেসটার দাম কত? আমার নাম নুসরাত জাহান, বাসা মিরপুর ১০, ঢাকা। ফোন 01711223344",
        adPlatform: "FACEBOOK",
        adId: "fb_ad_eid_01",
        adName: "Eid Collection Boost #1",
        campaignName: "Eid Premium Lawn 2026",
    },
    FB_COMMENT_PRICE: {
        channel: "FB_COMMENT",
        customerName: "Tanvir Ahmed",
        customerHandle: "Tanvir Ahmed",
        body: "Price please? Order korte chai",
        postId: "post_boost_101",
        postTitle: "Boosted Post: Exclusive Pashora Combo Offer",
        adPlatform: "FACEBOOK",
        adId: "fb_ad_combo_02",
        adName: "Combo Post Boost",
        campaignName: "Combo Conversion Boost",
    },
    WHATSAPP_AD: {
        channel: "WHATSAPP",
        customerName: "Rakibul Hasan",
        customerHandle: "+8801812345678",
        phone: "01812345678",
        body: "Facebook ad dekhe WhatsApp e msg dilam. Cash on delivery hobe? Uttara Sector 7, Dhaka.",
        adPlatform: "FACEBOOK",
        adId: "ctwa_boost_04",
        adName: "Click-to-WhatsApp Ad #4",
        campaignName: "WhatsApp Conversion Boost",
    },
};

export async function POST(req) {
    try {
        const staff = await requireStaff();
        if (!staff) return unauthorizedResponse();

        const body = await req.json();
        const presetKey = body.preset;
        const preset = presetKey && PRESETS[presetKey] ? PRESETS[presetKey] : {};

        const channel = body.channel || preset.channel || "MESSENGER";
        const suffix = Date.now().toString().slice(-5);

        const result = await ingestInboundSocialEvent({
            channel,
            externalThreadId: body.externalThreadId || `sim_${channel.toLowerCase()}_${suffix}`,
            externalUserId: body.externalUserId || `sim_user_${suffix}`,
            externalMessageId: `sim_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            commentId: channel.includes("COMMENT") ? `sim_cmt_${suffix}` : null,
            customerName: body.customerName || preset.customerName || "Demo Customer",
            customerHandle: body.customerHandle || preset.customerHandle || null,
            phone: body.phone || preset.phone || null,
            body: body.body || preset.body || "দাম কত ভাইয়া?",
            postId: body.postId || preset.postId || null,
            postTitle: body.postTitle || preset.postTitle || null,
            adPlatform: body.adPlatform || preset.adPlatform || "ORGANIC",
            adId: body.adId || preset.adId || null,
            adName: body.adName || preset.adName || null,
            campaignName: body.campaignName || preset.campaignName || null,
        });

        return NextResponse.json({
            ok: true,
            data: result,
        });
    } catch (error) {
        return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
    }
}
