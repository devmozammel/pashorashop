// app/lp/[slug]/page.js — Premium Unique Landing Page Template v3
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
    } catch {
        return { title: "Landing Page" };
    }
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
                    include: {
                        product: {
                            include: {
                                productImages: { orderBy: { sortOrder: "asc" }, take: 8 },
                                variants: true,
                            },
                        },
                    },
                },
            },
        });
    } catch (err) {
        console.error("[LP] DB Error:", err.message);
        notFound();
    }

    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    // Fetch WhatsApp number from settings
    let waNumber = "8801613134043";
    try {
        const { getDecryptedSettings } = await import("@/lib/settings");
        const s = await getDecryptedSettings();
        if (s?.whatsapp) {
            let clean = s.whatsapp.replace(/\D/g, "");
            if (clean.startsWith("0")) clean = "88" + clean;
            if (!clean.startsWith("88")) clean = "88" + clean;
            waNumber = clean;
        }
    } catch { /* use default */ }

    // Flash sale pricing
    const now = new Date();
    try {
        const ids = allProducts.map((p) => p.id).filter(Boolean);
        const flashItems = await prisma.flashSaleItem.findMany({
            where: {
                productId: { in: ids }, isActive: true,
                flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } }
            }
        });
        const fMap = {};
        flashItems.forEach((i) => { fMap[i.productId] = i.salePrice; });
        allProducts.forEach((p) => { if (fMap[p.id]) { p.salePrice = fMap[p.id]; p.discountPrice = fMap[p.id]; } });
    } catch { /* skip */ }

    const heroImg =
        page.heroImageUrl ||
        primaryProduct?.productImages?.[0]?.url ||
        (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null);

    const productImages =
        primaryProduct?.productImages?.map((i) => i.url).filter(Boolean).length > 0
            ? primaryProduct.productImages.map((i) => i.url).filter(Boolean)
            : heroImg ? [heroImg] : [];

    const effectivePrice = primaryProduct?.salePrice ?? primaryProduct?.price ?? 0;
    const originalPrice = primaryProduct?.price ?? 0;
    const discount = effectivePrice && originalPrice && originalPrice > effectivePrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
        : null;

    let testimonials = [
        { name: "সাকিব হোসেন", text: "প্রোডাক্টটা একদম অসাধারণ! ক্যাশ অন ডেলিভারিতে পেয়েছি, দ্রুত ডেলিভারি পেলাম। কোয়ালিটি দেখে মুগ্ধ।", rating: 5, city: "ঢাকা" },
        { name: "নাফিসা আক্তার", text: "দামে অনেক ভালো মানের পণ্য। যা দেখলাম তাই পেলাম। এরপরেও অর্ডার করব ইনশাআল্লাহ।", rating: 5, city: "চট্টগ্রাম" },
        { name: "রিয়াজুল ইসলাম", text: "প্যাকেজিং সুন্দর ছিল, পণ্যটাও ভালো। Authentic Bazar-কে ধন্যবাদ।", rating: 5, city: "সিলেট" },
    ];
    if (page.testimonialsJson) {
        try {
            const p = JSON.parse(page.testimonialsJson);
            if (Array.isArray(p) && p.length > 0) testimonials = p;
        } catch { /* use default */ }
    }

    const features = page.featuresJson ? (() => {
        try { return JSON.parse(page.featuresJson); } catch { return null; }
    })() : null;

    const defaultFeatures = [
        { icon: "🚚", title: "ক্যাশ অন ডেলিভারি", desc: "পণ্য হাতে পেয়ে পেমেন্ট করুন" },
        { icon: "✅", title: "১০০% অরিজিনাল", desc: "সম্পূর্ণ খাঁটি ও নিশ্চিত মানের পণ্য" },
        { icon: "🔄", title: "সহজ রিটার্ন", desc: "সমস্যা হলে সহজে ফেরত দেওয়া যাবে" },
        { icon: "⚡", title: "দ্রুত ডেলিভারি", desc: "ঢাকায় ১-২ দিন, সারাদেশে ৩-৫ দিন" },
    ];

    const featureList = features || defaultFeatures;

    return (
        <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#0a0a14" }}>

            {/* ══════════════════════════════════════════
                HERO — Split layout, NO faded bg image
                Left: copy | Right: product image (prominent)
            ══════════════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden">

                {/* Background: Animated gradient mesh (NOT a faded product photo) */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Base dark */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0a0a14 0%, #0d0d1f 100%)" }} />
                    {/* Colorful orb 1 — top-left coral/rose */}
                    <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 blur-[120px]"
                        style={{ background: "radial-gradient(circle, #f43f5e 0%, #e11d48 40%, transparent 70%)" }} />
                    {/* Orb 2 — right side electric blue */}
                    <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full opacity-25 blur-[100px]"
                        style={{ background: "radial-gradient(circle, #3b82f6 0%, #6366f1 50%, transparent 70%)" }} />
                    {/* Orb 3 — bottom-center green */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-[120px]"
                        style={{ background: "radial-gradient(circle, #10b981 0%, #059669 40%, transparent 70%)" }} />
                    {/* Grid dots overlay */}
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-10 w-full py-20 md:py-0 grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-screen">

                    {/* LEFT — Text Content */}
                    <div className="flex flex-col justify-center order-2 md:order-1 text-center md:text-left">

                        {/* Limited offer pill */}
                        {page.countdownEnd && (
                            <div className="inline-flex self-center md:self-start items-center gap-2 mb-6 border border-rose-400/30 bg-rose-500/10 backdrop-blur rounded-full px-4 py-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                                <span className="text-rose-300 text-xs font-bold tracking-widest uppercase">সীমিত সময়ের অফার</span>
                            </div>
                        )}

                        {/* Discount badge */}
                        {page.discountCode && (
                            <div className="inline-flex self-center md:self-start items-center gap-2 bg-amber-400 text-gray-900 text-sm font-black px-4 py-1.5 rounded-xl mb-4 tracking-wider">
                                🎁 কুপন: <span className="font-mono border-l border-gray-900/20 pl-2 ml-1">{page.discountCode}</span>
                            </div>
                        )}

                        {/* Main headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.08] mb-5 tracking-tight">
                            {page.heroTitle || primaryProduct?.name || page.title}
                        </h1>

                        {page.heroDescription && (
                            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
                                {page.heroDescription}
                            </p>
                        )}

                        {/* Countdown */}
                        {page.countdownEnd && <div className="mb-6"><LandingPageClient countdownEnd={page.countdownEnd.toISOString()} /></div>}

                        {/* Price block */}
                        {effectivePrice > 0 && (
                            <div className="flex items-end gap-3 flex-wrap mb-8 justify-center md:justify-start">
                                <span className="text-5xl font-black text-white">{formatPrice(effectivePrice)}</span>
                                {discount && (
                                    <>
                                        <span className="text-2xl text-gray-500 line-through mb-1">{formatPrice(originalPrice)}</span>
                                        <span className="mb-1 bg-rose-500 text-white text-sm font-black px-3 py-1 rounded-full">{discount}% ছাড়!</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                            <a href="#order-form"
                                className="inline-flex items-center justify-center gap-2.5 text-white font-black text-base px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
                                style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 8px 30px rgba(37,211,102,0.35)" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                WhatsApp-এ অর্ডার করুন
                            </a>
                            {primaryProduct && (
                                <Link href={`/checkout/express/${primaryProduct.id}`}
                                    className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl border border-white/15 hover:bg-white/10 transition-all duration-300">
                                    🛒 সরাসরি কিনুন
                                </Link>
                            )}
                        </div>

                        {/* Trust pills */}
                        <div className="flex flex-wrap gap-2.5 mt-7 justify-center md:justify-start">
                            {["✅ ক্যাশ অন ডেলিভারি", "🔒 ১০০% অরিজিনাল", "🚚 দ্রুত ডেলিভারি"].map((t) => (
                                <span key={t} className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 font-medium">{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — Product image (Prominent, not faded) */}
                    <div className="order-1 md:order-2 flex items-center justify-center">
                        <div className="relative w-full max-w-sm md:max-w-md">
                            {/* Glow ring behind image */}
                            <div className="absolute inset-0 rounded-3xl blur-[60px] opacity-40"
                                style={{ background: "linear-gradient(135deg, #6366f1, #3b82f6, #10b981)" }} />
                            {/* Image card */}
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm aspect-square">
                                {heroImg ? (
                                    <Image
                                        src={heroImg}
                                        alt={primaryProduct?.name || page.title}
                                        fill
                                        priority
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-7xl bg-white/5">📦</div>
                                )}
                                {/* Subtle gloss overlay on image */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />
                            </div>
                            {/* Floating badge */}
                            {discount && (
                                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-rose-500 border-4 border-[#0a0a14] flex flex-col items-center justify-center shadow-lg">
                                    <span className="text-white font-black text-sm leading-none">{discount}%</span>
                                    <span className="text-white/80 text-[9px] font-bold">ছাড়</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll down hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs flex flex-col items-center gap-1">
                    <span>নিচে দেখুন</span>
                    <span className="animate-bounce">↓</span>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                FEATURES BENTO GRID
            ══════════════════════════════════════════ */}
            <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0a0a14 0%, #0f0f1e 100%)" }}>
                <div className="max-w-5xl mx-auto px-5 md:px-10">
                    <div className="text-center mb-14">
                        <span className="text-xs font-black tracking-[0.3em] uppercase text-blue-400">কেন বেছে নেবেন</span>
                        <h2 className="text-2xl md:text-3xl font-black text-white mt-2">আমাদের গ্যারান্টি</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {featureList.map((f, i) => (
                            <div key={i}
                                className="group relative p-5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/8 hover:border-white/15 transition-all duration-300 cursor-default text-center">
                                <div className="text-4xl mb-3">{f.icon}</div>
                                <h3 className="text-white font-black text-sm mb-1">{f.title}</h3>
                                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                PRODUCT GALLERY + DETAILS
            ══════════════════════════════════════════ */}
            {primaryProduct && (
                <section className="py-20" style={{ background: "#0d0d1f" }}>
                    <div className="max-w-5xl mx-auto px-5 md:px-10">
                        <div className="text-center mb-12">
                            <span className="text-xs font-black tracking-[0.3em] uppercase text-purple-400">পণ্যের বিবরণ</span>
                            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">{primaryProduct.name}</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-10 items-start">
                            <div className="rounded-3xl overflow-hidden border border-white/10">
                                <LandingPageGallery images={productImages} productName={primaryProduct.name} />
                            </div>
                            <div className="space-y-6">
                                {/* Price */}
                                <div className="flex items-end flex-wrap gap-3">
                                    {effectivePrice > 0 ? (
                                        <>
                                            <span className="text-4xl font-black text-white">{formatPrice(effectivePrice)}</span>
                                            {discount && <span className="text-xl text-gray-500 line-through mb-1">{formatPrice(originalPrice)}</span>}
                                            {discount && <span className="bg-rose-500 text-white text-sm font-black px-3 py-1 rounded-full mb-1">{discount}% OFF</span>}
                                        </>
                                    ) : (
                                        <span className="text-white/60 text-lg">মূল্য জানতে অর্ডার করুন</span>
                                    )}
                                </div>

                                {/* Description */}
                                {primaryProduct.description && (
                                    <div
                                        className="text-gray-400 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:text-white [&_p]:mb-2 overflow-x-auto"
                                        dangerouslySetInnerHTML={{ __html: primaryProduct.description }}
                                    />
                                )}

                                {/* Delivery grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: "🚚", l: "ঢাকায়", r: "৭০ টাকা" },
                                        { icon: "📦", l: "সারাদেশে", r: "১৩০ টাকা" },
                                        { icon: "⏰", l: "ডেলিভারি", r: "১-৫ কার্যদিবস" },
                                        { icon: "💳", l: "পেমেন্ট", r: "ক্যাশ অন ডেলিভারি" },
                                    ].map((item) => (
                                        <div key={item.l} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
                                            <span>{item.icon}</span>
                                            <div>
                                                <p className="text-white/40 text-[10px]">{item.l}</p>
                                                <p className="text-white text-xs font-bold">{item.r}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <a href="#order-form"
                                    className="block w-full text-center text-white font-black text-base py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-lg"
                                    style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 8px 30px rgba(37,211,102,0.3)" }}>
                                    📲 WhatsApp-এ অর্ডার করুন
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════
                REVIEWS
            ══════════════════════════════════════════ */}
            {page.showTestimonials && (
                <section className="py-20" style={{ background: "#0a0a14" }}>
                    <div className="max-w-5xl mx-auto px-5 md:px-10">
                        <div className="text-center mb-14">
                            <span className="text-xs font-black tracking-[0.3em] uppercase text-green-400">রিভিউ</span>
                            <h2 className="text-2xl md:text-3xl font-black text-white mt-2">কাস্টমাররা কী বলেন?</h2>
                            <div className="flex items-center justify-center gap-1 mt-3">
                                {"★★★★★".split("").map((s, i) => (
                                    <span key={i} className="text-amber-400 text-xl">{s}</span>
                                ))}
                                <span className="text-white/40 text-sm ml-2">৫.০ / ৫.০ রেটিং</span>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {testimonials.map((r, i) => (
                                <div key={i}
                                    className="relative p-6 rounded-3xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all duration-300">
                                    {/* Quote mark */}
                                    <div className="text-5xl text-white/10 font-black leading-none mb-3 select-none">"</div>
                                    <div className="flex text-amber-400 text-sm mb-3">
                                        {"★".repeat(Math.min(5, r.rating || 5))}
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-5">"{r.text}"</p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
                                            style={{ background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)" }}>
                                            {r.name?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-bold">{r.name}</p>
                                            <p className="text-white/30 text-xs">✅ ক্রয় যাচাই • {r.city || "বাংলাদেশ"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════
                WHATSAPP ORDER FORM — UNIQUE
            ══════════════════════════════════════════ */}
            <section id="order-form" className="py-24 relative overflow-hidden" style={{ background: "#0d0d1f" }}>
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-20 pointer-events-none"
                    style={{ background: "radial-gradient(circle, #25d366 0%, transparent 70%)" }} />

                <div className="relative z-10 max-w-xl mx-auto px-5">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-lg"
                            style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}>
                            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </div>
                        <span className="text-xs font-black tracking-[0.3em] uppercase text-green-400 block mb-2">অর্ডার করুন</span>
                        <h2 className="text-2xl md:text-3xl font-black text-white">WhatsApp-এ অর্ডার করুন</h2>
                        <p className="text-white/40 text-sm mt-2 max-w-xs mx-auto">ফর্ম পূরণ করুন — সরাসরি WhatsApp-এ অর্ডার চলে যাবে</p>
                    </div>

                    {/* Form card */}
                    <div className="rounded-3xl border border-white/10 bg-white/3 backdrop-blur-sm p-6 md:p-8 shadow-2xl">
                        <WhatsAppOrderForm
                            productName={primaryProduct?.name || page.title}
                            productPrice={effectivePrice}
                            productImage={heroImg}
                            waNumber={waNumber}
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                BOTTOM CTA
            ══════════════════════════════════════════ */}
            <section className="py-20 text-center relative overflow-hidden" style={{ background: "#0a0a14" }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                </div>
                <div className="relative z-10 max-w-xl mx-auto px-5">
                    <p className="text-5xl mb-4">⚡</p>
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3">দেরি করবেন না!</h2>
                    <p className="text-white/40 mb-8 text-sm">Stock সীমিত — শেষ হওয়ার আগেই নিশ্চিত করুন</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a href="#order-form"
                            className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-10 py-4 rounded-2xl transition-all hover:scale-105 shadow-2xl"
                            style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 8px 30px rgba(37,211,102,0.3)" }}>
                            📲 WhatsApp-এ অর্ডার করুন
                        </a>
                        {primaryProduct && (
                            <Link href={`/checkout/express/${primaryProduct.id}`}
                                className="inline-flex items-center justify-center gap-2 text-white font-black text-base px-8 py-4 rounded-2xl border border-white/15 hover:bg-white/8 transition-all">
                                🛒 সরাসরি কিনুন
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        {["🚚 ক্যাশ অন ডেলিভারি", "✅ ১০০% অরিজিনাল", "🔄 ফ্রি রিটার্ন", "🛡️ সিকিউর"].map((b) => (
                            <span key={b} className="text-white/30 text-xs">{b}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-6 border-t border-white/8 text-center text-xs text-white/20" style={{ background: "#0a0a14" }}>
                <p>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Authentic Bazar"}. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link href="/privacy-policy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
                    <Link href="/contact" className="hover:text-white/50 transition-colors">Contact</Link>
                </div>
            </footer>
        </div>
    );
}
