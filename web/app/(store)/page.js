import { getSiteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/storefront/Hero";
import ProductCard from "@/components/product/ProductCard";
import FlashSale from "@/components/storefront/FlashSale";
import CategoryCard from "@/components/storefront/CategoryCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { serializePrisma } from "@/lib/serialize";
import { Flame } from "lucide-react";

export const revalidate = 120;

export async function generateMetadata() {
    try {
        const config = await prisma.homepageConfig.findFirst();
        const siteSettingsRaw = await prisma.siteSetting.findUnique({ where: { key: 'store_settings' } });
        
        let siteName = "Pashora Shop";
        if (siteSettingsRaw?.value) {
            try {
                const parsed = JSON.parse(siteSettingsRaw.value);
                if (parsed.siteName) {
                    siteName = parsed.siteName.toLowerCase().includes("shop") ? parsed.siteName : `${parsed.siteName} Shop`;
                }
            } catch (e) {}
        }

        const siteUrl = getSiteUrl();
        const title = `${siteName} | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং`;
        const description = "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন। গ্যাজেট, ফ্যাশন, হোম অ্যাপ্লায়েন্স সহ সব ধরনের পণ্য পাবেন সেরা দামে। সারাদেশে ক্যাশ অন ডেলিভারি।";

        return {
            title: { absolute: title },
            description,
            keywords: ["পাশোরা শপ", "অনলাইন শপিং বাংলাদেশ", "ক্যাশ অন ডেলিভারি", "সেরা দামে পণ্য", "গ্যাজেট", "ফ্যাশন"],
            alternates: { canonical: siteUrl },
            openGraph: {
                title,
                description,
                url: siteUrl,
                siteName,
                images: [{ url: `${siteUrl}/logo.png`, width: 1200, height: 630, alt: `${siteName} - অনলাইন শপিং` }],
                locale: "bn_BD",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [`${siteUrl}/logo.png`],
            },
        };
    } catch (e) {
        const siteUrl = getSiteUrl();
        return {
            title: { absolute: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং" },
            description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন। সারাদেশে ক্যাশ অন ডেলিভারি।",
            alternates: { canonical: siteUrl },
            openGraph: {
                title: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং",
                description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন।",
                images: [{ url: `${siteUrl}/logo.png`, width: 1200, height: 630, alt: "Pashora Shop" }],
                locale: "bn_BD",
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং",
                description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন।",
                images: [`${siteUrl}/logo.png`],
            },
        };
    }
}

export default async function HomePage() {
    // 1. Fetch Homepage Config and Categories in parallel
    const [config, categoriesRaw] = await Promise.all([
        prisma.homepageConfig.findFirst(),
        prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ showOnHomepage: 'desc' }, { sortOrder: 'asc' }],
            take: 14,
            include: {
                subcategoryGroups: {
                    select: { id: true }
                }
            }
        })
    ]);

    const categories = serializePrisma(categoriesRaw);

    const showFeatured = config?.showFeatured !== false;
    const showNewArrivals = config?.showNewArrivals !== false;
    const showFlashSale = config?.showFlashSale !== false;

    // 2. Prepare parallel promises for conditional DB fetches
    const hotProductsPromise = prisma.product.findMany({
        where: {
            isActive: true,
            OR: [
                { isHot: true },
                { isFeatured: true },
                { salePrice: { not: null } },
                { discountPrice: { not: null } }
            ]
        },
        take: 10,
        orderBy: [{ isHot: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { variants: true }
    });

    const featuredPromise = showFeatured
        ? prisma.product.findMany({
              where: { isActive: true, isFeatured: true },
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: { variants: true }
          })
        : Promise.resolve([]);

    const newArrivalsPromise = showNewArrivals
        ? prisma.product.findMany({
              where: { isActive: true },
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: { variants: true }
          })
        : Promise.resolve([]);

    const now = new Date();
    const flashSalePromise = showFlashSale
        ? prisma.flashSale.findFirst({
              where: {
                  isActive: true,
                  startsAt: { lte: now },
                  endsAt: { gte: now }
              },
              include: {
                  items: {
                      where: { isActive: true },
                      include: {
                          product: {
                              include: { variants: true }
                          }
                      }
                  }
              },
              orderBy: { endsAt: 'asc' }
          })
        : Promise.resolve(null);

    // 3. Execute all conditional fetches concurrently
    const [hotRaw, featuredRaw, newArrivalsRaw, activeFlashSale] = await Promise.all([
        hotProductsPromise,
        featuredPromise,
        newArrivalsPromise,
        flashSalePromise
    ]);

    // 4. Serialize data
    const hotProducts = serializePrisma(hotRaw);
    const featuredProducts = serializePrisma(featuredRaw);
    const newArrivals = serializePrisma(newArrivalsRaw);

    let flashSale = null;
    let flashSaleProducts = [];
    if (activeFlashSale) {
        flashSale = serializePrisma(activeFlashSale);
        flashSaleProducts = activeFlashSale.items.map(item => {
            const p = serializePrisma(item.product);
            return {
                ...p,
                salePrice: item.salePrice,
                discountPrice: item.salePrice
            };
        });
    }


    return (
        <div className="flex flex-col gap-8 md:gap-10 pb-16">
            {/* ── HERO SECTION ── */}
            <div className="container mx-auto px-4 pt-3 sm:pt-4">
                <Hero config={config} />
            </div>

            {/* ── CATEGORIES ── */}
            {categories.length > 0 && (
                <section className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-4 sm:h-5 bg-emerald-600 rounded-full" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                                ক্যাটাগরি
                            </h2>
                        </div>
                        <Link
                            href="/shop"
                            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            সকল ক্যাটাগরি →
                        </Link>
                    </div>

                    {/* Mobile: horizontal scroll */}
                    <div className="flex sm:hidden overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth -mx-4 px-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex-shrink-0 w-28">
                                <CategoryCard cat={cat} />
                            </div>
                        ))}
                    </div>

                    {/* Tablet & Desktop: grid */}
                    <div className="hidden sm:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
                        {categories.map((cat) => (
                            <CategoryCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── HOT PRODUCTS SECTION ── */}
            {hotProducts.length > 0 && (
                <section id="hot-products" className="container mx-auto px-4 scroll-mt-24">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-4 sm:h-5 bg-rose-600 rounded-full" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                                হট ও ট্রেন্ডিং প্রোডাক্ট
                            </h2>
                        </div>
                        <Link 
                            href="/shop?featured=true" 
                            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            সব দেখুন →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {hotProducts.map((product) => (
                            <ProductCard key={product.id} product={product} isHot={true} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── PROMOTIONAL DUAL BANNER STRIP ── */}
            <section className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banner 1: Silver Crest Electric Grinder */}
                    <div className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-white p-5 sm:p-6 flex items-center justify-between group hover:shadow-xs transition-all">
                        <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-600 text-white">
                                ধামাকা অফার
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                সিলভার ক্রেস্ট ইলেকট্রিক গ্রাইন্ডার
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2">
                                ২০০০ ওয়াট হাই পাওয়ার মোটর ও স্টেইনলেস স্টিল বডি — সহজে সব ধরণের মসলা ও কফি ব্লেন্ড করুন!
                            </p>
                            <div className="pt-1.5">
                                <Link
                                    href="/product/silver-crest-hr-2026-2000w-electric-grinder"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-200 hover:bg-amber-600 hover:text-white px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                >
                                    অর্ডার করুন (৳৯৫০) →
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 flex items-center justify-center">
                            <img
                                src="/banners/banner-silvercrest-grinder.jpg"
                                alt="সিলভার ক্রেস্ট ইলেকট্রিক গ্রাইন্ডার"
                                className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    {/* Banner 2: Prestige Electric Cooker */}
                    <div className="relative overflow-hidden rounded-xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white p-5 sm:p-6 flex items-center justify-between group hover:shadow-xs transition-all">
                        <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white">
                                ধামাকা অফার
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                প্রেস্টিজ মাল্টি ফাংশন কুকার
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2">
                                ভাত, স্যুপ, নুডুলস ও ডিম সেদ্ধ করুন এক নিমিষেই — নিরাপদ অটো-কাট ও নন-স্টিক পট!
                            </p>
                            <div className="pt-1.5">
                                <Link
                                    href="/product/prestige-electric-cooker"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                >
                                    অর্ডার করুন (৳৯৫০) →
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 flex items-center justify-center">
                            <img
                                src="/banners/banner-prestige-cooker.jpg"
                                alt="প্রেস্টিজ মাল্টি ফাংশন কুকার"
                                className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FLASH SALE (If Active) ── */}
            {config?.showFlashSale !== false && flashSale && flashSaleProducts.length > 0 && (
                <FlashSale products={flashSaleProducts} endTime={flashSale.endsAt} title={flashSale.title} />
            )}

            {/* ── FEATURED PRODUCTS ── */}
            {config?.showFeatured !== false && featuredProducts.length > 0 && (
                <section className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-4 sm:h-5 bg-emerald-600 rounded-full" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                                ফিচার্ড প্রোডাক্ট
                            </h2>
                        </div>
                        <Link 
                            href="/shop?featured=true" 
                            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            সব দেখুন →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── NEW ARRIVALS ── */}
            {config?.showNewArrivals !== false && newArrivals.length > 0 && (
                <section className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="w-1 h-4 sm:h-5 bg-blue-600 rounded-full" />
                            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                                নতুন পণ্য (New Arrivals)
                            </h2>
                        </div>
                        <Link 
                            href="/shop?sort=newest" 
                            className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                            সব দেখুন →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {newArrivals.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
