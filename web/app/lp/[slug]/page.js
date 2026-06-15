// app/lp/[slug]/page.js — Facebook-style Landing Page (Server Component)
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import LandingPageClient from "./LandingPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
    try {
        const { slug } = await params;
        const page = await prisma.landingPage.findUnique({ where: { slug } });
        if (!page) return { title: "Not Found" };
        return {
            title: page.heroTitle || page.title,
            description: page.heroDescription || "",
            alternates: {
                canonical: `/lp/${slug}`,
            }
        };
    } catch {
        return { title: "Landing Page" };
    }
}

export default async function LandingPage({ params }) {
    const { slug } = await params;

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
        // Show page not found if DB fails
        notFound();
    }

    // isActive check removed intentionally — show page regardless if slug matches
    if (!page) notFound();

    const primaryProduct = page.products?.[0]?.product;
    const allProducts = page.products?.map((p) => p.product).filter(Boolean) || [];

    const heroImg =
        page.heroImageUrl ||
        primaryProduct?.productImages?.[0]?.url ||
        (Array.isArray(primaryProduct?.images) ? primaryProduct.images[0] : null) ||
        null;

    return (
        <div className="min-h-screen bg-white font-sans">

            {/* ── HERO SECTION ── */}
            <section
                className="relative min-h-[75vh] flex flex-col items-center justify-center text-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
            >
                {heroImg && (
                    <div className="absolute inset-0">
                        <Image src={heroImg} alt="Hero" fill className="object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                    </div>
                )}

                <div className="relative z-10 max-w-3xl mx-auto px-4 py-16">
                    {page.countdownEnd && (
                        <div className="inline-flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full mb-6 animate-pulse uppercase tracking-widest">
                            🔥 Limited Time Offer
                        </div>
                    )}

                    {page.discountCode && (
                        <div className="inline-block bg-yellow-400 text-gray-900 text-sm font-black px-4 py-1.5 rounded-lg mb-5 tracking-wider">
                            🎁 Extra Discount Code: {page.discountCode}
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-5 drop-shadow-lg">
                        {page.heroTitle || page.title}
                    </h1>

                    {page.heroDescription && (
                        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
                            {page.heroDescription}
                        </p>
                    )}

                    {page.countdownEnd && <LandingPageClient countdownEnd={page.countdownEnd.toISOString()} />}

                    <Link
                        href={primaryProduct ? `/checkout/express/${primaryProduct.id}` : "/shop"}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-lg px-10 py-5 rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:shadow-[0_0_60px_rgba(220,38,38,0.7)] transition-all hover:scale-105 uppercase tracking-wide mt-4"
                    >
                        {page.ctaText || "অর্ডার করুন এখনই"} →
                    </Link>

                    <div className="flex items-center justify-center gap-4 mt-6 text-gray-400 text-xs">
                        <span>✅ ক্যাশ অন ডেলিভারি</span>
                        <span>✅ ফ্রি রিটার্ন</span>
                        <span>✅ ১০০% অরিজিনাল</span>
                    </div>
                </div>
            </section>

            {/* ── PRIMARY PRODUCT SECTION ── */}
            {primaryProduct && (
                <section className="py-16 bg-gray-50 border-b">
                    <div className="max-w-5xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-10 items-center">
                            <div className="space-y-3">
                                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white border">
                                    {heroImg || primaryProduct.productImages?.[0]?.url ? (
                                        <Image
                                            src={heroImg || primaryProduct.productImages[0].url}
                                            alt={primaryProduct.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">📦</div>
                                    )}
                                </div>
                                {primaryProduct.productImages?.length > 1 && (
                                    <div className="flex gap-2">
                                        {primaryProduct.productImages.slice(1, 4).map((img, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                                                <Image src={img.url} alt="" fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-5">
                                <h2 className="text-3xl font-black text-gray-900">{primaryProduct.name}</h2>

                                <div className="flex items-end gap-3">
                                    <span className="text-4xl font-black text-red-600">
                                        {formatPrice(primaryProduct.salePrice ?? primaryProduct.price)}
                                    </span>
                                    {primaryProduct.salePrice && (
                                        <>
                                            <span className="text-xl text-gray-400 line-through">
                                                {formatPrice(primaryProduct.price)}
                                            </span>
                                            <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-md">
                                                {Math.round(((primaryProduct.price - primaryProduct.salePrice) / primaryProduct.price) * 100)}% OFF
                                            </span>
                                        </>
                                    )}
                                </div>

                                {primaryProduct.shortDesc && (
                                    <p className="text-gray-600 leading-relaxed">{primaryProduct.shortDesc}</p>
                                )}

                                <div className="space-y-2">
                                    {[
                                        "✅ ক্যাশ অন ডেলিভারি",
                                        "✅ ঢাকার ভেতরে ৭০ টাকা ডেলিভারি",
                                        "✅ ঢাকার বাইরে ১৩০ টাকা",
                                        "✅ সারাদেশে ডেলিভারি",
                                    ].map((b) => (
                                        <p key={b} className="text-gray-700 text-sm font-medium">{b}</p>
                                    ))}
                                </div>

                                <Link
                                    href={`/checkout/express/${primaryProduct.id}`}
                                    className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-black text-lg py-5 rounded-xl shadow-lg transition-all hover:scale-[1.02] uppercase tracking-wide"
                                >
                                    🛒 এখনই অর্ডার করুন
                                </Link>

                                <p className="text-center text-xs text-gray-400">Stock সীমিত — এখনই অর্ডার করুন</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── ALL PRODUCTS GRID ── */}
            {allProducts.length > 1 && (
                <section className="py-16 bg-white">
                    <div className="max-w-5xl mx-auto px-4">
                        <h2 className="text-2xl font-black text-center text-gray-900 mb-10">আরও পণ্য দেখুন</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {allProducts.map((product) => {
                                if (!product) return null;
                                const img =
                                    product.productImages?.[0]?.url ||
                                    (Array.isArray(product.images) ? product.images[0] : null);
                                return (
                                    <Link
                                        key={product.id}
                                        href={`/checkout/express/${product.id}`}
                                        className="group border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-white"
                                    >
                                        <div className="relative aspect-square bg-gray-100">
                                            {img ? (
                                                <Image
                                                    src={img}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📦</div>
                                            )}
                                            {product.salePrice && (
                                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                    SALE
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="font-bold text-sm text-gray-900 line-clamp-2">{product.name}</p>
                                            <p className="text-red-600 font-black mt-1">
                                                {formatPrice(product.salePrice ?? product.price)}
                                            </p>
                                            {product.salePrice && (
                                                <p className="text-xs text-gray-400 line-through">
                                                    {formatPrice(product.price)}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── TESTIMONIALS ── */}
            {page.showTestimonials && (
                <section className="py-16 bg-gray-50">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-2xl font-black text-gray-900 mb-10">কাস্টমারদের রিভিউ</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { name: "রাহেলা বেগম", text: "অনেক সুন্দর পণ্য, সময়মতো ডেলিভারি পেয়েছি!", rating: 5 },
                                { name: "করিম সাহেব", text: "দুর্দান্ত কোয়ালিটি, আবার অর্ডার করব।", rating: 5 },
                                { name: "শাহিনুর রহমান", text: "দাম এবং মান অনুযায়ী খুবই ভালো।", rating: 5 },
                            ].map((review, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border text-left">
                                    <div className="flex text-yellow-400 mb-2 text-sm">{"★".repeat(review.rating)}</div>
                                    <p className="text-gray-700 text-sm leading-relaxed mb-3">"{review.text}"</p>
                                    <p className="text-gray-500 text-xs font-semibold">— {review.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── BOTTOM CTA ── */}
            <section className="py-14 text-center bg-red-600 text-white">
                <h2 className="text-2xl md:text-3xl font-black mb-3">দেরি না করে এখনই অর্ডার করুন!</h2>
                <p className="text-red-100 mb-6 text-sm">Stock সীমিত — শেষ হওয়ার আগেই নিশ্চিত করুন</p>
                <Link
                    href={primaryProduct ? `/checkout/express/${primaryProduct.id}` : "/shop"}
                    className="inline-flex items-center gap-2 bg-white text-red-600 font-black text-lg px-10 py-4 rounded-full hover:bg-gray-100 transition-all hover:scale-105 uppercase tracking-wide shadow-lg"
                >
                    🛒 {page.ctaText || "অর্ডার করুন এখনই"}
                </Link>
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
