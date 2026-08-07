// app/lp/[slug]/page.js — Ultra Premium White LP v5
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
    const productImages = primaryProduct?.productImages?.map((i) => i.url).filter(Boolean).length > 0 ? primaryProduct.productImages.map((i) => i.url).filter(Boolean) : heroImg ? [heroImg] : [];
    const effectivePrice = primaryProduct?.salePrice ?? primaryProduct?.price ?? 0;
    const originalPrice = primaryProduct?.price ?? 0;
    const discount = effectivePrice && originalPrice && originalPrice > effectivePrice ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : null;

    let testimonials = [
        { name: "রাফসান আহমেদ", text: "প্রোডাক্টটা একদম অসাধারণ! দ্রুত ডেলিভারি এবং কোয়ালিটি দেখে মুগ্ধ। ১০০% রেকমেন্ড।", rating: 5, city: "ঢাকা" },
        { name: "নাফিসা আক্তার", text: "এত কম দামে এই কোয়ালিটি আর পাইনি। Authentic Bazar সত্যিই বিশ্বস্ত।", rating: 5, city: "চট্টগ্রাম" },
        { name: "শাকিল ইসলাম", text: "প্যাকেজিং সুন্দর, পণ্য আসল। ক্যাশ অন ডেলিভারিতে পেয়েছি — ভরসা করা যায়।", rating: 5, city: "সিলেট" },
    ];
    if (page.testimonialsJson) { try { const p = JSON.parse(page.testimonialsJson); if (Array.isArray(p) && p.length > 0) testimonials = p; } catch { } }

    let featureList = [
        { icon: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পেয়ে পেমেন্ট", color: "#7c3aed" },
        { icon: "✅", title: "১০০% অরিজিনাল", desc: "সম্পূর্ণ নিশ্চিত মানের পণ্য", color: "#059669" },
        { icon: "🔄", title: "সহজ রিটার্ন", desc: "সমস্যা হলে ফেরত নেওয়া হবে", color: "#2563eb" },
        { icon: "⚡", title: "দ্রুত ডেলিভারি", desc: "ঢাকায় ১-২ দিন, বাইরে ৩-৫ দিন", color: "#d97706" },
    ];
    if (page.featuresJson) { try { const f = JSON.parse(page.featuresJson); if (Array.isArray(f) && f.length > 0) featureList = f.map((x, i) => ({ ...x, color: ["#7c3aed","#059669","#2563eb","#d97706"][i % 4] })); } catch { } }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap');
                .lp-v5 { font-family: 'Inter', -apple-system, sans-serif; }

                /* Ticker */
                @keyframes lp-tick { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
                .lp-ticker { animation: lp-tick 22s linear infinite; display:flex; width:max-content; gap:3rem; }

                /* Float badges */
                @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                .lp-float-1 { animation: lp-float 3s ease-in-out infinite; }
                .lp-float-2 { animation: lp-float 3.7s ease-in-out 0.6s infinite; }
                .lp-float-3 { animation: lp-float 4.1s ease-in-out 1.2s infinite; }
                .lp-float-4 { animation: lp-float 3.4s ease-in-out 1.8s infinite; }

                /* Shimmer on CTA */
                @keyframes lp-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
                .lp-shimmer-btn { position:relative; overflow:hidden; }
                .lp-shimmer-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%); transform:translateX(-100%); animation:lp-shimmer 2.8s ease-in-out infinite; }

                /* Gradient border card */
                @keyframes lp-border-spin { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
                .lp-grad-border { position:relative; background:white; z-index:0; }
                .lp-grad-border::before { content:''; position:absolute; inset:-2px; border-radius:inherit; background:linear-gradient(135deg, #7c3aed, #3b82f6, #10b981, #f59e0b, #ef4444, #7c3aed); background-size:300% 300%; animation:lp-border-spin 4s linear infinite; z-index:-1; opacity:0; border-radius:24px; transition:opacity 0.3s; }
                .lp-grad-border:hover::before { opacity:1; }

                /* Pulse ring on CTA */
                @keyframes lp-pulse-ring { 0%{transform:scale(1); opacity:0.6} 100%{transform:scale(1.4); opacity:0} }
                .lp-pulse-ring::before { content:''; position:absolute; inset:-6px; border-radius:inherit; border:2px solid #7c3aed; animation:lp-pulse-ring 2s ease-out infinite; }

                /* Number count animation (CSS only) */
                .lp-stat-num { display:inline-block; }

                /* Scroll-reveal shimmer text */
                .lp-headline-line { display:inline-block; }

                /* Feature card hover lift */
                .lp-feat-card { transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease; }
                .lp-feat-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 24px 60px rgba(0,0,0,0.10); }

                /* Review card hover */
                .lp-review-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
                .lp-review-card:hover { transform: translateY(-4px); }

                /* CTA button hover */
                .lp-btn-wa:hover { transform: translateY(-2px) scale(1.03); }
                .lp-btn-wa { transition: all 0.25s cubic-bezier(.34,1.56,.64,1); }

                /* Mobile feature strip scroll */
                @media (max-width: 768px) {
                    .lp-feat-strip { display: flex; overflow-x: auto; gap: 12px; padding-bottom: 8px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
                    .lp-feat-strip::-webkit-scrollbar { display: none; }
                    .lp-feat-strip-item { flex: 0 0 200px; scroll-snap-align: start; }
                }
                @media (min-width: 769px) {
                    .lp-feat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                }

                /* Diagonal clip paths */
                .lp-clip-top { clip-path: polygon(0 5%, 100% 0%, 100% 100%, 0% 100%); margin-top: -40px; padding-top: 70px; }
                .lp-clip-bottom { clip-path: polygon(0 0%, 100% 0%, 100% 95%, 0% 100%); padding-bottom: 70px; }

                /* Delivery grid unique style */
                .lp-del-card { position:relative; overflow:hidden; }
                .lp-del-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
                .lp-del-card-1::after { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
                .lp-del-card-2::after { background: linear-gradient(90deg, #059669, #34d399); }
                .lp-del-card-3::after { background: linear-gradient(90deg, #2563eb, #60a5fa); }
                .lp-del-card-4::after { background: linear-gradient(90deg, #d97706, #fcd34d); }

                /* Testimonial special center card */
                .lp-review-center { position: relative; }
                .lp-review-center::before { content: '"'; position: absolute; top: -10px; left: 16px; font-size: 80px; line-height: 1; color: rgba(124,58,237,0.15); font-family: Georgia, serif; }
            `}</style>

            <div className="lp-v5 min-h-screen bg-white overflow-x-hidden">

                {/* ══ TICKER ══ */}
                <div className="bg-zinc-950 py-2.5 overflow-hidden">
                    <div className="lp-ticker text-[11px] font-semibold tracking-widest text-zinc-400">
                        {[...Array(10)].map((_, i) => (
                            <span key={i} className="flex items-center gap-10 shrink-0">
                                <span className="flex items-center gap-2"><span>⚡</span> সীমিত সময়ের অফার</span>
                                <span className="text-violet-500">◆</span>
                                <span className="flex items-center gap-2"><span>🚚</span> ক্যাশ অন ডেলিভারি</span>
                                <span className="text-violet-500">◆</span>
                                <span className="flex items-center gap-2"><span>✅</span> ১০০% অরিজিনাল গ্যারান্টি</span>
                                <span className="text-violet-500">◆</span>
                                <span className="flex items-center gap-2"><span>📦</span> সারাদেশে দ্রুত ডেলিভারি</span>
                                <span className="text-violet-500">◆</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* ══ HERO ══ */}
                <section className="relative bg-white overflow-hidden">
                    {/* Background: Abstract mesh blobs on white */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.07]"
                            style={{ background: "conic-gradient(from 0deg, #7c3aed, #3b82f6, #10b981, #f59e0b, #7c3aed)" }} />
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[80px] opacity-[0.06]"
                            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
                        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[80px] opacity-[0.05]"
                            style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)" }} />
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-12 py-20 md:py-28 grid md:grid-cols-[1fr_460px] lg:grid-cols-[1fr_500px] gap-12 md:gap-20 items-center min-h-[92vh]">

                        {/* LEFT */}
                        <div className="flex flex-col gap-7 order-2 md:order-1">
                            {page.countdownEnd && (
                                <div className="inline-flex self-start items-center gap-2 border border-violet-200 bg-violet-50 rounded-full px-4 py-1.5">
                                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse inline-block" />
                                    <span className="text-violet-700 text-[11px] font-black tracking-[0.2em] uppercase">Flash Deal সক্রিয়</span>
                                </div>
                            )}
                            {page.discountCode && (
                                <div className="inline-flex self-start items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                                    <span className="text-amber-600">🎁</span>
                                    <span className="text-amber-800 text-sm font-black">কুপন কোড:</span>
                                    <code className="bg-amber-100 border border-amber-300 text-amber-900 font-mono font-black text-sm px-2.5 py-0.5 rounded-lg">{page.discountCode}</code>
                                </div>
                            )}

                            <div>
                                <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black text-zinc-950 leading-[1.07] tracking-tight">
                                    {page.heroTitle || primaryProduct?.name || page.title}
                                </h1>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className="h-[3px] w-20 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #3b82f6)" }} />
                                    <div className="h-[3px] w-6 rounded-full bg-rose-500" />
                                    <div className="h-[3px] w-2 rounded-full bg-amber-400" />
                                </div>
                            </div>

                            {page.heroDescription && (
                                <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-lg">{page.heroDescription}</p>
                            )}

                            {page.countdownEnd && (
                                <div className="self-start bg-zinc-950 rounded-2xl px-5 py-4 border border-zinc-800">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">⏱ অফার শেষ হচ্ছে</p>
                                    <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />
                                </div>
                            )}

                            {/* Price */}
                            <div className="flex items-end flex-wrap gap-4">
                                {effectivePrice > 0 ? (
                                    <>
                                        <span className="text-5xl md:text-6xl font-black text-zinc-950 tabular-nums">{formatPrice(effectivePrice)}</span>
                                        {discount && (
                                            <div className="flex flex-col gap-1.5 mb-1">
                                                <span className="text-2xl text-zinc-400 line-through tabular-nums">{formatPrice(originalPrice)}</span>
                                                <span className="text-xs font-black text-white bg-rose-600 px-3 py-1 rounded-full self-start">{discount}% ছাড়!</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-zinc-500 text-lg font-semibold">মূল্য জানতে অর্ডার করুন</span>
                                )}
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <a href="#order-form"
                                    className="lp-shimmer-btn lp-btn-wa lp-pulse-ring relative inline-flex items-center justify-center gap-2.5 font-black text-base px-8 py-4 rounded-2xl text-white shadow-xl"
                                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 12px 35px rgba(124,58,237,0.35)" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    WhatsApp-এ অর্ডার করুন
                                </a>
                                {primaryProduct && (
                                    <Link href={`/checkout/express/${primaryProduct.id}`}
                                        className="lp-btn-wa inline-flex items-center justify-center gap-2 font-black text-base px-8 py-4 rounded-2xl border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-950 hover:text-white">
                                        🛒 সরাসরি কিনুন
                                    </Link>
                                )}
                            </div>

                            {/* Trust strip */}
                            <div className="flex flex-wrap gap-2">
                                {featureList.map((f) => (
                                    <span key={f.title} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-full px-3 py-1.5">
                                        <span>{f.icon}</span> {f.title}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT — Product with floating badges */}
                        <div className="order-1 md:order-2 relative flex items-center justify-center">
                            <div className="relative w-full max-w-[420px] mx-auto">
                                {/* Glow blob */}
                                <div className="absolute inset-6 rounded-[2rem] blur-[50px] opacity-25"
                                    style={{ background: "linear-gradient(135deg,#7c3aed,#3b82f6,#10b981)" }} />

                                {/* Product card with gradient border */}
                                <div className="lp-grad-border relative rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-[0_32px_90px_rgba(0,0,0,0.13)] aspect-square bg-white">
                                    {heroImg ? (
                                        <Image src={heroImg} alt={primaryProduct?.name || page.title} fill priority className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-7xl bg-zinc-50">📦</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5 pointer-events-none" />
                                </div>

                                {/* Floating badges */}
                                {featureList[0] && (
                                    <div className="lp-float-1 hidden md:flex absolute -left-6 top-12 items-center gap-2.5 bg-white border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.1)] rounded-2xl px-4 py-2.5 z-20">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${featureList[0].color}15` }}>
                                            {featureList[0].icon}
                                        </div>
                                        <div>
                                            <p className="text-zinc-900 font-black text-xs">{featureList[0].title}</p>
                                            <p className="text-zinc-400 text-[10px]">{featureList[0].desc}</p>
                                        </div>
                                    </div>
                                )}
                                {featureList[1] && (
                                    <div className="lp-float-2 hidden md:flex absolute -right-6 top-8 items-center gap-2.5 rounded-2xl px-4 py-2.5 z-20 shadow-xl" style={{ background: featureList[1].color }}>
                                        <span className="text-xl">{featureList[1].icon}</span>
                                        <div>
                                            <p className="text-white font-black text-xs">{featureList[1].title}</p>
                                            <p className="text-white/70 text-[10px]">{featureList[1].desc}</p>
                                        </div>
                                    </div>
                                )}
                                {featureList[2] && (
                                    <div className="lp-float-3 hidden md:flex absolute -left-6 bottom-16 items-center gap-2.5 bg-zinc-950 rounded-2xl px-4 py-2.5 z-20 shadow-lg">
                                        <span className="text-xl">{featureList[2].icon}</span>
                                        <div>
                                            <p className="text-white font-black text-xs">{featureList[2].title}</p>
                                            <p className="text-zinc-400 text-[10px]">{featureList[2].desc}</p>
                                        </div>
                                    </div>
                                )}
                                {featureList[3] && (
                                    <div className="lp-float-4 hidden md:flex absolute -right-6 bottom-12 items-center gap-2.5 bg-white border border-zinc-100 shadow-[0_8px_30px_rgba(0,0,0,0.1)] rounded-2xl px-4 py-2.5 z-20">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${featureList[3].color}15` }}>
                                            {featureList[3].icon}
                                        </div>
                                        <div>
                                            <p className="text-zinc-900 font-black text-xs">{featureList[3].title}</p>
                                            <p className="text-zinc-400 text-[10px]">{featureList[3].desc}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Discount badge */}
                                {discount && (
                                    <div className="absolute -top-4 -right-3 z-30 w-[70px] h-[70px] rounded-full flex flex-col items-center justify-center border-[3px] border-white shadow-lg"
                                        style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                                        <span className="text-white font-black text-base leading-none">{discount}%</span>
                                        <span className="text-white/80 text-[9px] font-bold tracking-wide">ছাড়</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ STATS BAR — glassy on zinc-950 ══ */}
                <div className="bg-zinc-950 py-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                    <div className="relative max-w-5xl mx-auto px-5 grid grid-cols-3 gap-4">
                        {[
                            { n: "৫০০০+", l: "সন্তুষ্ট কাস্টমার", c: "#a78bfa" },
                            { n: "⭐ ৪.৯", l: "গড় রেটিং", c: "#fbbf24" },
                            { n: "২৪ঘণ্টা", l: "সাপোর্ট সার্ভিস", c: "#34d399" },
                        ].map((s, i) => (
                            <div key={i} className="flex flex-col items-center text-center px-4 py-2">
                                <span className="text-3xl md:text-4xl font-black" style={{ color: s.c }}>{s.n}</span>
                                <span className="text-zinc-400 text-xs md:text-sm mt-1.5 font-medium">{s.l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══ FEATURES — horizontal scrollable on mobile, grid on desktop ══ */}
                <section className="py-20 bg-white">
                    <div className="max-w-5xl mx-auto px-5 md:px-12">
                        <div className="text-center mb-12">
                            <span className="inline-block text-[11px] font-black tracking-[0.3em] uppercase bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-4 py-1.5 mb-4">আমাদের প্রতিশ্রুতি</span>
                            <h2 className="text-3xl md:text-4xl font-black text-zinc-950">কেন আমাদের বেছে নেবেন?</h2>
                        </div>
                        <div className="lp-feat-strip">
                            {featureList.map((f, i) => (
                                <div key={i}
                                    className="lp-feat-card lp-grad-border lp-feat-strip-item relative rounded-3xl border border-zinc-100 bg-white p-6 flex flex-col gap-4 cursor-default shadow-sm">
                                    {/* Top accent line */}
                                    <div className="absolute top-0 left-6 right-6 h-[3px] rounded-b-full" style={{ background: `linear-gradient(90deg, ${f.color}, ${f.color}88)` }} />
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${f.color}12`, border: `1.5px solid ${f.color}20` }}>
                                        {f.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-zinc-900 text-base mb-1">{f.title}</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                                    </div>
                                    <div className="mt-auto pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: f.color }}>গ্যারান্টিড</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ PRODUCT DETAIL ══ */}
                {primaryProduct && (
                    <section className="py-20 relative" style={{ background: "linear-gradient(180deg, #fafaff 0%, #f5f5ff 100%)" }}>
                        <div className="max-w-5xl mx-auto px-5 md:px-12">
                            <div className="text-center mb-14">
                                <span className="inline-block text-[11px] font-black tracking-[0.3em] uppercase bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-4 py-1.5 mb-4">পণ্যের বিবরণ</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950 max-w-2xl mx-auto">{primaryProduct.name}</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-10 items-start">
                                <div className="rounded-3xl overflow-hidden border border-violet-100 shadow-[0_20px_60px_rgba(124,58,237,0.08)] bg-white">
                                    <LandingPageGallery images={productImages} productName={primaryProduct.name} />
                                </div>
                                <div className="space-y-6">
                                    {effectivePrice > 0 && (
                                        <div className="flex items-end flex-wrap gap-3">
                                            <span className="text-5xl font-black text-zinc-950 tabular-nums">{formatPrice(effectivePrice)}</span>
                                            {discount && <><span className="text-2xl text-zinc-400 line-through mb-1 tabular-nums">{formatPrice(originalPrice)}</span><span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">{discount}% OFF</span></>}
                                        </div>
                                    )}
                                    {primaryProduct.description && (
                                        <div className="text-zinc-600 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-zinc-900 [&_p]:mb-2 overflow-x-auto"
                                            dangerouslySetInnerHTML={{ __html: primaryProduct.description }} />
                                    )}

                                    {/* Delivery grid — unique top-accent cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { e: "🚚", t: "ঢাকায়", v: "৭০ টাকা", cls: "lp-del-card-1" },
                                            { e: "📦", t: "সারাদেশে", v: "১৩০ টাকা", cls: "lp-del-card-2" },
                                            { e: "⏰", t: "ডেলিভারি", v: "১-৫ কার্যদিবস", cls: "lp-del-card-3" },
                                            { e: "💳", t: "পেমেন্ট", v: "ক্যাশ অন ডেলিভারি", cls: "lp-del-card-4" },
                                        ].map((x) => (
                                            <div key={x.t} className={`lp-del-card ${x.cls} bg-white rounded-2xl border border-zinc-100 px-4 py-3.5 flex items-center gap-3 shadow-sm`}>
                                                <span className="text-xl">{x.e}</span>
                                                <div>
                                                    <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{x.t}</p>
                                                    <p className="text-zinc-900 text-sm font-black">{x.v}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <a href="#order-form"
                                        className="lp-shimmer-btn lp-btn-wa block w-full text-center text-white font-black text-base py-4 rounded-2xl shadow-lg"
                                        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 10px 30px rgba(124,58,237,0.3)" }}>
                                        📲 WhatsApp-এ অর্ডার করুন
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ REVIEWS ══ */}
                {page.showTestimonials && (
                    <section className="py-20 bg-white">
                        <div className="max-w-5xl mx-auto px-5 md:px-12">
                            <div className="text-center mb-14">
                                <span className="inline-block text-[11px] font-black tracking-[0.3em] uppercase bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-4 py-1.5 mb-4">কাস্টমার রিভিউ</span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950 mb-3">তারা কী বলেন?</h2>
                                <div className="flex items-center justify-center gap-1">
                                    {"★★★★★".split("").map((s, i) => <span key={i} className="text-amber-400 text-2xl">{s}</span>)}
                                    <span className="text-zinc-400 text-sm ml-2 font-medium">৫.০ / ৫.০</span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-5 items-start">
                                {testimonials.map((r, i) => {
                                    const isCenter = i === 1;
                                    return (
                                        <div key={i}
                                            className={`lp-review-card rounded-3xl p-6 flex flex-col gap-4 ${isCenter
                                                ? "lp-review-center md:-mt-6 shadow-2xl shadow-violet-100 border border-violet-200"
                                                : "border border-zinc-100 shadow-sm bg-white"
                                            }`}
                                            style={isCenter ? { background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" } : {}}>
                                            <div className="flex text-amber-400 text-lg">
                                                {"★".repeat(Math.min(5, r.rating || 5))}
                                            </div>
                                            <p className={`text-sm leading-relaxed flex-1 ${isCenter ? "text-violet-100" : "text-zinc-600"}`}>
                                                "{r.text}"
                                            </p>
                                            <div className={`flex items-center gap-3 pt-3 border-t ${isCenter ? "border-violet-500/30" : "border-zinc-100"}`}>
                                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white"
                                                    style={{ background: isCenter ? "rgba(255,255,255,0.2)" : `linear-gradient(135deg, #7c3aed, #3b82f6)` }}>
                                                    {r.name?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black ${isCenter ? "text-white" : "text-zinc-900"}`}>{r.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCenter ? "bg-white/15 text-white/80" : "bg-green-50 text-green-700 border border-green-200"}`}>✅ যাচাইকৃত</span>
                                                        {r.city && <span className={`text-[10px] ${isCenter ? "text-violet-300" : "text-zinc-400"}`}>{r.city}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ WHATSAPP FORM ══ */}
                <section id="order-form" className="py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #fafaff 0%, #ffffff 100%)" }}>
                    {/* Decorative circles */}
                    <div className="absolute top-10 right-10 w-32 h-32 rounded-full border-[20px] border-violet-100 opacity-50 pointer-events-none" />
                    <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full border-[14px] border-violet-100 opacity-40 pointer-events-none" />
                    <div className="absolute top-1/2 left-0 w-1 h-32 bg-gradient-to-b from-violet-400 to-transparent rounded-r-full" />

                    <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-12 grid md:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <div className="space-y-7">
                            <div>
                                <span className="inline-block text-[11px] font-black tracking-[0.3em] uppercase bg-green-50 border border-green-200 text-green-700 rounded-full px-4 py-1.5 mb-4">সরাসরি অর্ডার</span>
                                <h2 className="text-3xl md:text-4xl font-black text-zinc-950 leading-tight">
                                    WhatsApp-এ<br />
                                    <span style={{ backgroundImage: "linear-gradient(135deg,#7c3aed,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                        ১ মিনিটে
                                    </span> অর্ডার করুন
                                </h2>
                            </div>
                            <p className="text-zinc-500 text-base leading-relaxed">ফর্ম পূরণ করুন — বাটন চাপলেই সম্পূর্ণ অর্ডার বার্তা WhatsApp-এ চলে যাবে। আলাদা কিছু লিখতে হবে না।</p>

                            {/* 3 step guide */}
                            <div className="space-y-3">
                                {[
                                    { n: "১", t: "ফর্ম পূরণ করুন", d: "নাম, ফোন ও ঠিকানা লিখুন", c: "#7c3aed" },
                                    { n: "২", t: "বাটনে ক্লিক করুন", d: "WhatsApp আপনাআপনি খুলবে", c: "#2563eb" },
                                    { n: "৩", t: "মেসেজ পাঠান", d: "Send করলেই অর্ডার কনফার্ম!", c: "#059669" },
                                ].map((s) => (
                                    <div key={s.n} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors">
                                        <div className="w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 text-white" style={{ background: `linear-gradient(135deg, ${s.c}, ${s.c}cc)` }}>{s.n}</div>
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
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-100 shrink-0">
                                        <Image src={heroImg} alt={primaryProduct.name} width={64} height={64} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-zinc-900 font-black text-sm line-clamp-1">{primaryProduct.name}</p>
                                        <p className="font-black text-lg mt-0.5" style={{ color: "#7c3aed" }}>{effectivePrice > 0 ? formatPrice(effectivePrice) : "দাম জানুন"}</p>
                                        {discount && <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 rounded-full px-2 py-0.5 font-black">{discount}% ছাড়</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — Form */}
                        <div className="bg-white rounded-3xl border border-zinc-100 shadow-[0_24px_80px_rgba(124,58,237,0.08)] p-6 md:p-8 relative overflow-hidden">
                            {/* Top accent */}
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: "linear-gradient(90deg, #7c3aed, #3b82f6, #10b981)" }} />
                            <p className="font-black text-zinc-900 text-lg mb-5">📝 অর্ডার ফর্ম পূরণ করুন</p>
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

                {/* ══ BOTTOM CTA ══ */}
                <section className="py-20 text-center relative overflow-hidden bg-zinc-950">
                    <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                    <div className="relative z-10 max-w-xl mx-auto px-5">
                        <p className="text-5xl mb-4">⚡</p>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-3">এখনই সুযোগ নিন!</h2>
                        <p className="text-zinc-400 mb-8 text-sm">Stock সীমিত — দেরি করলে পাবেন না</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a href="#order-form"
                                className="lp-shimmer-btn lp-btn-wa inline-flex items-center justify-center gap-2 text-white font-black text-base px-10 py-4 rounded-2xl shadow-2xl"
                                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", boxShadow: "0 12px 35px rgba(124,58,237,0.4)" }}>
                                📲 WhatsApp-এ অর্ডার করুন
                            </a>
                            {primaryProduct && (
                                <Link href={`/checkout/express/${primaryProduct.id}`}
                                    className="lp-btn-wa inline-flex items-center justify-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10">
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
