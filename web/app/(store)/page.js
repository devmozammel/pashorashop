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
        
        let siteName = "Authentic Bazar Shop";
        if (siteSettingsRaw?.value) {
            try {
                const parsed = JSON.parse(siteSettingsRaw.value);
                if (parsed.siteName) {
                    siteName = parsed.siteName.toLowerCase().includes("shop") ? parsed.siteName : `${parsed.siteName} Shop`;
                }
            } catch (e) {}
        }

        return {
            title: {
                absolute: siteName
            },
            description: "Discover premium fashion at Authentic Bazar. We offer a curated collection of authentic, high-quality clothing and accessories for men and women in Bangladesh.",
        };
    } catch (e) {
        return {
            title: {
                absolute: "Authentic Bazar Shop"
            },
            description: "Discover premium fashion at Authentic Bazar. We offer a curated collection of authentic, high-quality clothing and accessories for men and women in Bangladesh.",
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
                    {/* Banner 1: Organic Green Tea */}
                    <div className="relative overflow-hidden rounded-xl border border-emerald-150 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white p-5 sm:p-6 flex items-center justify-between group hover:shadow-xs transition-all">
                        <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-700 text-white">
                                ১০০% অর্গানিক চা
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                প্রিমিয়াম কাজী &amp; কাজী গ্রিন টি
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2">
                                সতেজতা ও সুস্বাস্থ্যের নির্ভরযোগ্য সঙ্গী — শতভাগ খাঁটি ও তরতাজা টি পাতার কালেকশন।
                            </p>
                            <div className="pt-1.5">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                >
                                    অর্ডার করুন →
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 flex items-center justify-center">
                            <img
                                src="https://res.cloudinary.com/dqijzckfb/image/upload/v1781383822/authentic-bazar/xenfatvpgitkyfi85qie.jpg"
                                alt="কাজী & কাজী গ্রিন টি"
                                className="w-full h-full object-contain rounded-lg drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    {/* Banner 2: Kids Die-cast Racing Cars */}
                    <div className="relative overflow-hidden rounded-xl border border-gray-200/90 bg-gradient-to-r from-slate-50 via-zinc-50/60 to-white p-5 sm:p-6 flex items-center justify-between group hover:shadow-xs transition-all">
                        <div className="relative z-10 max-w-[62%] sm:max-w-[65%] space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-600 text-white">
                                বাচ্চাদের বিশেষ উপহার
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                মেটাল ডাই-কাস্ট রেসিং কার
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-2">
                                প্রিমিয়াম ফিনিশ ও মজবুত মেটাল বডি — আকর্ষণীয় স্পোর্টস সুপারকার মডেল সিরিজ।
                            </p>
                            <div className="pt-1.5">
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:bg-rose-600 hover:text-white px-3.5 py-2 rounded-lg transition-colors shadow-xs"
                                >
                                    কালেকশন দেখুন →
                                </Link>
                            </div>
                        </div>
                        <div className="relative w-28 sm:w-36 h-28 sm:h-36 shrink-0 flex items-center justify-center">
                            <img
                                src="https://res.cloudinary.com/dqijzckfb/image/upload/v1781179124/authentic-bazar/gnommxeb4blm3fs60eow.jpg"
                                alt="মেটাল ডাই-কাস্ট রেসিং কার"
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
