// app/lp/[slug]/page.js — Premium White LP v7
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import LandingPageClient from "./LandingPageClient";
import LandingPageGallery from "./LandingPageGallery";
import WhatsAppOrderForm from "./LandingPageWhatsApp";
import LandingPageTracker from "./LandingPageTracker";

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

    const isPowerBank = slug?.includes("power-bank") || slug?.includes("ven-dens") || slug?.includes("30000mah");
    const isX73 = slug?.includes("x73") || slug?.includes("retro-camera");
    const isHoco = slug?.includes("hoco") || slug?.includes("eq34");
    const isP9 = slug?.includes("p9-pro-max") || slug?.includes("p9");

    const p9Faqs = [
        {
            q: "P9 Pro Max হেডফোনটি কি সব ডিভাইসে সাপোর্ট করবে?",
            a: "হ্যাঁ! Android স্মার্টফোন, iPhone, iPad, Laptop, PC, Smart TV সহ যেকোনো ব্লুটুথ সাপোর্টেড ডিভাইসে এটি মুহূর্তেই কানেক্ট হয়ে যায়।"
        },
        {
            q: "দীর্ঘক্ষণ ব্যবহারে কানে কোনো ব্যথা বা চাপ লাগবে কি?",
            a: "একদমই না! এতে রয়েছে আল্ট্রা-সফট মেমোরি ফোম ইয়ার কুশন এবং অ্যাডজাস্টেবল হেডব্যান্ড। কানের চারপাশ ঘিরে নরম গ্রিপ থাকে, যার ফলে টানা ৩-৪ ঘণ্টা গান শুনলেও কান ব্যথা করে না।"
        },
        {
            q: "সাউন্ড ও বেস কোয়ালিটি কেমন?",
            a: "এতে রয়েছে ৪০ মিমি পাওয়ারফুল ডায়নামিক অডিও ড্রাইভার। প্রতিটি মিউজিকে ক্রিস্টাল ক্লিয়ার ভোকাল, ঝকঝকে ট্রিবল এবং ডিপ পাঞ্চি বেস পাবেন।"
        },
        {
            q: "একবার ফুল চার্জে ব্যাটারি কতক্ষণ চলে?",
            a: "একবার সম্পূর্ণ চার্জে প্রায় ৮ থেকে ১০ ঘণ্টা ননস্টপ গান শোনা ও কল রিসিভ করা যায়। এছাড়া এর স্ট্যান্ডবাই ব্যাকআপ ১২০ ঘণ্টারও বেশি।"
        },
        {
            q: "ফোনে কথা বলার জন্য মাইক্রোফোন আছে কি?",
            a: "হ্যাঁ! এতে রয়েছে হাই-ডেফিনিশন বিল্ট-ইন মাইক্রোফোন। স্পষ্ট ভয়েসে কল রিসিভ, কথা বলা বা অনলাইন মিটিং করা যাবে।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "অবশ্যই! আমাদের রয়েছে ১০০% ক্যাশ অন ডেলিভারি সুবিধা। ডেলিভারি ম্যানের সামনে প্রোডাক্ট দেখে চেক করে সম্পূর্ণ নিশ্চিন্তে টাকা পরিশোধ করতে পারবেন।"
        },
        {
            q: "পণ্য সমস্যাযুক্ত হলে কী করবো?",
            a: "আমাদের রয়েছে ৩ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট গ্যারান্টি। কোনো সমস্যা পেলে সাথে সাথে আমাদের কাস্টমার কেয়ারে জানালে দ্রুত সমাধান করে দেওয়া হবে।"
        }
    ];

    const x73Faqs = [
        {
            q: "এটি কি সব ধরণের মোবাইল ফোনে সাপোর্ট করবে?",
            a: "হ্যাঁ! Android, iPhone, Laptop, Tablet সহ যেকোনো ব্লুটুথ সাপোর্টেড ডিভাইসে X73 খুব সহজে দ্রুত অটো-কানেক্ট হবে।"
        },
        {
            q: "কোন কোন কালার ভ্যারিয়েন্ট পাওয়া যাবে?",
            a: "X73 TWS ইয়ারবাডস তিনটি ক্লাসিক রেট্রো কালারে এভেলেবেল রয়েছে: Brown (ব্রাউন), Green (গ্রিন) এবং White (হোয়াইট)।"
        },
        {
            q: "সাউন্ড ও বেস কোয়ালিটি কেমন?",
            a: "Sound by KFG স্পেশাল অডিও টিউনিং থাকার কারণে এটি দেবে ক্রিস্টাল ক্লিয়ার স্টেরিও সাউন্ড, স্পষ্ট ভোকাল এবং ডিপ পাঞ্চি বেস।"
        },
        {
            q: "ডেলিভারি চার্জ কত এবং কতদিনে পাবো?",
            a: "ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৭০ টাকা (১-২ দিনে পাবেন) এবং ঢাকার বাইরে ১৩০ টাকা (২-৪ দিনে ডেলিভারি)।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "অবশ্যই! আমাদের সম্পূর্ণ ক্যাশ অন ডেলিভারি (Cash on Delivery) সুবিধা রয়েছে। ডেলিভারি ম্যানের সামনে প্যাকেট চেক করে টাকা পরিশোধ করতে পারবেন।"
        },
        {
            q: "পণ্য সমস্যাযুক্ত হলে কী করবো?",
            a: "আমাদের রয়েছে ৩ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি। কোনো সমস্যা পেলে সাথে সাথে কাস্টমার কেয়ারে জানালে রিপ্লেসমেন্ট করে দেওয়া হবে।"
        }
    ];

    const powerBankFaqs = [
        {
            q: "এটি দিয়ে আমার ফোন কতবার ফুল চার্জ দেওয়া যাবে?",
            a: "VEN-DENS এর 30,000mAh বিশাল ব্যাটারি দিয়ে সাধারণ যেকোনো স্মার্টফোন (iPhone/Android) ৫ থেকে ৭ বার সম্পূর্ণ ফুল চার্জ দেওয়া সম্ভব।"
        },
        {
            q: "ফাস্ট চার্জিং কি সব ফোনে সাপোর্ট করবে?",
            a: "হ্যাঁ! এতে রয়েছে হাই-স্পিড ফাস্ট চার্জিং টেকনোলজি যা iPhone, Samsung, Xiaomi, Realme, Vivo সহ যেকোনো ফাস্ট চার্জিং সাপোর্টেড ফোনে দ্রুত চার্জ নিশ্চিত করে।"
        },
        {
            q: "একসাথে একাধিক ডিভাইস চার্জ করা যাবে কি?",
            a: "হ্যাঁ, এতে একাধিক আউটপুট পোর্ট থাকায় আপনি একসাথে ২ থেকে ৩টি মোবাইল বা গ্যাজেট একযোগে চার্জ করতে পারবেন।"
        },
        {
            q: "চার্জিংয়ের সময় ফোন গরম হওয়া বা ব্যাটারি ক্ষতির ঝুঁকি আছে কি?",
            a: "একদমই না! এতে রয়েছে স্মার্ট ইন্টেলিজেন্ট চিপসেট যা ওভারহিট, ওভারভোল্টেজ ও শর্ট সার্কিট থেকে আপনার ফোনের ব্যাটারিকে শতভাগ সুরক্ষিত রাখে।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "অবশ্যই! আমাদের পুরো ডেলিভারি সিস্টেম সম্পূর্ণ ক্যাশ অন ডেলিভারি (Cash on Delivery)। ডেলিভারি ম্যানের সামনে পণ্য চেক করে টাকা পরিশোধ করতে পারবেন।"
        },
        {
            q: "পণ্য সমস্যাযুক্ত হলে কী করবো?",
            a: "আমাদের রয়েছে ৩ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি। কোনো সমস্যা দেখা দিলে কাস্টমার কেয়ারে জানালেই দ্রুত সমাধান পাবেন।"
        }
    ];

    const earbudsFaqs = [
        {
            q: "এটি কি সব ধরণের মোবাইল ফোনে সাপোর্ট করবে?",
            a: "হ্যাঁ! Android, iPhone, Laptop, Tablet সহ যেকোনো ব্লুটুথ সাপোর্টেড ডিভাইসে Hoco EQ34 Plus খুব সহজে কানেক্ট হবে।"
        },
        {
            q: "প্রোডাক্টটি কি আসল (Original)?",
            a: "১০০% অরিজিনাল Hoco ব্র্যান্ডের পণ্য। প্যাকেটের গায়ে থাকা বারকোড/QR কোড দিয়ে আপনি আসল প্রোডাক্ট ভেরিফাই করতে পারবেন।"
        },
        {
            q: "ডেলিভারি চার্জ কত এবং কতদিনে পাবো?",
            a: "ঢাকা সিটির ভেতরে ডেলিভারি চার্জ ৭০ টাকা (১-২ দিনে পাবেন) এবং ঢাকার বাইরে ১৩০ টাকা (২-৪ দিনে ডেলিভারি)।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "অবশ্যই! আমাদের ডেলিভারি সিস্টেম সম্পূর্ণ ক্যাশ অন ডেলিভারি (Cash on Delivery)। ডেলিভারি ম্যানের সামনে প্যাকেট চেক করে টাকা পরিশোধ করতে পারবেন।"
        },
        {
            q: "পণ্য নষ্ট বা সমস্যা থাকলে কী করবো?",
            a: "আমাদের রয়েছে ৩ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি। কোনো সমস্যা পেলে কাস্টমার কেয়ারে যোগাযোগ করলে সাথে সাথে সমাধান করা হবে।"
        }
    ];

    const generalFaqs = [
        {
            q: "পণ্যটি কি ১০০% আসল (Original)?",
            a: "জি হ্যাঁ! Authentic Bazar শুধুমাত্র ১০০% খাঁটি ও জেনুইন কোয়ালিটির পণ্য সরবরাহ করে।"
        },
        {
            q: "ডেলিভারি চার্জ কত এবং কতদিনে পাবো?",
            a: "ঢাকা সিটিতে ডেলিভারি চার্জ ৭০ টাকা (১-২ দিনে ডেলিভারি) এবং ঢাকার বাইরে ১৩০ টাকা (২-৪ দিনে ডেলিভারি)।"
        },
        {
            q: "ডেলিভারির সময় কি চেক করে টাকা দেওয়া যাবে?",
            a: "হ্যাঁ! আমাদের সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। পণ্য হাতে পেয়ে চেক করে টাকা দেবেন।"
        },
        {
            q: "পণ্য সমস্যাযুক্ত হলে কী করবো?",
            a: "আমাদের রয়েছে ৩ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট সুবিধা।"
        }
    ];

    const currentFaqs = isP9 ? p9Faqs : isX73 ? x73Faqs : isPowerBank ? powerBankFaqs : isHoco ? earbudsFaqs : generalFaqs;

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
                <LandingPageTracker product={primaryProduct ? { id: primaryProduct.id, name: primaryProduct.name } : null} price={effectivePrice} />

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

                {/* ══ FEATURES SHOWCASE ══ */}
                {featureList && featureList.length > 0 && (
                    <section className="py-16 md:py-20 bg-white border-t border-zinc-100">
                        <div className="max-w-6xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                    বিশেষ বৈশিষ্ট্যসমূহ
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                    কেন {isP9 ? "P9 Pro MAX Headphone" : isPowerBank ? "VEN-DENS 30000mAh" : isX73 ? "X73 TWS Earbuds" : isHoco ? "Hoco EQ34 Plus" : "আমাদের এই পণ্যটি"} আপনার সেরা পছন্দ?
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {featureList.map((f, idx) => (
                                    <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 flex flex-col gap-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-white border border-zinc-100">
                                            {f.icon || "✨"}
                                        </div>
                                        <h3 className="font-black text-zinc-900 text-lg">{f.title}</h3>
                                        <p className="text-zinc-600 text-sm leading-relaxed">{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ POWER BANK CAPACITY & PERFORMANCE SHOWCASE ══ */}
                {isPowerBank && (
                    <section className="py-16 md:py-20 bg-zinc-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto px-4 md:px-10 relative z-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.2em] uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-4 py-1.5 mb-3">
                                    MONSTER 30000MAH CAPACITY
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                    বিশাল ৩০,০০০mAh ব্যাটারির অবিশ্বাস্য পাওয়ার ব্যাকআপ
                                </h2>
                                <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
                                    লং ট্যুর, ক্যাম্পিং, লোডশেডিং কিংবা টানা কয়েকদিন বিদ্যুৎহীন পরিবেশেও আপনার সব ফোন সচল থাকবে
                                </p>
                            </div>

                            {/* Device Charge Breakdown */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { icon: "📱", device: "iPhone (13/14/15/16)", count: "৬ - ৭ বার", desc: "সম্পূর্ণ ফুল চার্জ", color: "#34d399" },
                                    { icon: "🤖", device: "Android Smartphones", count: "৫ - ৬ বার", desc: "সম্পূর্ণ ফুল চার্জ", color: "#60a5fa" },
                                    { icon: "💻", device: "iPad / Tablets", count: "৩ - ৪ বার", desc: "বিশাল পাওয়ার সাপোর্ট", color: "#fbbf24" },
                                    { icon: "🎧", device: "Earbuds & Watch", count: "২০+ বার", desc: "অনবরত চার্জিং", color: "#a78bfa" },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center flex flex-col items-center gap-2 hover:border-amber-500/40 transition-colors">
                                        <span className="text-3xl">{item.icon}</span>
                                        <span className="text-xl md:text-2xl font-black text-white" style={{ color: item.color }}>{item.count}</span>
                                        <p className="font-bold text-zinc-200 text-xs md:text-sm">{item.device}</p>
                                        <span className="text-[10px] text-zinc-400">{item.desc}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-amber-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl font-bold">
                                        ⚡
                                    </div>
                                    <h3 className="text-xl font-black text-white">Super Fast Charging & Multi-Port Output</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        হাই-স্পিড ফাস্ট চার্জিং টেকনোলজি দিয়ে মাত্র ৩০ মিনিটেই যেকোনো স্মার্টফোনে ৫০%+ চার্জ পৌঁছে দেয়। একাধিক আউটপুট পোর্ট থাকায় একসাথে ২-৩টি ডিভাইস একযোগে চার্জ করার পূর্ণ সুবিধা।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-amber-400">
                                        <span>✓ সুপার ফাস্ট চার্জিং</span>
                                        <span>•</span>
                                        <span>✓ মাল্টি-ডিভাইস একযোগে চার্জ</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold">
                                        🛡️
                                    </div>
                                    <h3 className="text-xl font-black text-white">ইন্টেলিজেন্ট সেফটি চিপ ও ডিজিটাল ডিসপ্লে</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        স্মার্ট চিপসেটের মাধ্যমে ওভারহিট, ওভারচার্জ ও শর্ট সার্কিট থেকে আপনার ফোনের ব্যাটারিকে সুরক্ষিত রাখে। সাথে থাকা LED ডিজিটাল ডিসপ্লেতে চার্জের নিখুঁত পার্সেন্টেজ দেখা যায়।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <span>✓ ০-১০০% ডিজিটাল ব্যাটারি ডিসপ্লে</span>
                                        <span>•</span>
                                        <span>✓ মাল্টি-লেয়ার সেফটি প্রটেকশন</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ POWER BANK COMPARISON TABLE ══ */}
                {isPowerBank && (
                    <section className="py-16 md:py-20" style={{ background: "#f8f8fc" }}>
                        <div className="max-w-4xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                    পার্থক্য দেখুন
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                    কেন VEN-DENS 30000mAh সাধারণ পাওয়ার ব্যাংকের চেয়ে সেরা?
                                </h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 bg-zinc-50">
                                                <th className="py-4 px-5 text-xs font-black text-zinc-500 uppercase">ফিচার</th>
                                                <th className="py-4 px-5 text-sm font-black text-emerald-700 bg-emerald-50/80">VEN-DENS 30000mAh (৳১,৯৪৯)</th>
                                                <th className="py-4 px-5 text-xs font-black text-zinc-400">সাধারণ কমদামী পাওয়ার ব্যাংক</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-sm">
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ব্যাটারি ক্যাপাসিটি</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ জেনুইন 30,000mAh হাই-ডেনসিটি সেল</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ নকল বা মাত্র ১০,০০০mAh ক্যাপাসিটি</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">চার্জিং স্পিড ও আউটপুট</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ সুপার ফাস্ট চার্জিং সাপোর্ট</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ স্লো ৫W/১০W চার্জিং (দেরি হয়)</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">একসাথে ডিভাইস চার্জ</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ একসাথে ২-৩টি ডিভাইস ফুল স্পিডে</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ মাত্র ১টি দুর্বল পোর্ট</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ব্যাটারি ইন্ডিকেটর সিস্টেম</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ডিজিটাল LED ব্যাটারি পার্সেন্টেজ (০-১০০%)</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ টিমটিমে দুর্বল ডট লাইট</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ডিভাইস সেফটি প্রটেকশন</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ স্মার্ট চিপ (ওভারহিট ও শর্ট সার্কিট সেফ)</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ গরম হয়ে ফোনের ব্যাটারি নষ্ট হওয়ার ঝুঁকি</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">বিল্ড ও বডি কোয়ালিটি</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ফায়ার-রেজিস্ট্যান্ট এবিএস মজবুত বডি</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ নরমাল ভঙ্গুর প্লাস্টিক বডি</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ X73 RETRO CAMERA DESIGN & KFG AUDIO SHOWCASE ══ */}
                {isX73 && (
                    <section className="py-16 md:py-20 bg-zinc-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto px-4 md:px-10 relative z-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.2em] uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full px-4 py-1.5 mb-3">
                                    VINTAGE RETRO CAMERA DESIGN
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                    ভিন্টেজ রেট্রো ক্যামেরা লুক ও Sound by KFG অডিও
                                </h2>
                                <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
                                    সাধারণ প্লাস্টিক লুককে বিদায় দিন — হাতে নিলেই পাবেন প্রিমিয়াম লেদার টেক্সচার ও রেট্রো ক্যামেরার আভিজাত্য
                                </p>
                            </div>

                            {/* Color Variants Pills */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-center text-zinc-200 mb-6 flex items-center justify-center gap-2">
                                    <span>🎨</span> ৩টি প্রিমিয়াম ক্লাসিক কালার ভ্যারিয়েন্ট
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { name: "Brown (ব্রাউন)", desc: "ক্লাসিক ভিন্টেজ লেদার ফিনিশ", bg: "#78350f", badge: "সবচেয়ে জনপ্রিয় 🔥" },
                                        { name: "Green (গ্রিন)", desc: "মডার্ন রেট্রো ও এলিগেন্ট লুক", bg: "#065f46", badge: "ট্রেন্ডি চয়েস ✨" },
                                        { name: "White (হোয়াইট)", desc: "ক্লিন, মিনিমাল ও লাক্সারি ভাইব", bg: "#3f3f46", badge: "প্রিমিয়াম স্টাইল 🤍" },
                                    ].map((col, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:border-amber-400/50 transition-all">
                                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300">{col.badge}</span>
                                            <div className="w-12 h-12 rounded-full border-2 border-white/40 shadow-inner my-1" style={{ backgroundColor: col.bg }} />
                                            <p className="font-black text-white text-base">{col.name}</p>
                                            <span className="text-xs text-zinc-400">{col.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-amber-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl font-bold">
                                        🎵
                                    </div>
                                    <h3 className="text-xl font-black text-white">Sound by KFG — ক্রিস্টাল ক্লিয়ার হাই-ফাই অডিও</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        স্পেশাল Sound by KFG অডিও টিউনিং। প্রতিটি গানে পাবেন ঝকঝকে ভোকাল, সুমধুর ট্রিবল ও নিখুঁত ডিপ বেস। মুভি, গেমিং কিংবা লং মিউজিক সেশনে অনন্য অভিজ্ঞতা।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-amber-400">
                                        <span>✓ Sound by KFG টিউনিং</span>
                                        <span>•</span>
                                        <span>✓ ডিপ বেস & ক্রিস্টাল ভোকাল</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold">
                                        📊
                                    </div>
                                    <h3 className="text-xl font-black text-white">ডিজিটাল LED ডিসপ্লে & স্মার্ট টাচ কন্ট্রোল</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        চার্জিং কেসের ফ্রন্টে ডিজিটাল ডিসপ্লে থাকায় ব্যাটারির সঠিক পার্সেন্টেজ সবসময় দেখতে পারবেন। স্মার্ট টাচ কন্ট্রোলের মাধ্যমে এক স্পর্শেই গান বদলানো ও কল রিসিভ করা যায়।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <span>✓ ডিজিটাল ব্যাটারি পার্সেন্টেজ</span>
                                        <span>•</span>
                                        <span>✓ অটো-পেয়ারিং & স্মার্ট টাচ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ X73 COMPARISON TABLE ══ */}
                {isX73 && (
                    <section className="py-16 md:py-20" style={{ background: "#f8f8fc" }}>
                        <div className="max-w-4xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                    পার্থক্য দেখুন
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                    কেন X73 TWS সাধারণ ইয়ারবাডসের চেয়ে সম্পূর্ণ আলাদা?
                                </h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 bg-zinc-50">
                                                <th className="py-4 px-5 text-xs font-black text-zinc-500 uppercase">ফিচার</th>
                                                <th className="py-4 px-5 text-sm font-black text-emerald-700 bg-emerald-50/80">X73 TWS Earbuds (৳৬৫০)</th>
                                                <th className="py-4 px-5 text-xs font-black text-zinc-400">সাধারণ সস্তা ইয়ারবাডস</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-sm">
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">কেস ডিজাইন & লুক</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ভিন্টেজ রেট্রো ক্যামেরা স্টাইল লেদার ফিনিশ</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ সাধারণ সস্তা প্লাস্টিক বক্স</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">সাউন্ড কোয়ালিটি</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ Sound by KFG টিউন করা পাঞ্চি ডিপ বেস</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ফ্ল্যাট ও কর্কশ সাউন্ড</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ব্যাটারি ইন্ডিকেটর</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ রিয়েল-টাইম ডিজিটাল LED পার্সেন্টেজ ডিসপ্লে</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ কোনো ডিসপ্লে নেই (অনুমান নির্ভর)</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">কন্ট্রোল সিস্টেম</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ সেনসিটিভ স্মার্ট টাচ সেন্সর কন্ট্রোল</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ জটিল বোতাম প্রেস</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">কালার ভ্যারাইটি</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ Brown, Green & White ৩টি ক্লাসিক কালার</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ শুধুমাত্র সাধারণ কালো রঙ</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">অফার মূল্য ও মান</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ মাত্র ৬৫০ টাকায় প্রিমিয়াম লাক্সারি ফিল</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ১০০০+ টাকা দিয়েও নিম্নমানের বিল্ড</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ P9 PRO MAX LUXURY DESIGN & OVER-EAR ACOUSTICS SHOWCASE ══ */}
                {isP9 && (
                    <section className="py-16 md:py-20 bg-zinc-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto px-4 md:px-10 relative z-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.2em] uppercase bg-white/10 border border-white/20 text-zinc-300 rounded-full px-4 py-1.5 mb-3">
                                    AESTHETIC OVER-EAR WIRELESS HEADPHONE
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                    AirPods Max ইন্সপায়ার্ড লাক্সারি লুক ও ৪০মিমি ডিপ বেস অডিও
                                </h2>
                                <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
                                    সাধারণ প্লাস্টিক হেডফোন নয় — কানে দিলেই পাবেন ক্লাসি মেটালিক ফিনিশ, আল্ট্রা-সফট ফোম কুশন ও সিনেমাটিক সাউন্ড অভিজ্ঞতা
                                </p>
                            </div>

                            {/* 5 Aesthetic Colors */}
                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-sm">
                                <h3 className="text-lg font-bold text-center text-zinc-200 mb-6 flex items-center justify-center gap-2">
                                    <span>🎨</span> ৫টি আকর্ষণীয় প্রিমিয়াম কালার ভ্যারিয়েন্ট
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                                    {[
                                        { name: "Space Black", bn: "কালো", desc: "বোল্ড ও ক্লাসিক স্টাইল", bg: "#18181b", border: "#3f3f46", badge: "সবচেয়ে জনপ্রিয় 🔥" },
                                        { name: "Silver White", bn: "সিলভার / সাদা", desc: "মিনিমালিস্ট ও লাক্সারি ভাইব", bg: "#e4e4e7", border: "#cbd5e1", textDark: true, badge: "ট্রেন্ডি লুক ✨" },
                                        { name: "Sky Blue", bn: "স্কাই ব্লু", desc: "কুল ও এলিগেন্ট ভাইব", bg: "#0284c7", border: "#38bdf8", badge: "ইউনিক চয়েস 💎" },
                                        { name: "Rose Pink", bn: "রোজ পিঙ্ক", desc: "কিউট ও প্রিমিয়াম ফিনিশ", bg: "#f43f5e", border: "#fda4af", badge: "স্টাইলিশ 🌸" },
                                        { name: "Mint Green", bn: "মিন্ট গ্রিন", desc: "সতেজ ও ফ্রেশ লুক", bg: "#059669", border: "#6ee7b7", badge: "ফ্রেশ কালার 🍃" },
                                    ].map((col, idx) => (
                                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:border-white/40 transition-all">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">{col.badge}</span>
                                            <div className="w-11 h-11 rounded-full border-2 shadow-inner my-1" style={{ backgroundColor: col.bg, borderColor: col.border }} />
                                            <div>
                                                <p className="font-black text-white text-sm">{col.bn}</p>
                                                <span className="text-[11px] text-zinc-400 font-medium">{col.name}</span>
                                            </div>
                                            <span className="text-[10px] text-zinc-500 mt-0.5">{col.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-bold">
                                        🔊
                                    </div>
                                    <h3 className="text-xl font-black text-white">৪০মিমি পাওয়ারফুল ড্রাইভার — স্টুডিও সাউন্ড ও সুপার বেস</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        P9 Pro Max-এ ব্যবহৃত হয়েছে বড় ৪০ মিমি ডায়নামিক অডিও ড্রাইভার। প্রতিটি বিটে পাবেন তীব্র পাঞ্চি বেস, ক্রিস্টাল ক্লিয়ার ভোকাল ও ব্যালান্সড মিউজিক। মুভি দেখতে বা গেমিংয়ে প্রতিটি সাউন্ড ইফেক্ট পাবেন নিখুঁতভাবে।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-indigo-300">
                                        <span>✓ ৪০ মিমি ডায়নামিক ড্রাইভার</span>
                                        <span>•</span>
                                        <span>✓ সিনেমাটিক থিয়েটার বেস</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold">
                                        ☁️
                                    </div>
                                    <h3 className="text-xl font-black text-white">আল্ট্রা-সফট মেমোরি ফোম — ঘণ্টার পর ঘণ্টা নো-পেইন কমফোর্ট</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        দীর্ঘক্ষণ ব্যবহারের জন্য ডিজাইন করা নরম ব্রিদেবল মেশ ও মেমোরি ফোম কুশন কানের ওপর কোনো ধরনের চাপ ফেলে না। অ্যাডজাস্টেবল হেডব্যান্ড যেকোনো সাইজের মাথায় আরামদায়কভাবে ফিট হয়ে যায়।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <span>✓ ব্রিদেবল নরম কুশন</span>
                                        <span>•</span>
                                        <span>✓ অ্যাডজাস্টেবল স্টেইনলেস হেডব্যান্ড</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ P9 COMPARISON TABLE ══ */}
                {isP9 && (
                    <section className="py-16 md:py-20" style={{ background: "#f8f8fc" }}>
                        <div className="max-w-4xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                    পার্থক্য দেখুন
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                    কেন P9 Pro MAX সাধারণ হেডফোনের চেয়ে সেরা?
                                </h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 bg-zinc-50">
                                                <th className="py-4 px-5 text-xs font-black text-zinc-500 uppercase">ফিচার</th>
                                                <th className="py-4 px-5 text-sm font-black text-emerald-700 bg-emerald-50/80">P9 Pro MAX (৳৫৯৮)</th>
                                                <th className="py-4 px-5 text-xs font-black text-zinc-400">সাধারণ সস্তা হেডফোন</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-sm">
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ডিজাইন ও লুক</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ প্রিমিয়াম মেটালিক ফিনিশ & লাক্সারি লুক</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ সাধারণ সস্তা প্লাস্টিক বডি</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ইয়ার কুশন কমফোর্ট</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ সফট মেমোরি ফোম (কান ব্যথা করে না)</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ শক্ত প্লাস্টিক/রাবার (কানে ব্যথা করে)</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">সাউন্ড ও বেস ড্রাইভার</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ৪০মিমি পাওয়ারফুল ডায়নামিক ড্রাইভার</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ কমজোর ড্রাইভার, বেস ছাড়া ফাঁকা আওয়াজ</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ব্যাটারি ব্যাকআপ</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ৮-১০ ঘণ্টা ননস্টপ মিউজিক প্লেব্যাক</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ১-২ ঘণ্টার মাথায় চার্জ শেষ হয়ে যায়</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">কালার কালেকশন</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ৫টি প্রিমিয়াম ট্রেন্ডি কালার ভ্যারিয়েন্ট</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ১-২টি রঙে পাওয়া যায়</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">অফার প্রাইস ও ভ্যালু</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ মাত্র ৫৯৮ টাকায় অসাধারণ ভ্যালু ফর মানি</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ১০০০+ টাকা দিয়েও বাজে কোয়ালিটি</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ ANC vs ENC AUDIO SHOWCASE ══ */}
                {isHoco && (
                    <section className="py-16 md:py-20 bg-zinc-950 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto px-4 md:px-10 relative z-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.2em] uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full px-4 py-1.5 mb-3">
                                    DUAL NOISE CANCELLATION
                                </span>
                                <h2 className="text-2xl md:text-4xl font-black text-white mb-3">
                                    ANC + ENC ডুয়েল নয়েজ ক্যানসেলেশন
                                </h2>
                                <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
                                    গান শোনা হোক কিংবা কথা বলা — বাইরের যেকোনো গোলমাল থেকে পান সম্পূর্ণ ক্লিয়ার সাউন্ড
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold">
                                        🎧
                                    </div>
                                    <h3 className="text-xl font-black text-white">Active Noise Cancellation (ANC)</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        ২৫-৩০dB পর্যন্ত বাইরের হইচই ও ট্রান্সপোর্ট নয়েজ কমানোর ক্ষমতাসম্পন্ন স্মার্ট ANC অ্যালগরিদম। মেস, ড্রাইভ বা ট্রাফিকের আড্ডার মাঝেও ব্যাকগ্রাউন্ড গোলমাল মুক্ত নিবিড় অডিও অভিজ্ঞতা দেয়।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-emerald-400">
                                        <span>✓ ২৫-৩০dB নয়েজ রিডাকশন</span>
                                        <span>•</span>
                                        <span>✓ বাস/ট্রাফিকে নিখুঁত অডিও</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-4 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-bold">
                                        🎙️
                                    </div>
                                    <h3 className="text-xl font-black text-white">Environmental Noise Cancellation (ENC)</h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        ডুয়েল মাইক্রোফোন ও স্মার্ট ভয়েস এলগরিদম। কল করার সময় বাতাস, অনাকাঙ্ক্ষিত শোরগোল বা পেছনের ভয়েস ফিল্টার করে একদম এইচডি কোয়ালিটিতে কথা বলতে সাহায্য করে।
                                    </p>
                                    <div className="mt-auto pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-indigo-400">
                                        <span>✓ HD ভয়েস কলিং</span>
                                        <span>•</span>
                                        <span>✓ নয়েজ-ফ্রি মাইক্রোফোন</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══ COMPARISON TABLE (HOCO) ══ */}
                {isHoco && (
                    <section className="py-16 md:py-20" style={{ background: "#f8f8fc" }}>
                        <div className="max-w-4xl mx-auto px-4 md:px-10">
                            <div className="text-center mb-12">
                                <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                    পার্থক্য দেখুন
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                    কেন Hoco EQ34 Plus বাজারের অন্যান্য এয়ারবাডসের চেয়ে এগিয়ে?
                                </h2>
                            </div>

                            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-zinc-100 bg-zinc-50">
                                                <th className="py-4 px-5 text-xs font-black text-zinc-500 uppercase">ফিচার</th>
                                                <th className="py-4 px-5 text-sm font-black text-emerald-700 bg-emerald-50/80">Hoco EQ34 Plus (৳৯৪৯)</th>
                                                <th className="py-4 px-5 text-xs font-black text-zinc-400">সাধারণ TWS এয়ারবাডস</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 text-sm">
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">Active Noise Cancellation (ANC)</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ ২৫-৩০dB ANC সাপোর্ট</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ কোনো ANC নেই</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">কল নয়েজ ক্যানসেলেশন (ENC)</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ HD ডুয়েল মাইক ENC</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ সাধারণ জিরঝির মাইক</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">ব্লুটুথ ভার্সন & চিপসেট</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ Bluetooth 5.4 (JL AC7003)</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ পোর Bluetooth 5.0/5.1</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">স্পিকার ড্রাইভার সাইজ</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ 13mm Dynamic Driver (Deep Bass)</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ ৮-১০mm ছোট ড্রাইভার</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">অফিসিয়াল অ্যাপ সাপোর্ট</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ Hoco App Config & Touch Edit</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ অ্যাপ সাপোর্ট নেই</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 px-5 font-bold text-zinc-900">মোট ব্যাটারি প্লেব্যাক</td>
                                                <td className="py-4 px-5 font-black text-emerald-600 bg-emerald-50/30">✅ মোট ২৮ ঘণ্টা চার্জ ব্যাকআপ</td>
                                                <td className="py-4 px-5 text-zinc-400">❌ মাত্র ৮-১০ ঘণ্টা</td>
                                            </tr>
                                        </tbody>
                                    </table>
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

                {/* ══ FAQ SECTION ══ */}
                <section className="py-16 md:py-20 bg-white">
                    <div className="max-w-3xl mx-auto px-4 md:px-10">
                        <div className="text-center mb-12">
                            <span className="inline-block text-[11px] font-black tracking-[0.25em] uppercase bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-4 py-1.5 mb-3">
                                সাধারণ প্রশ্নাবলী
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-zinc-950">
                                প্রায়শই জিজ্ঞাসিত প্রশ্ন (FAQ)
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {currentFaqs.map((faq, i) => (
                                <div key={i} className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 transition-all">
                                    <h3 className="font-black text-zinc-900 text-base mb-2 flex items-center gap-2">
                                        <span className="text-emerald-600 font-extrabold text-lg">Q.</span>
                                        {faq.q}
                                    </h3>
                                    <p className="text-zinc-600 text-sm leading-relaxed pl-6">
                                        {faq.a}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

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
                                    product={primaryProduct}
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

                {/* ══ STICKY MOBILE ORDER BAR ══ */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 shadow-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase truncate">{primaryProduct?.name || page.title}</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-zinc-950">{formatPrice(effectivePrice)}</span>
                            {originalPrice > effectivePrice && (
                                <span className="text-xs text-zinc-400 line-through">{formatPrice(originalPrice)}</span>
                            )}
                        </div>
                    </div>
                    <a href="#order-form"
                        className="lp-wa-btn shrink-0 inline-flex items-center justify-center gap-2 font-black text-sm py-3 px-5 rounded-xl text-white"
                        style={WA_STYLE}>
                        🛒 এখনই অর্ডার করুন
                    </a>
                </div>

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
