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
        take: 8,
        orderBy: [{ isHot: 'desc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { variants: true }
    });

    const featuredPromise = showFeatured
        ? prisma.product.findMany({
              where: { isActive: true, isFeatured: true },
              take: 8,
              orderBy: { createdAt: 'desc' },
              include: { variants: true }
          })
        : Promise.resolve([]);

    const newArrivalsPromise = showNewArrivals
        ? prisma.product.findMany({
              where: { isActive: true },
              take: 8,
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
        <div className="flex flex-col gap-16 pb-16">
            {/* ── HERO SECTION ── */}
            <Hero config={config} />

            {/* ── CATEGORIES — Mobile scroll + Desktop grid ── */}
            {categories.length > 0 && (
                <section className="container px-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                Shop by Category
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Browse authentic collections by top categories
                            </p>
                        </div>
                    </div>

                    {/* Mobile: horizontal scroll */}
                    <div className="flex sm:hidden overflow-x-auto gap-3.5 pb-4 no-scrollbar scroll-smooth -mx-4 px-4">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex-shrink-0 w-28">
                                <CategoryCard cat={cat} />
                            </div>
                        ))}
                    </div>

                    {/* Tablet & Desktop: grid */}
                    <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
                        {categories.map((cat) => (
                            <CategoryCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </section>
            )}

            {/* ── HOT PRODUCTS SECTION ── */}
            {hotProducts.length > 0 && (
                <section id="hot-products" className="container px-4 scroll-mt-24">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 p-5 md:p-8 border border-orange-200/60 dark:border-orange-500/20 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-tr from-orange-500 to-red-600 text-white rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center animate-pulse">
                                    <Flame className="w-6 h-6 fill-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                            Hot Products
                                        </h2>
                                        <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                                            🔥 HOT DEALS
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5 font-medium">
                                        সবচেয়ে জনপ্রিয় ও হট অফারের সেরা পণ্যসমূহ
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href="/shop?featured=true" 
                                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-red-600 hover:text-red-700 bg-white dark:bg-card px-4 py-2 rounded-full border border-red-100 shadow-sm hover:shadow transition-all self-start sm:self-auto"
                            >
                                View All Deals →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                            {hotProducts.map((product) => (
                                <ProductCard key={product.id} product={product} isHot={true} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured */}
            {config?.showFeatured !== false && featuredProducts.length > 0 && (
                <section className="container px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
                        <Link href="/shop?featured=true" className="text-sm font-medium underline underline-offset-4 text-purple-700">
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {featuredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}

            {/* Flash Sale */}
            {config?.showFlashSale !== false && flashSale && flashSaleProducts.length > 0 && (
                <FlashSale products={flashSaleProducts} endTime={flashSale.endsAt} title={flashSale.title} />
            )}

            {/* New Arrivals */}
            {config?.showNewArrivals !== false && newArrivals.length > 0 && (
                <section className="container px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">New Arrivals</h2>
                        <Link href="/shop?sort=newest" className="text-sm font-medium underline underline-offset-4 text-purple-700">
                            View All
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                        {newArrivals.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
