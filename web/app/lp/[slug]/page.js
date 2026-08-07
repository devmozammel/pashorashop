// app/lp/[slug]/page.js — Premium Animated E-commerce Landing Page
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import LandingPageClient from "./LandingPageClient";
import LandingPageGallery from "./LandingPageGallery";

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
                                productImages: { orderBy: { sortOrder: "asc" }, take: 5 },
                                variants: true,
                            },
                        },
                    },
                },
            },
        });
    } catch (err) {
        console.error("[LP Page] DB Error:", err.message);
        notFound();
    }

    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    let similarProducts = [];
    if (primaryProduct) {
        try {
            const excludeIds = allProducts.map((p) => p.id).filter(Boolean);
            similarProducts = await prisma.product.findMany({
                where: {
                    isActive: true,
                    id: { notIn: excludeIds },
                    categoryId: primaryProduct.categoryId || undefined,
                },
                take: 4,
                include: { productImages: { orderBy: { sortOrder: "asc" }, take: 1 } },
            });
            if (similarProducts.length < 4) {
                const alreadyFetchedIds = [...excludeIds, ...similarProducts.map((p) => p.id)];
                const extraProducts = await prisma.product.findMany({
                    where: { isActive: true, id: { notIn: alreadyFetchedIds } },
                    take: 4 - similarProducts.length,
                    include: { productImages: { orderBy: { sortOrder: "asc" }, take: 1 } },
                });
                similarProducts = [...similarProducts, ...extraProducts];
            }
        } catch (simError) {
            console.error("[LP Page] Similar products fetch failed:", simError.message);
        }
    }

    // Apply flash sale pricing
    const now = new Date();
    try {
        const productIdsToCheck = [
            ...allProducts.map((p) => p.id),
            ...similarProducts.map((p) => p.id)
        ].filter(Boolean);
        const activeFlashSaleItems = await prisma.flashSaleItem.findMany({
            where: {
                productId: { in: productIdsToCheck },
                isActive: true,
                flashSale: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } }
            }
        });
        const flashSalePriceMap = {};
        activeFlashSaleItems.forEach((item) => { flashSalePriceMap[item.productId] = item.salePrice; });
        if (primaryProduct && flashSalePriceMap[primaryProduct.id]) {
            primaryProduct.salePrice = flashSalePriceMap[primaryProduct.id];
            primaryProduct.discountPrice = flashSalePriceMap[primaryProduct.id];
        }
        allProducts.forEach((p) => { if (flashSalePriceMap[p.id]) { p.salePrice = flashSalePriceMap[p.id]; p.discountPrice = flashSalePriceMap[p.id]; } });
        similarProducts.forEach((p) => { if (flashSalePriceMap[p.id]) { p.salePrice = flashSalePriceMap[p.id]; p.discountPrice = flashSalePriceMap[p.id]; } });
    } catch (fsError) {
        console.error("[LP Page] Flash sale pricing fetch failed:", fsError.message);
    }

    const heroImg =
        page.heroImageUrl ||
        primaryProduct?.productImages?.[0]?.url ||
        (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null) ||
        null;

    const defaultTestimonials = [
        { name: "তানজিম আহমেদ", text: "জার্সির ফেব্রিকটা অসাধারণ, প্লেয়ার ফিট সাইজটা একদম পারফেক্ট হয়েছে। ডেলিভারিও খুব দ্রুত পেয়েছি।", rating: 5 },
        { name: "জাহিদুল হাসান", text: "অরিজিনাল কালার ও নিখুঁত এমব্রয়ডারি লোগো। ৩-স্টার ব্যাজটাও দেখতে গর্জিয়াস লাগে।", rating: 5 },
        { name: "রাফসান ইসলাম", text: "যেমনটা ছবিতে দেখেছি ঠিক তেমনটাই পেয়েছি। প্রাইজ অনুযায়ী কোয়ালিটি বেশ ভালো।", rating: 5 },
    ];

    let testimonials = defaultTestimonials;
    if (page.testimonialsJson) {
        try {
            const parsed = JSON.parse(page.testimonialsJson);
            if (Array.isArray(parsed) && parsed.length > 0) testimonials = parsed;
        } catch (err) {
            console.error("[LP Page] Error parsing testimonialsJson:", err);
        }
    }

    const trustBadges = [
        { icon: "🚚", label: "ক্যাশ অন ডেলিভারি" },
        { icon: "✅", label: "১০০% অরিজিনাল" },
        { icon: "🔄", label: "ফ্রি রিটার্ন" },
        { icon: "🛡️", label: "সিকিউর পেমেন্ট" },
    ];

    return (
        <div className="min-h-screen bg-white font-sans overflow-x-hidden">
            {/* ══════════════════════════════════════
                HERO — full-bleed dark cinematic banner
            ══════════════════════════════════════ */}
            <section
                className="relative min-h-[100svh] flex flex-col items-center justify-center text-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0a0a0f 0%, #111827 45%, #0f172a 100%)" }}
            >
                {/* animated background orbs */}
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
                    style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 blur-[120px] pointer-events-none"
                    style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }} />
                <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[100px] pointer-events-none"
                    style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />

                {/* subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

                {/* hero image overlay */}
                {heroImg && (
                    <div className="absolute inset-0">
                        <Image src={heroImg} alt="Hero" fill className="object-cover opacity-10 mix-blend-luminosity" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)" }} />
                    </div>
                )}

                <div className="relative z-10 max-w-4xl mx-auto px-5 py-24 md:py-32">
                    {/* Top badge */}
                    {page.countdownEnd && (
                        <div className="inline-flex items-center gap-2 border border-red-500/40 bg-red-500/10 backdrop-blur text-red-400 text-xs font-bold px-5 py-2 rounded-full mb-7 uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                            সীমিত সময়ের অফার — এখনই সুযোগ নিন
                        </div>
                    )}

                    {page.discountCode && (
                        <div className="inline-flex items-center gap-2 bg-amber-400 text-gray-900 text-sm font-black px-5 py-2 rounded-xl mb-5 tracking-wider">
                            🎁 কুপন কোড: <span className="font-mono border-l border-gray-900/20 pl-2 ml-1">{page.discountCode}</span>
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight"
                        style={{ textShadow: "0 0 60px rgba(99,102,241,0.3)" }}>
                        {page.heroTitle || page.title}
                    </h1>

                    {page.heroDescription && (
                        <p className="text-base md:text-xl text-gray-300/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                            {page.heroDescription}
                        </p>
                    )}

                    {page.countdownEnd && <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />}

                    {/* CTA button */}
                    <Link
                        href={primaryProduct ? `/checkout/express/${primaryProduct.id}` : "/shop"}
                        className="group inline-flex items-center gap-3 text-white font-black text-lg px-10 py-5 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/40 uppercase tracking-wide mt-4"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
                    >
                        <span>🛒 {page.ctaText || "এখনই অর্ডার করুন"}</span>
                        <span className="text-2xl group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </Link>

                    {/* Trust row */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
                        {trustBadges.map((b) => (
                            <span key={b.label} className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                                <span>{b.icon}</span> {b.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* scroll hint */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 text-xs">
                    <span>স্ক্রোল করুন</span>
                    <span className="animate-bounce text-lg">↓</span>
                </div>
            </section>

            {/* ══════════════════════════════════════
                PRODUCT CARDS — all 3 mixed horizontally
            ══════════════════════════════════════ */}
            {allProducts.length > 0 && (
                <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-indigo-600 mb-3">এই সপ্তাহের সেরা ডিল</span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900">আমাদের বেস্ট সেলার প্রোডাক্টস</h2>
                            <div className="mt-4 mx-auto w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #ec4899)" }} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {allProducts.map((product, idx) => {
                                if (!product) return null;
                                const img =
                                    product.productImages?.[0]?.url ||
                                    (Array.isArray(product.images) ? product.images[0] : null);
                                const discount = product.salePrice && product.price
                                    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
                                    : null;
                                const isMain = idx === 0;

                                return (
                                    <div key={product.id}
                                        className={`group relative rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col ${isMain ? "ring-2 ring-indigo-500/40" : ""}`}>
                                        {isMain && (
                                            <div className="absolute top-4 left-4 z-20 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                ⭐ টপ পিক
                                            </div>
                                        )}
                                        {discount && discount > 0 && (
                                            <div className="absolute top-4 right-4 z-20 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                                                -{discount}%
                                            </div>
                                        )}

                                        {/* Product image */}
                                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                            {img ? (
                                                <Image
                                                    src={img}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">📦</div>
                                            )}
                                            {/* gradient overlay on image */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        {/* Info */}
                                        <div className="p-5 flex flex-col gap-3 flex-1">
                                            <h3 className="font-black text-gray-900 text-sm md:text-base leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                                                {product.name}
                                            </h3>

                                            <div className="flex items-end gap-2 flex-wrap">
                                                {(product.salePrice || product.price) > 0 ? (
                                                    <>
                                                        <span className="text-2xl font-black text-indigo-600">
                                                            {formatPrice(product.salePrice ?? product.price)}
                                                        </span>
                                                        {product.salePrice && product.price > 0 && (
                                                            <span className="text-sm text-gray-400 line-through">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-500 font-semibold">মূল্য জানতে অর্ডার করুন</span>
                                                )}
                                            </div>

                                            {/* Feature bullets */}
                                            <div className="flex flex-col gap-1.5">
                                                {[
                                                    "✅ ক্যাশ অন ডেলিভারি",
                                                    "✅ ১০০% অরিজিনাল প্রোডাক্ট",
                                                    "✅ দ্রুত ডেলিভারি সারাদেশে",
                                                ].map((f) => (
                                                    <span key={f} className="text-xs text-gray-600">{f}</span>
                                                ))}
                                            </div>

                                            <Link
                                                href={`/checkout/express/${product.id}`}
                                                className="mt-auto block text-center text-white font-black text-sm py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                                            >
                                                🛒 এখনই অর্ডার করুন
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                PRIMARY PRODUCT DETAILS (first product)
            ══════════════════════════════════════ */}
            {primaryProduct && (
                <section className="py-20" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)" }}>
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Gallery */}
                            <div className="rounded-3xl overflow-hidden shadow-2xl">
                                <LandingPageGallery
                                    images={
                                        primaryProduct.productImages?.map((img) => img.url).filter(Boolean).length > 0
                                            ? primaryProduct.productImages.map((img) => img.url).filter(Boolean)
                                            : (heroImg ? [heroImg] : [])
                                    }
                                    productName={primaryProduct.name}
                                />
                            </div>

                            {/* Details */}
                            <div className="space-y-6">
                                <div>
                                    <span className="text-xs font-black tracking-widest uppercase text-indigo-400">ফিচার্ড প্রোডাক্ট</span>
                                    <h2 className="text-2xl md:text-3xl font-black text-white mt-2 leading-snug">{primaryProduct.name}</h2>
                                </div>

                                <div className="flex items-end gap-3 flex-wrap">
                                    {(primaryProduct.salePrice || primaryProduct.price) > 0 ? (
                                        <>
                                            <span className="text-4xl font-black" style={{ color: "#a78bfa" }}>
                                                {formatPrice(primaryProduct.salePrice ?? primaryProduct.price)}
                                            </span>
                                            {primaryProduct.salePrice && primaryProduct.price > 0 && (
                                                <>
                                                    <span className="text-xl text-gray-500 line-through">{formatPrice(primaryProduct.price)}</span>
                                                    <span className="bg-red-500/20 text-red-400 text-sm font-black px-3 py-1 rounded-full">
                                                        {Math.round(((primaryProduct.price - primaryProduct.salePrice) / primaryProduct.price) * 100)}% ছাড়
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-white font-semibold text-lg">মূল্য জানতে অর্ডার করুন</span>
                                    )}
                                </div>

                                {primaryProduct.shortDesc && (
                                    <p className="text-gray-300 leading-relaxed text-sm">{primaryProduct.shortDesc}</p>
                                )}

                                {/* Delivery info */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: "🚚", text: "ক্যাশ অন ডেলিভারি" },
                                        { icon: "📦", text: "ঢাকায় ৭০ টাকা" },
                                        { icon: "🌍", text: "সারাদেশে ডেলিভারি" },
                                        { icon: "🛡️", label: "১০০% অরিজিনাল", text: "১০০% অরিজিনাল" },
                                    ].map((item) => (
                                        <div key={item.text} className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
                                            <span className="text-base">{item.icon}</span>
                                            <span className="text-xs text-gray-300 font-medium">{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    href={`/checkout/express/${primaryProduct.id}`}
                                    className="block w-full text-center text-white font-black text-lg py-5 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] uppercase tracking-wide"
                                    style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
                                >
                                    🛒 এখনই অর্ডার করুন
                                </Link>

                                <p className="text-center text-xs text-gray-500">⚡ Stock সীমিত — এখনই নিশ্চিত করুন</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                PRODUCT DESCRIPTION
            ══════════════════════════════════════ */}
            {primaryProduct?.description && (
                <section className="py-16 bg-white">
                    <div className="max-w-3xl mx-auto px-4">
                        <h2 className="text-2xl md:text-3xl font-black text-center text-gray-900 mb-2 relative">
                            পণ্যের বিস্তারিত বিবরণ
                        </h2>
                        <div className="flex justify-center mb-10">
                            <div className="w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #ec4899)" }} />
                        </div>
                        <div
                            className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 break-words overflow-x-auto"
                            dangerouslySetInnerHTML={{ __html: primaryProduct.description }}
                        />
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                TESTIMONIALS
            ══════════════════════════════════════ */}
            {page.showTestimonials && (
                <section className="py-20 bg-gray-50">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <span className="inline-block text-xs font-black tracking-[0.3em] uppercase text-indigo-600 mb-3">কাস্টমার রিভিউ</span>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900">আমাদের সন্তুষ্ট কাস্টমাররা কি বলেন</h2>
                            <div className="mt-4 mx-auto w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #ec4899)" }} />
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {testimonials.map((review, i) => (
                                <div key={i}
                                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col gap-4">
                                    <div className="flex text-yellow-400 text-lg">
                                        {"★".repeat(Math.min(5, Math.max(1, review.rating || 5)))}
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed flex-1">"{review.text}"</p>
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm"
                                            style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}>
                                            {review.name?.[0] || "?"}
                                        </div>
                                        <div>
                                            <p className="text-gray-900 text-sm font-bold">{review.name}</p>
                                            <p className="text-gray-400 text-xs">✅ Verified Buyer</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                SIMILAR PRODUCTS
            ══════════════════════════════════════ */}
            {similarProducts?.length > 0 && (
                <section className="py-16 bg-white border-t">
                    <div className="max-w-5xl mx-auto px-4">
                        <h2 className="text-2xl font-black text-center text-gray-900 mb-2">আরও পণ্য দেখুন</h2>
                        <div className="flex justify-center mb-10">
                            <div className="w-16 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #6366f1, #ec4899)" }} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                            {similarProducts.map((product) => {
                                if (!product) return null;
                                const img = product.productImages?.[0]?.url || (Array.isArray(product.images) ? product.images[0] : null);
                                return (
                                    <Link key={product.id} href={`/checkout/express/${product.id}`}
                                        className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col">
                                        <div className="relative aspect-square bg-gray-100">
                                            {img ? (
                                                <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">📦</div>
                                            )}
                                            {product.salePrice && <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">SALE</div>}
                                        </div>
                                        <div className="p-3 flex flex-col gap-2 flex-1">
                                            <p className="font-bold text-xs text-gray-900 line-clamp-2">{product.name}</p>
                                            <div className="mt-auto">
                                                <p className="text-indigo-600 font-black text-sm">{formatPrice(product.salePrice ?? product.price)}</p>
                                                {product.salePrice && <p className="text-[10px] text-gray-400 line-through">{formatPrice(product.price)}</p>}
                                            </div>
                                            <button className="w-full text-white text-xs font-bold py-2 rounded-lg transition-colors"
                                                style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
                                                অর্ডার করুন
                                            </button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════
                BOTTOM CTA BANNER
            ══════════════════════════════════════ */}
            <section className="py-20 text-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
                {/* orb glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
                        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
                </div>
                <div className="relative z-10 max-w-xl mx-auto px-4">
                    <div className="inline-block text-3xl mb-4">⚡</div>
                    <h2 className="text-2xl md:text-4xl font-black text-white mb-3">দেরি না করে এখনই অর্ডার করুন!</h2>
                    <p className="text-gray-400 mb-8 text-sm">Stock সীমিত — শেষ হওয়ার আগেই নিশ্চিত করুন</p>
                    <Link
                        href={primaryProduct ? `/checkout/express/${primaryProduct.id}` : "/shop"}
                        className="inline-flex items-center gap-3 text-white font-black text-lg px-12 py-5 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 uppercase tracking-wide"
                        style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)" }}
                    >
                        🛒 {page.ctaText || "অর্ডার করুন এখনই"}
                    </Link>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
                        {trustBadges.map((b) => (
                            <span key={b.label} className="flex items-center gap-1.5 text-gray-500 text-xs">
                                <span>{b.icon}</span> {b.label}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="py-6 border-t text-center text-xs text-gray-400 bg-white">
                <p>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_SITE_NAME || "Authentic Bazar"}. All rights reserved.</p>
                <div className="flex justify-center gap-4 mt-2">
                    <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-gray-600">Terms</Link>
                    <Link href="/contact" className="hover:text-gray-600">Contact</Link>
                </div>
            </footer>
        </div>
    );
}
