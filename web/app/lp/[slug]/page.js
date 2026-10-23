// app/lp/[slug]/page.js — Neo Apple-Studio Ultra-Clean High-Converting Landing Page
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import LandingPageClient from "./LandingPageClient";
import LandingPageGallery from "./LandingPageGallery";
import WhatsAppOrderForm from "./LandingPageWhatsApp";
import LandingPageTracker from "./LandingPageTracker";
import { 
    RotateCcw, 
    Banknote, 
    ShieldCheck, 
    Truck, 
    Star, 
    CheckCircle2, 
    Sparkles, 
    Clock, 
    Phone, 
    ShoppingBag, 
    ChevronDown, 
    ArrowDown 
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    try {
        let { slug } = await params;
        if (slug) slug = slug.replace(/\.+$/, "");
        let page = await prisma.landingPage.findUnique({ where: { slug } });
        if (!page) {
            const p = await prisma.product.findUnique({ where: { slug }, select: { name: true, shortDesc: true } });
            if (p) {
                return { title: `${p.name} | সেরা অফার`, description: p.shortDesc || "", alternates: { canonical: `/lp/${slug}` } };
            }
        }
        if (!page) return { title: "Landing Page" };
        return { title: `${page.heroTitle || page.title} | সেরা অফার`, description: page.heroDescription || "", alternates: { canonical: `/lp/${slug}` } };
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
                    include: { 
                        product: { 
                            include: { 
                                productImages: { orderBy: { sortOrder: "asc" }, take: 8 }, 
                                variants: true 
                            } 
                        } 
                    } 
                } 
            }
        });
    } catch (err) { console.error("[LP]", err.message); }

    // Fallback: If no landing page entry exists yet, dynamically resolve from Product directly
    if (!page) {
        try {
            const fallbackProd = await prisma.product.findUnique({
                where: { slug },
                include: { productImages: { orderBy: { sortOrder: "asc" }, take: 8 }, variants: true, category: true }
            });
            if (fallbackProd) {
                page = {
                    id: fallbackProd.id,
                    title: fallbackProd.name,
                    slug: fallbackProd.slug,
                    heroTitle: fallbackProd.name,
                    heroDescription: fallbackProd.shortDesc || "১০০% প্রিমিয়াম ও অরিজিনাল কোয়ালিটি পণ্য। দ্রুত হোম ডেলিভারি ও সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা।",
                    heroImageUrl: fallbackProd.productImages?.[0]?.url || (Array.isArray(fallbackProd.images) ? fallbackProd.images[0] : null),
                    ctaText: "অর্ডার করুন",
                    showTestimonials: true,
                    products: [{ product: fallbackProd }]
                };
            }
        } catch (err2) {
            console.error("[LP Fallback]", err2.message);
        }
    }

    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    let waNumber = "8801620778044";
    let siteName = "Pashora Shop";
    try {
        const { getDecryptedSettings } = await import("@/lib/settings");
        const s = await getDecryptedSettings();
        if (s?.store_name) siteName = s.store_name;
        if (s?.whatsapp) { 
            let c = s.whatsapp.replace(/\D/g, ""); 
            if (c.startsWith("0")) c = "88" + c; 
            if (!c.startsWith("88")) c = "88" + c; 
            waNumber = c; 
        }
    } catch { }

    const now = new Date();
    try {
        const ids = allProducts.map((p) => p.id).filter(Boolean);
        const fi = await prisma.flashSaleItem.findMany({ 
            where: { productId: { in: ids }, isActive: true, flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } } 
        });
        const fm = {}; 
        fi.forEach((i) => { fm[i.productId] = i.salePrice; });
        allProducts.forEach((p) => { if (fm[p.id]) { p.salePrice = fm[p.id]; p.discountPrice = fm[p.id]; } });
    } catch { }

    const heroImg = page.heroImageUrl || primaryProduct?.productImages?.[0]?.url || (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null);
    const productImages = primaryProduct?.productImages?.map((i) => i.url).filter(Boolean).length > 0
        ? primaryProduct.productImages.map((i) => i.url).filter(Boolean)
        : heroImg ? [heroImg] : [];

    let effectivePrice = primaryProduct?.salePrice ?? primaryProduct?.price ?? 0;
    let originalPrice = primaryProduct?.price ?? 0;
    if ((!effectivePrice || effectivePrice === 0) && primaryProduct?.variants?.length > 0) {
        const vSale = primaryProduct.variants.map((v) => v.salePrice).filter((p) => p && p > 0);
        const vPrice = primaryProduct.variants.map((v) => v.price).filter((p) => p && p > 0);
        if (vSale.length > 0) effectivePrice = Math.min(...vSale);
        else if (vPrice.length > 0) effectivePrice = Math.min(...vPrice);
        if (vPrice.length > 0) originalPrice = Math.max(...vPrice);
    }
    const discount = effectivePrice && originalPrice && originalPrice > effectivePrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : null;

    let testimonials = [
        { name: "রাফসান আহমেদ", text: "প্রোডাক্টটা একদম অসাধারণ! দ্রুত ডেলিভারি এবং কোয়ালিটি দেখে মুগ্ধ। ১০০% রেকমেন্ড।", rating: 5, city: "ঢাকা" },
        { name: "নাফিসা আক্তার", text: `এত কম দামে এই কোয়ালিটি আর পাইনি। ${siteName} সত্যিই বিশ্বস্ত।`, rating: 5, city: "চট্টগ্রাম" },
        { name: "শাকিল ইসলাম", text: "প্যাকেজিং সুন্দর, পণ্য আসল। ক্যাশ অন ডেলিভারিতে পেয়েছি, ভরসা করা যায়।", rating: 5, city: "সিলেট" },
    ];
    if (page.testimonialsJson) {
        try { const p = JSON.parse(page.testimonialsJson); if (Array.isArray(p) && p.length > 0) testimonials = p; } catch { }
    }

    let featureList = [
        { icon: "🔄", title: "১ দিনের সহজ রিটার্ন", desc: "পণ্য হাতে পেয়ে কোনো সমস্যা পেলে ১ দিনের মধ্যে সমাধান", color: "#059669" },
        { icon: "💵", title: "ক্যাশ অন ডেলিভারি", desc: "কোনো অগ্রিম টাকা ছাড়াই পণ্য দেখে মূল্য পরিশোধ করুন", color: "#2563eb" },
        { icon: "🛡️", title: "১০০% আসল পণ্য", desc: "কোয়ালিটি টেস্টেড জেনুইন ও অথেন্টিক প্রোডাক্টের নিশ্চয়তা", color: "#7c3aed" },
        { icon: "⚡", title: "দ্রুত হোম ডেলিভারি", desc: "ঢাকায় ১-২ দিন ও ঢাকার বাইরে ২-৪ দিনের মধ্যে ডেলিভারি", color: "#d97706" },
    ];
    if (page.featuresJson) {
        try {
            const f = JSON.parse(page.featuresJson);
            if (Array.isArray(f) && f.length > 0) featureList = f.map((x, i) => ({ ...x, color: ["#059669", "#2563eb", "#7c3aed", "#d97706"][i % 4] }));
        } catch { }
    }

    // Dynamic specs for the floating tags around hero image
    const isPowerBank = slug?.includes("power-bank") || slug?.includes("ven-dens") || slug?.includes("30000mah");
    const isAudio = slug?.includes("earbud") || slug?.includes("headphone") || slug?.includes("neckband") || slug?.includes("x73") || slug?.includes("p9") || slug?.includes("hoco") || slug?.includes("b72");
    const isKitchen = slug?.includes("cooker") || slug?.includes("grinder") || slug?.includes("silver-crest") || slug?.includes("prestige");
    const isLight = slug?.includes("light") || slug?.includes("sunford") || slug?.includes("lamp");

    let floatingSpecs = [
        "১০০% অরিজিনাল",
        "১ দিনের রিটার্ন",
        "ক্যাশ অন ডেলিভারি",
        "প্রিমিয়াম ফিনিশিং"
    ];
    if (isAudio) {
        floatingSpecs = ["Active Noise Isolation", "Hi-Fi Stereo Bass", "Ultra Battery Backup", "Bluetooth v5.3"];
    } else if (isPowerBank) {
        floatingSpecs = ["30,000mAh Monster Battery", "Super Fast 22.5W", "LED Digital Display", "Smart Multi-Port"];
    } else if (isKitchen) {
        floatingSpecs = ["Stainless Steel Blade", "Heavy Duty Motor", "Easy Cleaning", "Energy Efficient"];
    } else if (isLight) {
        floatingSpecs = ["Ultra Bright LED", "Rechargeable Battery", "Energy Saving", "Portable & Durable"];
    }

    const generalFaqs = [
        {
            q: "পণ্যটি কি ১০০% আসল (Original)?",
            a: `জি হ্যাঁ! ${siteName} শুধুমাত্র ১০০% খাঁটি ও জেনুইন কোয়ালিটির পণ্য সরবরাহ করে।`
        },
        {
            q: "ডেলিভারি চার্জ কত এবং কতদিনে পাবো?",
            a: "ঢাকা সিটিতে ডেলিভারি চার্জ ৭০ টাকা (১-২ দিনে ডেলিভারি) এবং ঢাকার বাইরে ১৩০ টাকা (২-৪ দিনে ডেলিভারি)।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "হ্যাঁ! আমাদের সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারি ম্যানের সামনে পণ্য দেখে চেক করে টাকা পরিশোধ করবেন।"
        },
        {
            q: "পণ্য সমস্যাযুক্ত হলে কী করবো?",
            a: "আমাদের রয়েছে ১ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট সুবিধা। কোনো সমস্যা পেলে সাথে সাথে কাস্টমার কেয়ারে জানালে দ্রুত সমাধান করা হবে।"
        }
    ];

    let productCustomFaqs = null;
    if (primaryProduct?.faqs) {
        try {
            const parsed = typeof primaryProduct.faqs === "string" ? JSON.parse(primaryProduct.faqs) : primaryProduct.faqs;
            if (Array.isArray(parsed) && parsed.length > 0) {
                productCustomFaqs = parsed.map(f => ({
                    q: f.question || f.q || f.title,
                    a: f.answer || f.a || f.desc
                })).filter(f => f.q && f.a);
            }
        } catch (e) {
            console.error("Error parsing product FAQs", e);
        }
    }
    const currentFaqs = (productCustomFaqs && productCustomFaqs.length > 0) ? productCustomFaqs : generalFaqs;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                .neo-lp {
                    font-family: 'Hind Siliguri', 'Inter', -apple-system, sans-serif;
                    text-rendering: optimizeLegibility;
                    -webkit-font-smoothing: antialiased;
                }

                @keyframes float-pill-1 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-7px) rotate(0.5deg); }
                }
                @keyframes float-pill-2 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(-0.5deg); }
                }
                @keyframes float-pill-3 {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(6px); }
                }

                .anim-pill-1 { animation: float-pill-1 4s ease-in-out infinite; }
                .anim-pill-2 { animation: float-pill-2 4.6s ease-in-out 0.8s infinite; }
                .anim-pill-3 { animation: float-pill-3 3.8s ease-in-out 1.4s infinite; }

                /* Smooth scrolling */
                html { scroll-behavior: smooth; }
            `}</style>

            <div className="neo-lp min-h-screen bg-[#fafbfc] text-slate-900 overflow-x-hidden">
                <LandingPageTracker product={primaryProduct ? { id: primaryProduct.id, name: primaryProduct.name } : null} price={effectivePrice} />

                {/* ══ 1. TOP ANNOUNCEMENT BANNER ══ */}
                <div className="bg-slate-900 text-white py-2.5 px-4 text-xs font-semibold text-center border-b border-slate-800">
                    <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 flex-wrap text-[11px] md:text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                            সীমিত সময়ের বিশেষ অফার
                        </span>
                        <span className="hidden sm:inline text-slate-600">•</span>
                        <span>🚚 ক্যাশ অন ডেলিভারি সুবিধা</span>
                        <span className="hidden sm:inline text-slate-600">•</span>
                        <span className="text-amber-300 font-bold">🔄 ১ দিনের সহজ রিটার্ন পলিসি</span>
                    </div>
                </div>

                {/* ══ 2. HEADER / NAVBAR ══ */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
                    <div className="max-w-6xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                                P
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900">
                                {siteName || "Pashora Shop"}
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <a 
                                href={`https://wa.me/${waNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all"
                            >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>হোয়াটসঅ্যাপ হেল্পলাইন</span>
                            </a>
                            <a
                                href="#order-form"
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm px-4 md:px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>অর্ডার করুন</span>
                            </a>
                        </div>
                    </div>
                </header>

                {/* ══ 3. HERO SHOWCASE SECTION (Apple-Studio Style) ══ */}
                <section className="relative pt-8 pb-14 md:py-16 overflow-hidden">
                    {/* Pearlescent Ambient Glow */}
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/50 via-teal-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-100/40 via-purple-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

                    <div className="max-w-6xl mx-auto px-4 md:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            
                            {/* ── LEFT: Product Image & Floating Specs Pills (Cols: 6) ── */}
                            <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
                                <div className="relative w-full max-w-lg aspect-square rounded-[2.5rem] bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 p-4 border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] flex items-center justify-center">
                                    
                                    {/* Discount Badge */}
                                    {discount && (
                                        <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md">
                                            -{discount}% OFF
                                        </div>
                                    )}

                                    {/* Floating Spec Pill 1 (Top Right) */}
                                    {floatingSpecs[0] && (
                                        <div className="anim-pill-1 absolute -top-3 right-6 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_25px_rgba(0,0,0,0.08)] rounded-full px-4 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span>{floatingSpecs[0]}</span>
                                        </div>
                                    )}

                                    {/* Floating Spec Pill 2 (Middle Right) */}
                                    {floatingSpecs[1] && (
                                        <div className="anim-pill-2 absolute top-1/3 -right-3 sm:-right-5 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_25px_rgba(0,0,0,0.08)] rounded-full px-4 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                            <span>{floatingSpecs[1]}</span>
                                        </div>
                                    )}

                                    {/* Floating Spec Pill 3 (Lower Left) */}
                                    {floatingSpecs[2] && (
                                        <div className="anim-pill-3 absolute bottom-8 -left-3 sm:-left-5 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_25px_rgba(0,0,0,0.08)] rounded-full px-4 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{floatingSpecs[2]}</span>
                                        </div>
                                    )}

                                    {/* Floating Spec Pill 4 (Bottom Right) */}
                                    {floatingSpecs[3] && (
                                        <div className="anim-pill-1 absolute -bottom-3 right-10 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_10px_25px_rgba(0,0,0,0.08)] rounded-full px-4 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                            <span>{floatingSpecs[3]}</span>
                                        </div>
                                    )}

                                    {/* Main Product Showcase or Gallery */}
                                    {productImages && productImages.length > 1 ? (
                                        <div className="w-full relative z-10">
                                            <LandingPageGallery images={productImages} productName={primaryProduct?.name || page.title} />
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white">
                                            {heroImg ? (
                                                <Image 
                                                    src={heroImg} 
                                                    alt={primaryProduct?.name || page.title} 
                                                    fill 
                                                    priority 
                                                    className="object-contain p-4" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-7xl bg-slate-50">
                                                    📦
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── RIGHT: Product Info, Pricing, Flash Deal, Direct Actions (Cols: 6) ── */}
                            <div className="lg:col-span-6 flex flex-col gap-5">
                                
                                {/* Flash Deal / Pill */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5 animate-spin" />
                                        হট ডিল অফার
                                    </span>
                                    {page.countdownEnd && (
                                        <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                                            <span>অফার শেষ হতে বাকি:</span>
                                            <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                        {page.heroTitle || primaryProduct?.name || page.title}
                                    </h1>
                                    
                                    {/* Reviews Rating */}
                                    <div className="flex items-center gap-2 mt-2.5">
                                        <div className="flex text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">৪.৯</span>
                                        <span className="text-xs text-slate-400">|</span>
                                        <span className="text-xs text-slate-500 font-medium">২৮০+ কাস্টমার রিভিউ</span>
                                    </div>
                                </div>

                                {/* Short Description */}
                                {page.heroDescription && (
                                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                                        {page.heroDescription}
                                    </p>
                                )}

                                {/* Price Container */}
                                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">অফার প্রাইস:</p>
                                        <div className="flex items-baseline gap-2.5 flex-wrap">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-900">
                                                {formatPrice(effectivePrice)}
                                            </span>
                                            {originalPrice > effectivePrice && (
                                                <span className="text-base sm:text-lg text-slate-400 line-through font-bold">
                                                    {formatPrice(originalPrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {discount && (
                                        <div className="bg-rose-600 text-white text-center px-4 py-2 rounded-xl shadow-sm">
                                            <span className="block text-base font-black leading-none">{discount}%</span>
                                            <span className="text-[10px] uppercase font-bold text-rose-100">ছাড়</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Call To Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                    <a
                                        href="#order-form"
                                        className="flex-1 inline-flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        <span>অর্ডার করতে ফর্ম পূরণ করুন</span>
                                    </a>
                                    
                                    <a
                                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`হ্যালো! আমি ${primaryProduct?.name || page.title} সম্পর্কে বিস্তারিত জানতে ও অর্ডার করতে চাই।`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm py-4 px-5 rounded-2xl border border-slate-200 shadow-sm transition-all"
                                    >
                                        {/* WhatsApp icon */}
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span>হোয়াটসঅ্যাপে প্রশ্ন</span>
                                    </a>
                                </div>

                                {/* Trust Highlights Pill Bar */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-3 py-1 rounded-full">
                                        ✅ ১০০% ক্যাশ অন ডেলিভারি
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-3 py-1 rounded-full">
                                        🔄 ১ দিনের সহজ রিটার্ন
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-3 py-1 rounded-full">
                                        📦 ডেলিভারির সময় চেক করার সুযোগ
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ 4. 4 MODERN MINIMALIST TRUST CARD MODULES (Reference Image Match) ══ */}
                <section className="py-8 md:py-12 bg-white border-y border-slate-100">
                    <div className="max-w-6xl mx-auto px-4 md:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            
                            {/* Card 1: 1 Day Return */}
                            <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 md:p-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 flex flex-col items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <RotateCcw className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base">১ দিনের সহজ রিটার্ন</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">পণ্য পাওয়ার পর সমস্যা পেলে ১ দিনের মধ্যে সমাধান সুবিধা</p>
                                </div>
                            </div>

                            {/* Card 2: Cash On Delivery */}
                            <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 md:p-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 flex flex-col items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                    <Banknote className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base">ক্যাশ অন ডেলিভারি</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">কোনো অগ্রিম পেমেন্ট নেই, পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
                                </div>
                            </div>

                            {/* Card 3: 100% Authentic */}
                            <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 md:p-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 flex flex-col items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base">১০০% আসল পণ্য</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">কোয়ালিটি চেক করা ১০০% জেনুইন ও অথেন্টিক প্রোডাক্ট</p>
                                </div>
                            </div>

                            {/* Card 4: Fast Delivery */}
                            <div className="bg-slate-50/70 border border-slate-200/70 rounded-3xl p-5 md:p-6 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 flex flex-col items-start gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm md:text-base">ফাস্ট হোম ডেলিভারি</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">ঢাকায় ১-২ দিন ও সারাদেশে দ্রুততম হোম ডেলিভারি</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ══ 5. SEAMLESS MODERN 1-STEP ORDER SECTION (Reference Image Match) ══ */}
                <section id="order-form" className="py-14 md:py-20 bg-[#f8fafc] relative">
                    <div className="max-w-5xl mx-auto px-4 md:px-8">
                        
                        {/* Section Header */}
                        <div className="text-center mb-10">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest uppercase bg-emerald-100/70 text-emerald-800 px-4 py-1.5 rounded-full mb-3">
                                <Sparkles className="w-3.5 h-3.5" />
                                ১-স্টেপ সহজ অর্ডার ফর্ম
                            </span>
                            <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                অর্ডার কনফার্ম করতে নিচের ফর্মটি পূরণ করুন
                            </h2>
                            <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2 leading-relaxed">
                                ফর্ম পূরণ করে সাবমিট করলেই আপনার অর্ডারটি সরাসরি অ্যাডমিন প্যানেলে সংরক্ষিত হবে এবং আপনার হোয়াটসঅ্যাপেও স্বয়ংক্রিয়ভাবে নিশ্চিত হবে।
                            </p>
                        </div>

                        {/* Order Box Container */}
                        <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden">
                            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                                
                                {/* Left Info Summary (Cols: 5) */}
                                <div className="lg:col-span-5 p-6 md:p-8 bg-slate-50/60 flex flex-col justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70">
                                            <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0">
                                                {heroImg ? (
                                                    <Image src={heroImg} alt={primaryProduct?.name || page.title} fill className="object-contain p-1" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                                    {primaryProduct?.name || page.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="font-black text-emerald-600 text-sm">
                                                        {formatPrice(effectivePrice)}
                                                    </span>
                                                    {originalPrice > effectivePrice && (
                                                        <span className="text-xs text-slate-400 line-through">
                                                            {formatPrice(originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3.5">
                                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                অর্ডার করার নিয়ম:
                                            </h4>
                                            <div className="space-y-2.5 text-xs text-slate-600">
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                                        ১
                                                    </div>
                                                    <span>আপনার সঠিক নাম, মোবাইল নম্বর ও ঠিকানা লিখুন।</span>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                                        ২
                                                    </div>
                                                    <span>ডেলিভারি এলাকা সিলেক্ট করে সবুজ বাটনে ক্লিক করুন।</span>
                                                </div>
                                                <div className="flex items-start gap-2.5">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                                                        ৩
                                                    </div>
                                                    <span>অর্ডারটি আমাদের সার্ভারে জমা হবে এবং হোয়াটসঅ্যাপে ওপেন হবে।</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 space-y-1">
                                        <p className="font-bold flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-700" />
                                            <span>শতভাগ নিশ্চিন্তে কেনাকাটা করুন</span>
                                        </p>
                                        <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                                            ডেলিভারিম্যানের সামনে প্যাকেট চেক করে পণ্যের মূল্য পরিশোধ করতে পারবেন। কোনো হিডেন চার্জ নেই।
                                        </p>
                                    </div>
                                </div>

                                {/* Right Form (Cols: 7) */}
                                <div className="lg:col-span-7 p-6 md:p-8 bg-white">
                                    <WhatsAppOrderForm
                                        product={primaryProduct}
                                        productName={primaryProduct?.name || page.title}
                                        productPrice={effectivePrice}
                                        originalPrice={originalPrice}
                                        productImage={heroImg}
                                        waNumber={waNumber}
                                        variants={primaryProduct?.variants || []}
                                        theme="light"
                                    />
                                </div>

                            </div>
                        </div>

                    </div>
                </section>

                {/* ══ 6. PRODUCT DESCRIPTION / BENEFITS ══ */}
                {primaryProduct?.description && (
                    <section className="py-14 md:py-20 bg-white border-t border-slate-100">
                        <div className="max-w-4xl mx-auto px-4 md:px-8">
                            <div className="text-center mb-10">
                                <span className="inline-block text-xs font-black tracking-widest uppercase bg-slate-100 text-slate-700 rounded-full px-4 py-1.5 mb-3">
                                    বিস্তারিত তথ্য
                                </span>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                    পণ্যটির বিশেষত্ব ও কার্যকারিতা
                                </h2>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 md:p-10 shadow-sm leading-relaxed">
                                <div 
                                    className="prose prose-slate max-w-none text-slate-700 text-sm md:text-base space-y-4"
                                    dangerouslySetInnerHTML={{ __html: primaryProduct.description }}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ 7. FAQ ACCORDION ══ */}
                {currentFaqs && currentFaqs.length > 0 && (
                    <section className="py-14 md:py-20 bg-[#fafbfc] border-t border-slate-100">
                        <div className="max-w-3xl mx-auto px-4 md:px-8">
                            <div className="text-center mb-10">
                                <span className="inline-block text-xs font-black tracking-widest uppercase bg-emerald-100 text-emerald-800 rounded-full px-4 py-1.5 mb-3">
                                    সাধারণ প্রশ্নোত্তর
                                </span>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                                    সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
                                </h2>
                            </div>

                            <div className="space-y-3.5">
                                {currentFaqs.map((faq, idx) => (
                                    <details key={idx} className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm open:shadow-md transition-all">
                                        <summary className="font-bold text-slate-900 text-sm md:text-base cursor-pointer list-none flex items-center justify-between gap-4">
                                            <span>{faq.q}</span>
                                            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                                        </summary>
                                        <p className="mt-3 text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                            {faq.a}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ 8. STICKY MOBILE BOTTOM ORDER BAR ══ */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-[0_-10px_25px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{primaryProduct?.name || page.title}</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-slate-900">{formatPrice(effectivePrice)}</span>
                            {originalPrice > effectivePrice && (
                                <span className="text-xs text-slate-400 line-through">{formatPrice(originalPrice)}</span>
                            )}
                        </div>
                    </div>
                    <a 
                        href="#order-form"
                        className="shrink-0 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-5 rounded-xl shadow-md transition-all"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>অর্ডার করুন (হোয়াটসঅ্যাপ)</span>
                    </a>
                </div>

                {/* ══ 9. FOOTER ══ */}
                <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
                    <div className="max-w-6xl mx-auto px-4">
                        <p>© {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।</p>
                        <div className="flex justify-center gap-4 mt-2.5 text-slate-500 font-medium">
                            <Link href="/privacy-policy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
                            <Link href="/return-refund-policy" className="hover:text-slate-800 transition-colors">Return Policy</Link>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
