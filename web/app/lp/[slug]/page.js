// app/lp/[slug]/page.js — Premium White LP v7
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import LandingPageClient from "./LandingPageClient";
import LandingPageGallery from "./LandingPageGallery";
import WhatsAppOrderForm from "./LandingPageWhatsApp";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    try {
        let { slug } = await params;
        if (slug) slug = slug.replace(/\.+$/, "");
        const page = await prisma.landingPage.findUnique({ where: { slug } });
        if (!page) return { title: "Not Found" };
        return { title: page.heroTitle || page.title, description: page.heroDescription || "", alternates: { canonical: `/lp/${slug}` } };
    } catch { return { title: "Landing Page" }; }
}

export default async function LandingPage({ params }) {
    let { slug } = await params;
    if (slug) slug = slug.replace(/\.+$/, "");

    let page = null;
    try {
        page = await prisma.landingPage.findUnique({
            where: { slug },
            include: { products: { orderBy: { sortOrder: "asc" }, include: { product: { include: { productImages: { orderBy: { sortOrder: "asc" }, take: 8 }, variants: true } } } } }
        });
    } catch (err) { console.error("[LP]", err.message); notFound(); }
    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    let waNumber = "8801613134043";
    try {
        const { getDecryptedSettings } = await import("@/lib/settings");
        const s = await getDecryptedSettings();
        if (s?.whatsapp) { let c = s.whatsapp.replace(/\D/g, ""); if (c.startsWith("0")) c = "88" + c; if (!c.startsWith("88")) c = "88" + c; waNumber = c; }
    } catch { }

    const now = new Date();
    try {
        const ids = allProducts.map((p) => p.id).filter(Boolean);
        const fi = await prisma.flashSaleItem.findMany({ where: { productId: { in: ids }, isActive: true, flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } } });
        const fm = {}; fi.forEach((i) => { fm[i.productId] = i.salePrice; });
        allProducts.forEach((p) => { if (fm[p.id]) { p.salePrice = fm[p.id]; p.discountPrice = fm[p.id]; } });
    } catch { }

    const heroImg = page.heroImageUrl || primaryProduct?.productImages?.[0]?.url || (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null);
    const productImages = primaryProduct?.productImages?.map((i) => i.url).filter(Boolean).length > 0
        ? primaryProduct.productImages.map((i) => i.url).filter(Boolean)
        : heroImg ? [heroImg] : [];
    const effectivePrice = primaryProduct?.salePrice ?? primaryProduct?.price ?? 0;
    const originalPrice = primaryProduct?.price ?? 0;
    const discount = effectivePrice && originalPrice && originalPrice > effectivePrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : null;

    let testimonials = [
        { name: "রাফসান আহমেদ", text: "প্রোডাক্টটা একদম অসাধারণ! দ্রুত ডেলিভারি এবং কোয়ালিটি দেখে মুগ্ধ। ১০০% রেকমেন্ড।", rating: 5, city: "ঢাকা" },
        { name: "নাফিসা আক্তার", text: "এত কম দামে এই কোয়ালিটি আর পাইনি। Authentic Bazar সত্যিই বিশ্বস্ত।", rating: 5, city: "চট্টগ্রাম" },
        { name: "শাকিল ইসলাম", text: "প্যাকেজিং সুন্দর, পণ্য আসল। ক্যাশ অন ডেলিভারিতে পেয়েছি, ভরসা করা যায়।", rating: 5, city: "সিলেট" },
    ];
    if (page.testimonialsJson) {
        try { const p = JSON.parse(page.testimonialsJson); if (Array.isArray(p) && p.length > 0) testimonials = p; } catch { }
    }

    let featureList = [
        { icon: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পেয়ে পেমেন্ট", color: "#7c3aed" },
        { icon: "✅", title: "১০০% অরিজিনাল", desc: "নিশ্চিত মানের পণ্য", color: "#059669" },
        { icon: "🔄", title: "সহজ রিটার্ন", desc: "সমস্যা হলে ফেরত নেওয়া হবে", color: "#2563eb" },
        { icon: "⚡", title: "দ্রুত ডেলিভারি", desc: "ঢাকায় ১ থেকে ২ দিন, বাইরে ৩ থেকে ৫ দিন", color: "#d97706" },
    ];
    if (page.featuresJson) {
        try {
            const f = JSON.parse(page.featuresJson);
            if (Array.isArray(f) && f.length > 0) featureList = f.map((x, i) => ({ ...x, color: ["#7c3aed", "#059669", "#2563eb", "#d97706"][i % 4] }));
        } catch { }
    }

    const WA_STYLE = { background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 10px 30px rgba(37,211,102,0.28)" };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
                .lp-v6 { font-family: 'Hind Siliguri', 'Inter', -apple-system, sans-serif; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
                .lp-v6 h1, .lp-v6 h2, .lp-v6 h3 { letter-spacing: normal !important; line-height: 1.35 !important; }

                /* Ticker */
                @keyframes lp-tick { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                .lp-ticker { animation: lp-tick 22s linear infinite; display:flex; width:max-content; gap:3rem; }

                /* Float badges */
                @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
                .lp-fl1 { animation: lp-float 3s ease-in-out infinite; }
                .lp-fl2 { animation: lp-float 3.7s ease-in-out 0.6s infinite; }
                .lp-fl3 { animation: lp-float 4.2s ease-in-out 1.2s infinite; }
                .lp-fl4 { animation: lp-float 3.4s ease-in-out 1.8s infinite; }

                /* Shimmer on WA button */
                @keyframes lp-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
                .lp-wa-btn { position:relative; overflow:hidden; transition: all 0.25s cubic-bezier(.34,1.56,.64,1); }
                .lp-wa-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%); transform:translateX(-100%); animation:lp-shimmer 2.5s ease-in-out 1s infinite; }
                .lp-wa-btn:hover { transform: translateY(-2px) scale(1.03); }

                /* Outline button */
                .lp-outline-btn { transition: all 0.2s ease; border: 2px solid #18181b; }
                .lp-outline-btn:hover { background: #18181b; color: #fff; }

                /* Delivery grid top accent */
                .lp-del { position:relative; overflow:hidden; }
                .lp-del::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
                .lp-del-1::before { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
                .lp-del-2::before { background: linear-gradient(90deg,#059669,#34d399); }
                .lp-del-3::before { background: linear-gradient(90deg,#2563eb,#60a5fa); }
                .lp-del-4::before { background: linear-gradient(90deg,#d97706,#fcd34d); }

                /* Review hover */
                .lp-rv { transition: transform 0.25s ease, box-shadow 0.25s ease; }
                .lp-rv:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); }
            `}</style>

            <div className="lp-v6 min-h-screen bg-white overflow-x-hidden">

                {/* ══ TICKER ══ */}
                <div className="bg-zinc-950 py-2.5 overflow-hidden">
                    <div className="lp-ticker text-[11px] font-semibold tracking-widest text-zinc-400">
                        {[...Array(10)].map((_, i) => (
                            <span key={i} className="flex items-center gap-10 shrink-0">
                                <span>⚡ সীমিত সময়ের অফার</span>
                                <span className="text-emerald-500">◆</span>
                                <span>🚚 ক্যাশ অন ডেলিভারি</span>
                                <span className="text-emerald-500">◆</span>
                                <span>✅ ১০০% অরিজিনাল গ্যারান্টি</span>
                                <span className="text-emerald-500">◆</span>
                                <span>📦 সারাদেশে দ্রুত ডেলিভারি</span>
                                <span className="text-emerald-500">◆</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══ HERO ══ */}
                <section className="relative bg-white overflow-hidden py-12 md:py-0 min-h-[88vh] flex items-center">
                    {/* Subtle bg blobs */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-[550px] h-[550px] rounded-full blur-[100px] opacity-[0.06]"
                            style={{ background: "radial-gradient(circle, #25d366 0%, transparent 70%)" }} />
                        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05]"
                            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-10 w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">

                        {/* ── LEFT: Text inside a box card ── */}
                        <div className="order-2 md:order-1">
                            <div className="bg-white border border-zinc-200 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] p-6 md:p-8 flex flex-col gap-5">

                                {/* Flash deal pill */}
                                {page.countdownEnd && (
                                    <div className="inline-flex self-start items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                                        <span className="text-emerald-700 text-[11px] font-black tracking-[0.15em] uppercase">Flash Deal সক্রিয়</span>
                                    </div>
                                )}

                                {/* Coupon */}
                                {page.discountCode && (
                                    <div className="inline-flex self-start items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                                        <span>🎁</span>
                                        <span className="text-amber-800 text-sm font-black">কুপন কোড:</span>
                                        <code className="bg-amber-100 border border-amber-300 text-amber-900 font-mono font-black text-sm px-2.5 py-0.5 rounded-lg">{page.discountCode}</code>
                                    </div>
                                )}

                                {/* Headline */}
                                <div>
                                    <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-zinc-950 leading-[1.35] tracking-normal">
                                        {page.heroTitle || primaryProduct?.name || page.title}
                                    </h1>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-1 w-16 rounded-full bg-emerald-500" />
                                        <div className="h-1 w-4 rounded-full bg-emerald-300" />
                                    </div>
                                </div>

                                {page.heroDescription && (
                                    <p className="text-zinc-600 text-sm md:text-base leading-relaxed font-normal">{page.heroDescription}</p>
                                )}

                                {/* Countdown */}
                                {page.countdownEnd && (
                                    <div className="bg-zinc-950 rounded-2xl px-5 py-3.5 self-start">
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1.5">⏱ অফার শেষ হচ্ছে</p>
                                        <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />
                                    </div>
                                )}

                                {/* Price */}
                                <div className="flex items-end flex-wrap gap-3">
                                    {effectivePrice > 0 ? (
                                        <>
                                            <span className="text-4xl md:text-5xl font-black text-zinc-950 tabular-nums">{formatPrice(effectivePrice)}</span>
                                            {discount && (
                                                <div className="flex flex-col gap-1 mb-1">
                                                    <span className="text-xl text-zinc-400 line-through tabular-nums">{formatPrice(originalPrice)}</span>
                                                    <span className="text-xs font-black text-white bg-rose-600 px-3 py-1 rounded-full self-start">{discount}% ছাড়!</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-zinc-500 text-base font-semibold">মূল্য জানতে অর্ডার করুন</span>
                                    )}
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <a href="#order-form"
                                        className="lp-wa-btn flex-1 inline-flex items-center justify-center gap-2.5 font-black text-base py-4 px-6 rounded-2xl text-white"
                                        style={WA_STYLE}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp এ অর্ডার করুন
                                    </a>
                                    {primaryProduct && (
                                        <Link href={`/checkout/express/${primaryProduct.id}`}
                                            className="lp-outline-btn inline-flex items-center justify-center gap-2 font-black text-base py-4 px-6 rounded-2xl text-zinc-900">
                                            🛒 সরাসরি কিনুন
                                        </Link>
                                    )}
                                </div>

                                {/* Trust pills */}
                                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100">
                                    {["✅ ক্যাশ অন ডেলিভারি", "🔒 অরিজিনাল গ্যারান্টি", "🔄 সহজ রিটার্ন", "📦 দ্রুত ডেলিভারি"].map((t) => (
                                        <span key={t} className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5 font-medium">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Product image — large, clean, no floating badges ── */}
                        <div className="order-1 md:order-2 relative flex items-center justify-center">
                            <div className="relative w-full mx-auto">
                                {/* Glow blob */}
                                <div className="absolute inset-4 rounded-[2rem] blur-[70px] opacity-15"
                                    style={{ background: "linear-gradient(135deg,#25d366,#7c3aed)" }} />

                                {/* Product card — bigger, full width */}
                                <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-[0_28px_90px_rgba(0,0,0,0.13)] bg-white" style={{ aspectRatio: "1/1", minHeight: 320 }}>
                                    {heroImg ? (
                                        <Image src={heroImg} alt={primaryProduct?.name || page.title} fill priority className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-8xl bg-zinc-50">📦</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
                                </div>

                                {/* Discount badge only */}
                                {discount && (
                                    <div className="absolute -top-3 -right-3 z-30 w-16 h-16 rounded-full flex flex-col items-center justify-center border-[3px] border-white shadow-lg bg-rose-600">
                                        <span className="text-white font-black text-sm leading-none">{discount}%</span>
                                        <span className="text-white/80 text-[9px]">ছাড়</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ STATS BAR ══ */}
                <div className="bg-zinc-950 py-8 md:py-10">
                    <div className="max-w-4xl mx-auto px-5 grid grid-cols-3 gap-4 divide-x divide-white/8">
                        {[
                            { n: "৫০০০+", l: "সন্তুষ্ট কাস্টমার", c: "#34d399" },
                            { n: "⭐ ৪.৯", l: "গড় রেটিং", c: "#fbbf24" },
                            { n: "২৪ঘণ্টা", l: "সাপোর্ট", c: "#a78bfa" },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center text-center px-3 py-1">
                                <span className="text-2xl md:text-3xl font-black" style={{ color: s.c }}>{s.n}</span>
                                <span className="text-zinc-500 text-xs mt-1 font-medium">{s.l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ PRODUCT DETAIL ══ */}
                {primaryProduct && (
                    <section className="py-16 md:py-20" style={{ background: "#f8f8fc" }}>
                        <div className="max-w-5xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-10">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">পণ্যের বিবরণ</span>
                                <h2 className="text-xl md:text-2xl font-black text-zinc-950 max-w-2xl mx-auto leading-snug">{primaryProduct.name}</h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
                                <div className="grid md:grid-cols-2 gap-0">
                                    {/* Gallery */}
                                    <div className="border-b md:border-b-0 md:border-r border-zinc-100">
                                        <LandingPageGallery images={productImages} productName={primaryProduct.name} />
                                    </div>

                                    {/* Details */}
                                    <div className="p-6 md:p-8 flex flex-col gap-5">
                                        {/* Price */}
                                        {effectivePrice > 0 && (
                                            <div className="flex items-end flex-wrap gap-3">
                                                <span className="text-4xl font-black text-zinc-950 tabular-nums">{formatPrice(effectivePrice)}</span>
                                                {discount && <><span className="text-xl text-zinc-400 line-through mb-0.5 tabular-nums">{formatPrice(originalPrice)}</span><span className="text-xs font-black text-white bg-rose-600 px-3 py-1 rounded-full mb-0.5">{discount}% OFF</span></>}
                                            </div>
                                        )}

                                        {/* Description — fixed overflow */}
                                        {primaryProduct.description && (
                                            <div
                                                className="text-zinc-600 text-sm leading-relaxed overflow-hidden [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-zinc-900 [&_p]:mb-2 [&_p]:break-words [&_li]:break-words"
                                                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                                                dangerouslySetInnerHTML={{ __html: primaryProduct.description }}
                                            />
                                        )}

                                        {/* Delivery cards with top accent */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { e: "🚚", t: "ঢাকায়", v: "৭০ টাকা", cls: "lp-del-1" },
                                                { e: "📦", t: "সারাদেশে", v: "১৩০ টাকা", cls: "lp-del-2" },
                                                { e: "⏰", t: "ডেলিভারি", v: "১-৫ দিন", cls: "lp-del-3" },
                                                { e: "💳", t: "পেমেন্ট", v: "ক্যাশ অন ডেলিভারি", cls: "lp-del-4" },
                                            ].map((x) => (
                                                <div key={x.t} className={`lp-del ${x.cls} bg-zinc-50 rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-2.5`}>
                                                    <span className="text-lg shrink-0">{x.e}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-zinc-400 text-[10px] font-semibold uppercase">{x.t}</p>
                                                        <p className="text-zinc-900 text-xs font-black truncate">{x.v}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* WhatsApp CTA */}
                                        <a href="#order-form"
                                            className="lp-wa-btn flex items-center justify-center gap-2.5 text-white font-black text-base py-4 rounded-2xl"
                                            style={WA_STYLE}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            📲 WhatsApp এ অর্ডার করুন
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ REVIEWS ══ */}
                {page.showTestimonials && (
                    <section className="py-16 md:py-20 bg-white">
                        <div className="max-w-5xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">কাস্টমার রিভিউ</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950 mb-3">তারা কী বলেন?</h2>
                                <div className="flex items-center justify-center gap-0.5">
                                    {"★★★★★".split("").map((s, i) => <span key={i} className="text-amber-400 text-xl">{s}</span>)}
                                    <span className="text-zinc-400 text-sm ml-2">৫.০ / ৫.০</span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 md:gap-5 items-start">
                                {testimonials.map((r, i) => {
                                    const isCenter = i === 1;
                                    return (
                                        <div key={i}
                                            className={`lp-rv rounded-3xl p-5 md:p-6 flex flex-col gap-4 ${isCenter
                                                ? "md:-mt-5 shadow-xl shadow-emerald-100 border border-emerald-200"
                                                : "border border-zinc-100 bg-white shadow-sm"
                                            }`}
                                            style={isCenter ? { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" } : {}}>
                                            <div className="flex text-amber-400">
                                                {"★".repeat(Math.min(5, r.rating || 5))}
                                            </div>
                                            <p className={`text-sm leading-relaxed flex-1 ${isCenter ? "text-emerald-50" : "text-zinc-600"}`}>"{r.text}"</p>
                                            <div className={`flex items-center gap-3 pt-3 border-t ${isCenter ? "border-emerald-500/30" : "border-zinc-100"}`}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                                                    style={{ background: isCenter ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg,#25d366,#059669)" }}>
                                                    {r.name?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black ${isCenter ? "text-white" : "text-zinc-900"}`}>{r.name}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCenter ? "bg-white/15 text-white/80" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>✅ যাচাইকৃত {r.city && `• ${r.city}`}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ WHATSAPP ORDER FORM ══ */}
                <section id="order-form" className="py-16 md:py-24 relative overflow-hidden" style={{ background: "#f8f8fc" }}>
                    {/* Decorative elements */}
                    <div className="absolute top-8 right-8 w-28 h-28 rounded-full border-[18px] border-emerald-100 opacity-60 pointer-events-none" />
                    <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full border-[12px] border-emerald-100 opacity-50 pointer-events-none" />

                    <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-10 grid md:grid-cols-2 gap-8 md:gap-12 items-stretch">

                        {/* Left — Guide box */}
                        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 md:p-8 flex flex-col gap-6">
                            <div>
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-4">সরাসরি অর্ডার</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950 leading-tight">
                                    WhatsApp এ <span className="text-emerald-600">১ মিনিটে</span> অর্ডার করুন
                                </h2>
                            </div>
                            <p className="text-zinc-500 text-sm leading-relaxed">ফর্ম পূরণ করুন, বাটন চাপলেই সম্পূর্ণ অর্ডার বার্তা সহ WhatsApp খুলে যাবে।</p>

                            {/* Steps */}
                            <div className="space-y-3">
                                {[
                                    { n: "১", t: "ফর্ম পূরণ করুন", d: "নাম, ফোন ও ঠিকানা লিখুন", c: "#059669" },
                                    { n: "২", t: "বাটনে ক্লিক করুন", d: "WhatsApp আপনাআপনি খুলবে", c: "#25d366" },
                                    { n: "৩", t: "মেসেজ পাঠান", d: "Send করলেই অর্ডার কনফার্ম!", c: "#047857" },
                                ].map((s) => (
                                    <div key={s.n} className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-zinc-50 transition-colors">
                                        <div className="w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 text-white" style={{ background: s.c }}>{s.n}</div>
                                        <div>
                                            <p className="font-black text-zinc-900 text-sm">{s.t}</p>
                                            <p className="text-zinc-500 text-xs mt-0.5">{s.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Mini product card */}
                            {primaryProduct && heroImg && (
                                <div className="mt-auto flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 shrink-0">
                                        <Image src={heroImg} alt={primaryProduct.name} width={56} height={56} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-zinc-900 font-black text-sm line-clamp-2 leading-snug">{primaryProduct.name}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-emerald-600 font-black text-base">{effectivePrice > 0 ? formatPrice(effectivePrice) : "দাম জানুন"}</span>
                                            {discount && <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-black">{discount}% ছাড়</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — Form box */}
                        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden relative">
                            {/* Top green accent line */}
                            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #25d366, #059669, #047857)" }} />
                            <div className="p-6 md:p-8">
                                <p className="font-black text-zinc-900 text-base mb-5 flex items-center gap-2">
                                    <span>📝</span> অর্ডার ফর্ম পূরণ করুন
                                </p>
                                <WhatsAppOrderForm
                                    productName={primaryProduct?.name || page.title}
                                    productPrice={effectivePrice}
                                    productImage={heroImg}
                                    waNumber={waNumber}
                                    theme="light"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ BOTTOM CTA ══ */}
                <section className="py-16 text-center bg-zinc-950 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                    <div className="absolute inset-0 opacity-[0.08]" style={{ background: "radial-gradient(circle at 50% 50%, #25d366 0%, transparent 60%)" }} />
                    <div className="relative z-10 max-w-lg mx-auto px-5">
                        <p className="text-4xl mb-4">⚡</p>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">এখনই সুযোগ নিন!</h2>
                        <p className="text-zinc-400 mb-7 text-sm">Stock সীমিত, দেরি করলে পাবেন না</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="#order-form"
                                className="lp-wa-btn inline-flex items-center justify-center gap-2.5 text-white font-black text-base px-8 py-4 rounded-2xl"
                                style={WA_STYLE}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                WhatsApp-এ অর্ডার করুন
                            </a>
                            {primaryProduct && (
                                <Link href={`/checkout/express/${primaryProduct.id}`}
                                    className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/8 transition-colors">
                                    🛒 সরাসরি কিনুন
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="py-5 border-t border-zinc-100 text-center text-xs text-zinc-400 bg-white">
                    <p>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Authentic Bazar"}. সর্বস্বত্ব সংরক্ষিত।</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <Link href="/privacy-policy" className="hover:text-zinc-700 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-zinc-700 transition-colors">Contact</Link>
                    </div>
                </footer>
            </div>
        </>
    );
}
