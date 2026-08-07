// app/lp/[slug]/page.js — Editorial White LP — Premium v4
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
        return {
            title: page.heroTitle || page.title,
            description: page.heroDescription || "",
            alternates: { canonical: `/lp/${slug}` }
        };
    } catch { return { title: "Landing Page" }; }
}

export default async function LandingPage({ params }) {
    let { slug } = await params;
    if (slug) slug = slug.replace(/\.+$/, "");

    let page = null;
    try {
        page = await prisma.landingPage.findUnique({
            where: { slug },
            include: {
                products: {
                    orderBy: { sortOrder: "asc" },
                    include: { product: { include: { productImages: { orderBy: { sortOrder: "asc" }, take: 8 }, variants: true } } }
                }
            }
        });
    } catch (err) { console.error("[LP] DB Error:", err.message); notFound(); }

    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    // WhatsApp number
    let waNumber = "8801613134043";
    try {
        const { getDecryptedSettings } = await import("@/lib/settings");
        const s = await getDecryptedSettings();
        if (s?.whatsapp) {
            let c = s.whatsapp.replace(/\D/g, "");
            if (c.startsWith("0")) c = "88" + c;
            if (!c.startsWith("88")) c = "88" + c;
            waNumber = c;
        }
    } catch { }

    // Flash sale pricing
    const now = new Date();
    try {
        const ids = allProducts.map((p) => p.id).filter(Boolean);
        const fi = await prisma.flashSaleItem.findMany({ where: { productId: { in: ids }, isActive: true, flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } } });
        const fm = {}; fi.forEach((i) => { fm[i.productId] = i.salePrice; });
        allProducts.forEach((p) => { if (fm[p.id]) { p.salePrice = fm[p.id]; p.discountPrice = fm[p.id]; } });
    } catch { }

    const heroImg = page.heroImageUrl || primaryProduct?.productImages?.[0]?.url || (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null);
    const productImages = primaryProduct?.productImages?.map((i) => i.url).filter(Boolean).length > 0 ? primaryProduct.productImages.map((i) => i.url).filter(Boolean) : heroImg ? [heroImg] : [];
    const effectivePrice = primaryProduct?.salePrice ?? primaryProduct?.price ?? 0;
    const originalPrice = primaryProduct?.price ?? 0;
    const discount = effectivePrice && originalPrice && originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : null;

    let testimonials = [
        { name: "রাফসান আহমেদ", text: "প্রোডাক্টটা একদম অসাধারণ! দ্রুত ডেলিভারি পেলাম এবং কোয়ালিটি দেখে মুগ্ধ। ১০০% রেকমেন্ড।", rating: 5, city: "ঢাকা" },
        { name: "নাফিসা আক্তার", text: "দামে এত ভালো মানের পণ্য পাওয়া সত্যিই অবাক করে। Authentic Bazar-কে ধন্যবাদ।", rating: 5, city: "চট্টগ্রাম" },
        { name: "শাকিল ইসলাম", text: "প্যাকেজিং সুন্দর, পণ্য আসল। ক্যাশ অন ডেলিভারিতে পেয়েছি — ভরসা করা যায়।", rating: 5, city: "সিলেট" },
    ];
    if (page.testimonialsJson) { try { const p = JSON.parse(page.testimonialsJson); if (Array.isArray(p) && p.length > 0) testimonials = p; } catch { } }

    let featureList = [
        { icon: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পেয়ে পেমেন্ট করুন" },
        { icon: "✅", title: "১০০% অরিজিনাল", desc: "সম্পূর্ণ খাঁটি ও নিশ্চিত মান" },
        { icon: "🔄", title: "সহজ রিটার্ন", desc: "সমস্যা হলে ফেরত নেওয়া হবে" },
        { icon: "⚡", title: "দ্রুত ডেলিভারি", desc: "ঢাকায় ১-২ দিন, বাইরে ৩-৫ দিন" },
    ];
    if (page.featuresJson) { try { const f = JSON.parse(page.featuresJson); if (Array.isArray(f) && f.length > 0) featureList = f; } catch { } }

    // Feature badges to float around product image
    const floatBadges = featureList.slice(0, 4).map((f, i) => {
        const positions = [
            "top-4 left-0 -translate-x-1/2",
            "top-4 right-0 translate-x-1/2",
            "bottom-16 left-0 -translate-x-1/2",
            "bottom-16 right-0 translate-x-1/2",
        ];
        return { ...f, pos: positions[i] };
    });

    return (
        <>
            {/* ─── Global LP styles ─── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                .lp-root { font-family: 'Inter', sans-serif; }
                .lp-grain::before {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
                    pointer-events: none; z-index: 0; opacity: 0.4;
                }
                @keyframes float-badge { 0%,100%{transform:translateY(0) translateX(var(--tx,0))} 50%{transform:translateY(-6px) translateX(var(--tx,0))} }
                .badge-float { animation: float-badge 3s ease-in-out infinite; }
                .badge-float-2 { animation: float-badge 3.5s ease-in-out 0.5s infinite; }
                .badge-float-3 { animation: float-badge 4s ease-in-out 1s infinite; }
                .badge-float-4 { animation: float-badge 3.2s ease-in-out 1.5s infinite; }
                @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} 50%{box-shadow:0 0 0 12px rgba(124,58,237,0.08)} }
                .cta-glow { animation: glow-pulse 2.5s ease-in-out infinite; }
                @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                .ticker-inner { animation: ticker 18s linear infinite; display:flex; width:max-content; gap:3rem; }
                .diagonal-sep { clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%); }
                .diagonal-sep-rev { clip-path: polygon(0 0, 100% 20%, 100% 100%, 0 100%); }
                .lp-root .prose p { margin-bottom: 0.5rem; }
            `}</style>

            <div className="lp-root lp-grain min-h-screen bg-white overflow-x-hidden">

                {/* ══════════════════════════════════════════
                    ANNOUNCEMENT TICKER
                ══════════════════════════════════════════ */}
                <div className="bg-zinc-950 text-white py-2.5 overflow-hidden relative">
                    <div className="ticker-inner text-xs font-semibold tracking-wider text-white/70">
                        {[...Array(8)].map((_, i) => (
                            <span key={i} className="flex items-center gap-8 shrink-0">
                                <span>⚡ সীমিত সময়ের অফার</span>
                                <span className="text-violet-400">✦</span>
                                <span>🚚 ক্যাশ অন ডেলিভারি</span>
                                <span className="text-violet-400">✦</span>
                                <span>✅ ১০০% অরিজিনাল গ্যারান্টি</span>
                                <span className="text-violet-400">✦</span>
                                <span>📦 সারাদেশে দ্রুত ডেলিভারি</span>
                                <span className="text-violet-400">✦</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    HERO — White Editorial Split
                ══════════════════════════════════════════ */}
                <section className="relative bg-white overflow-hidden min-h-[92vh] flex items-center">
                    {/* Subtle gradient blobs on white */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle at 70% 30%, rgba(124,58,237,0.06) 0%, transparent 60%)" }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
                        style={{ background: "radial-gradient(circle at 30% 70%, rgba(239,68,68,0.05) 0%, transparent 60%)" }} />

                    <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 w-full py-16 md:py-24 grid md:grid-cols-[1fr_480px] lg:grid-cols-[1fr_520px] gap-10 md:gap-16 items-center">

                        {/* LEFT — Content */}
                        <div className="order-2 md:order-1 flex flex-col gap-6">
                            {/* Flash deal pill */}
                            {page.countdownEnd && (
                                <div className="flex items-center gap-2 self-start bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5">
                                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse inline-block" />
                                    <span className="text-violet-700 text-xs font-black tracking-widest uppercase">Flash Deal চলছে</span>
                                </div>
                            )}
                            {page.discountCode && (
                                <div className="flex items-center gap-2 self-start bg-amber-50 border border-amber-300 rounded-xl px-4 py-2">
                                    <span className="text-amber-600 text-sm font-black">🎁 কুপন কোড:</span>
                                    <span className="font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-black text-sm">{page.discountCode}</span>
                                </div>
                            )}

                            {/* Big headline */}
                            <div>
                                <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-black text-zinc-950 leading-[1.06] tracking-tight">
                                    {page.heroTitle || primaryProduct?.name || page.title}
                                </h1>
                                {/* Violet underline accent */}
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="h-1 w-16 rounded-full bg-violet-600" />
                                    <div className="h-1 w-4 rounded-full bg-rose-500" />
                                </div>
                            </div>

                            {page.heroDescription && (
                                <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-lg">{page.heroDescription}</p>
                            )}

                            {/* Countdown */}
                            {page.countdownEnd && (
                                <div className="bg-zinc-950 rounded-2xl px-5 py-4 self-start">
                                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">অফার শেষ হচ্ছে</p>
                                    <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />
                                </div>
                            )}

                            {/* Price block */}
                            <div className="flex items-center flex-wrap gap-4">
                                {effectivePrice > 0 ? (
                                    <>
                                        <span className="text-5xl font-black text-zinc-950">{formatPrice(effectivePrice)}</span>
                                        {discount && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xl text-zinc-400 line-through">{formatPrice(originalPrice)}</span>
                                                <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full self-start">{discount}% ছাড়!</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-zinc-500 text-lg font-semibold">মূল্য জানতে অর্ডার করুন</span>
                                )}
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a href="#order-form"
                                    className="cta-glow inline-flex items-center justify-center gap-2.5 font-black text-base px-8 py-4 rounded-2xl text-white transition-all duration-300 hover:scale-[1.03] hover:brightness-110"
                                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    WhatsApp-এ অর্ডার করুন
                                </a>
                                {primaryProduct && (
                                    <Link href={`/checkout/express/${primaryProduct.id}`}
                                        className="inline-flex items-center justify-center gap-2 font-black text-base px-8 py-4 rounded-2xl border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-950 hover:text-white transition-all duration-300">
                                        🛒 সরাসরি কিনুন
                                    </Link>
                                )}
                            </div>

                            {/* Trust row */}
                            <div className="flex flex-wrap gap-3 pt-1">
                                {["✅ ক্যাশ অন ডেলিভারি", "🔒 অরিজিনাল গ্যারান্টি", "🔄 সহজ রিটার্ন"].map((t) => (
                                    <span key={t} className="text-xs text-zinc-500 border border-zinc-200 rounded-full px-3 py-1.5 font-medium bg-zinc-50">{t}</span>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT — Product image with floating feature badges */}
                        <div className="order-1 md:order-2 relative flex items-center justify-center">
                            <div className="relative w-full max-w-[440px] mx-auto">
                                {/* Soft shadow blob behind card */}
                                <div className="absolute inset-8 rounded-3xl blur-3xl opacity-20"
                                    style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899, #f59e0b)" }} />

                                {/* Main product card */}
                                <div className="relative rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-[0_30px_80px_rgba(0,0,0,0.12)] aspect-square bg-white">
                                    {heroImg ? (
                                        <Image src={heroImg} alt={primaryProduct?.name || page.title} fill priority className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-7xl bg-zinc-50">📦</div>
                                    )}
                                    {/* Glossy top glare */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                                </div>

                                {/* Floating feature badges — desktop only */}
                                {floatBadges[0] && (
                                    <div className={`badge-float hidden md:flex absolute ${floatBadges[0].pos} items-center gap-2 bg-white border border-zinc-100 shadow-xl rounded-2xl px-3.5 py-2.5 z-20`}>
                                        <span className="text-xl">{floatBadges[0].icon}</span>
                                        <span className="text-xs font-black text-zinc-900 whitespace-nowrap">{floatBadges[0].title}</span>
                                    </div>
                                )}
                                {floatBadges[1] && (
                                    <div className={`badge-float-2 hidden md:flex absolute ${floatBadges[1].pos} items-center gap-2 bg-violet-600 shadow-xl shadow-violet-200 rounded-2xl px-3.5 py-2.5 z-20`}>
                                        <span className="text-xl">{floatBadges[1].icon}</span>
                                        <span className="text-xs font-black text-white whitespace-nowrap">{floatBadges[1].title}</span>
                                    </div>
                                )}
                                {floatBadges[2] && (
                                    <div className={`badge-float-3 hidden md:flex absolute ${floatBadges[2].pos} items-center gap-2 bg-white border border-zinc-100 shadow-xl rounded-2xl px-3.5 py-2.5 z-20`}>
                                        <span className="text-xl">{floatBadges[2].icon}</span>
                                        <span className="text-xs font-black text-zinc-900 whitespace-nowrap">{floatBadges[2].title}</span>
                                    </div>
                                )}
                                {floatBadges[3] && (
                                    <div className={`badge-float-4 hidden md:flex absolute ${floatBadges[3].pos} items-center gap-2 bg-zinc-950 rounded-2xl px-3.5 py-2.5 z-20`}>
                                        <span className="text-xl">{floatBadges[3].icon}</span>
                                        <span className="text-xs font-black text-white whitespace-nowrap">{floatBadges[3].title}</span>
                                    </div>
                                )}

                                {/* Discount badge */}
                                {discount && (
                                    <div className="absolute -top-4 -right-4 z-30 w-[68px] h-[68px] rounded-full border-4 border-white shadow-lg bg-rose-600 flex flex-col items-center justify-center">
                                        <span className="text-white font-black text-base leading-none">{discount}%</span>
                                        <span className="text-white/80 text-[9px] font-semibold">ছাড়</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-400 text-xs">
                        <div className="w-5 h-8 border-2 border-zinc-300 rounded-full flex items-start justify-center pt-1.5">
                            <div className="w-1 h-1.5 bg-zinc-400 rounded-full" style={{ animation: "float-badge 1.5s ease-in-out infinite" }} />
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    STATS BAR — Dark strip
                ══════════════════════════════════════════ */}
                <div className="bg-zinc-950 text-white py-10">
                    <div className="max-w-5xl mx-auto px-5 grid grid-cols-3 gap-4 divide-x divide-white/10">
                        {[
                            { num: "৫০০০+", label: "সন্তুষ্ট কাস্টমার" },
                            { num: "⭐ ৪.৯", label: "গড় রেটিং" },
                            { num: "২৪ঘণ্টা", label: "সাপোর্ট সার্ভিস" },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center text-center px-4">
                                <span className="text-3xl md:text-4xl font-black text-white">{s.num}</span>
                                <span className="text-zinc-400 text-xs md:text-sm mt-1 font-medium">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    FEATURES — Asymmetric Bento Grid
                ══════════════════════════════════════════ */}
                <section className="py-20 bg-white">
                    <div className="max-w-5xl mx-auto px-5 md:px-12">
                        <div className="text-center mb-14">
                            <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-4">কেন বেছে নেবেন</span>
                            <h2 className="text-3xl md:text-4xl font-black text-zinc-950">আমাদের প্রতিশ্রুতি</h2>
                        </div>

                        {/* Bento: 1 large + 3 small */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Large card */}
                            <div className="col-span-2 md:col-span-1 row-span-2 bg-violet-600 rounded-3xl p-8 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
                                <div className="absolute -bottom-8 -right-8 text-[120px] opacity-10 select-none">{featureList[0]?.icon || "🚚"}</div>
                                <span className="text-5xl">{featureList[0]?.icon || "🚚"}</span>
                                <div>
                                    <h3 className="text-white font-black text-xl mb-2">{featureList[0]?.title || "ক্যাশ অন ডেলিভারি"}</h3>
                                    <p className="text-violet-200 text-sm">{featureList[0]?.desc || "পণ্য হাতে পেয়ে পেমেন্ট করুন"}</p>
                                </div>
                            </div>
                            {featureList.slice(1).map((f, i) => (
                                <div key={i}
                                    className={`rounded-3xl p-6 flex flex-col gap-3 border ${i === 1 ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-100"}`}>
                                    <span className="text-3xl">{f.icon}</span>
                                    <div>
                                        <h3 className={`font-black text-base mb-1 ${i === 1 ? "text-white" : "text-zinc-900"}`}>{f.title}</h3>
                                        <p className={`text-xs leading-relaxed ${i === 1 ? "text-zinc-400" : "text-zinc-500"}`}>{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    PRODUCT DETAIL — Diagonal section
                ══════════════════════════════════════════ */}
                {primaryProduct && (
                    <section className="relative py-20 overflow-hidden" style={{ background: "#fafaf9" }}>
                        {/* Top diagonal */}
                        <div className="absolute top-0 left-0 right-0 h-16 bg-white"
                            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 0)" }} />

                        <div className="max-w-5xl mx-auto px-5 md:px-12 relative">
                            <div className="text-center mb-14">
                                <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-zinc-500 mb-3">পণ্যের বিবরণ</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">{primaryProduct.name}</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-10 items-start">
                                <div className="rounded-3xl overflow-hidden border border-zinc-200 shadow-sm bg-white">
                                    <LandingPageGallery images={productImages} productName={primaryProduct.name} />
                                </div>
                                <div className="space-y-6 pt-2">
                                    {effectivePrice > 0 && (
                                        <div className="flex items-end flex-wrap gap-3">
                                            <span className="text-4xl font-black text-zinc-950">{formatPrice(effectivePrice)}</span>
                                            {discount && <span className="text-xl text-zinc-400 line-through mb-1">{formatPrice(originalPrice)}</span>}
                                            {discount && <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">{discount}% OFF</span>}
                                        </div>
                                    )}
                                    {primaryProduct.description && (
                                        <div className="text-zinc-600 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-zinc-900 [&_p]:mb-2 overflow-x-auto"
                                            dangerouslySetInnerHTML={{ __html: primaryProduct.description }} />
                                    )}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { e: "🚚", t: "ঢাকায়", v: "৭০ টাকা" },
                                            { e: "📦", t: "সারাদেশে", v: "১৩০ টাকা" },
                                            { e: "⏰", t: "ডেলিভারি", v: "১-৫ দিন" },
                                            { e: "💳", t: "পেমেন্ট", v: "ক্যাশ অন ডেলিভারি" },
                                        ].map((x) => (
                                            <div key={x.t} className="flex items-center gap-2.5 bg-white rounded-2xl border border-zinc-100 px-4 py-3 shadow-sm">
                                                <span className="text-base">{x.e}</span>
                                                <div>
                                                    <p className="text-zinc-400 text-[10px] font-medium">{x.t}</p>
                                                    <p className="text-zinc-900 text-xs font-black">{x.v}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <a href="#order-form"
                                        className="block w-full text-center text-white font-black text-base py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-md"
                                        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
                                        📲 WhatsApp-এ অর্ডার করুন
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Bottom diagonal */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-white"
                            style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
                    </section>
                )}

                {/* ══════════════════════════════════════════
                    REVIEWS — Staggered cards on white
                ══════════════════════════════════════════ */}
                {page.showTestimonials && (
                    <section className="py-20 bg-white">
                        <div className="max-w-5xl mx-auto px-5 md:px-12">
                            <div className="text-center mb-16">
                                <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 mb-4">কাস্টমার রিভিউ</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">তারা কী বলেন?</h2>
                                <div className="flex items-center justify-center gap-1 mt-3">
                                    {"★★★★★".split("").map((s, i) => <span key={i} className="text-amber-400 text-2xl">{s}</span>)}
                                    <span className="text-zinc-400 text-sm ml-2 font-medium">৫.০ / ৫.০</span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-5 items-start">
                                {testimonials.map((r, i) => (
                                    <div key={i}
                                        className={`rounded-3xl p-6 flex flex-col gap-4 border ${i === 1 ? "bg-violet-600 border-violet-500 md:-mt-4 md:mb-4 shadow-xl shadow-violet-200" : "bg-white border-zinc-100 shadow-sm"}`}>
                                        <div className="flex text-amber-400 text-lg">
                                            {"★".repeat(Math.min(5, r.rating || 5))}
                                        </div>
                                        <p className={`text-sm leading-relaxed flex-1 ${i === 1 ? "text-violet-100" : "text-zinc-600"}`}>
                                            "{r.text}"
                                        </p>
                                        <div className={`flex items-center gap-3 pt-3 border-t ${i === 1 ? "border-violet-500/40" : "border-zinc-100"}`}>
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white`}
                                                style={{ background: i === 1 ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                                                {r.name?.[0] || "?"}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black ${i === 1 ? "text-white" : "text-zinc-900"}`}>{r.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${i === 1 ? "bg-violet-500/30 text-violet-100" : "bg-green-50 text-green-700 border border-green-200"}`}>
                                                        ✅ যাচাইকৃত ক্রেতা
                                                    </span>
                                                    <span className={`text-[10px] ${i === 1 ? "text-violet-300" : "text-zinc-400"}`}>{r.city}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══════════════════════════════════════════
                    WHATSAPP ORDER FORM — Unique chat-style
                ══════════════════════════════════════════ */}
                <section id="order-form" className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)" }}>
                    {/* Top slash */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-white"
                        style={{ clipPath: "polygon(0 0, 100% 0, 100% 0, 0 100%)" }} />

                    <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-12 grid md:grid-cols-2 gap-12 items-center">
                        {/* Left — Copy */}
                        <div className="space-y-6">
                            <div>
                                <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 mb-4">সরাসরি অর্ডার</span>
                                <h2 className="text-3xl md:text-4xl font-black text-zinc-950 leading-tight">
                                    WhatsApp-এ<br />
                                    <span className="text-violet-600">১ মিনিটে</span> অর্ডার করুন
                                </h2>
                            </div>
                            <p className="text-zinc-500 text-base leading-relaxed">
                                ফর্ম পূরণ করুন — বাটন চাপলেই সম্পূর্ণ অর্ডার মেসেজ সহ WhatsApp খুলে যাবে। আলাদা কিছু লিখতে হবে না।
                            </p>

                            {/* Steps */}
                            <div className="space-y-4">
                                {[
                                    { n: "১", t: "ফর্ম পূরণ করুন", d: "নাম, ফোন ও ঠিকানা দিন" },
                                    { n: "২", t: "বাটনে ক্লিক করুন", d: "WhatsApp আপনাআপনি খুলবে" },
                                    { n: "৩", t: "মেসেজ পাঠান", d: "একটি ক্লিকেই কনফার্ম!" },
                                ].map((s) => (
                                    <div key={s.n} className="flex items-start gap-4">
                                        <div className="w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 text-violet-700 bg-violet-100 border border-violet-200">{s.n}</div>
                                        <div>
                                            <p className="font-black text-zinc-900 text-sm">{s.t}</p>
                                            <p className="text-zinc-500 text-xs mt-0.5">{s.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Product mini card */}
                            {primaryProduct && heroImg && (
                                <div className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                                        <Image src={heroImg} alt={primaryProduct.name} width={64} height={64} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-zinc-900 font-black text-sm line-clamp-1">{primaryProduct.name}</p>
                                        <p className="text-violet-600 font-black text-base mt-0.5">{effectivePrice > 0 ? formatPrice(effectivePrice) : "দাম জিজ্ঞেস করুন"}</p>
                                        {discount && <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-black">{discount}% ছাড়</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — Form */}
                        <div className="bg-white rounded-3xl border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 md:p-8">
                            <WhatsAppOrderForm
                                productName={primaryProduct?.name || page.title}
                                productPrice={effectivePrice}
                                productImage={heroImg}
                                waNumber={waNumber}
                                theme="light"
                            />
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════
                    BOTTOM CTA
                ══════════════════════════════════════════ */}
                <section className="bg-zinc-950 py-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05]"
                        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                    <div className="relative z-10 max-w-xl mx-auto px-5">
                        <p className="text-5xl mb-4">⚡</p>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-3">এখনই সুযোগ নিন!</h2>
                        <p className="text-zinc-400 mb-8 text-sm">Stock সীমিত — দেরি হলে পাবেন না</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="#order-form"
                                className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-10 py-4 rounded-2xl transition-all hover:scale-105 shadow-2xl"
                                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
                                📲 WhatsApp-এ অর্ডার করুন
                            </a>
                            {primaryProduct && (
                                <Link href={`/checkout/express/${primaryProduct.id}`}
                                    className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/8 transition-all">
                                    🛒 সরাসরি কিনুন
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── FOOTER ── */}
                <footer className="py-6 border-t border-zinc-100 text-center text-xs text-zinc-400 bg-white">
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
