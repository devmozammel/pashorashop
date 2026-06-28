import { prisma } from "@/lib/prisma";
import Hero from "@/components/storefront/Hero";
import ProductCard from "@/components/product/ProductCard";
import FlashSale from "@/components/storefront/FlashSale";
import CategoryCard from "@/components/storefront/CategoryCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { serializePrisma } from "@/lib/serialize";

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
    const [config, categories] = await Promise.all([
        prisma.homepageConfig.findFirst(),
        prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ showOnHomepage: 'desc' }, { sortOrder: 'asc' }],
            take: 8,
        })
    ]);

    const showFeatured = config?.showFeatured !== false;
    const showNewArrivals = config?.showNewArrivals !== false;
    const showFlashSale = config?.showFlashSale !== false;

    // 2. Prepare parallel promises for conditional DB fetches
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
    const [featuredRaw, newArrivalsRaw, activeFlashSale] = await Promise.all([
        featuredPromise,
        newArrivalsPromise,
        flashSalePromise
    ]);

    // 4. Serialize data
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
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Shop by Category</h2>

                    {/* Mobile: horizontal scroll */}
                    <div className="flex md:hidden overflow-x-auto gap-4 pb-3 no-scrollbar scroll-smooth -mx-1 px-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/shop?categoryId=${cat.id}`}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20"
                            >
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                            <span className="text-lg font-black text-gray-400">{cat.name?.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-1 w-full">{cat.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Desktop: grid */}
                    <div className="hidden md:grid grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map((cat) => (
                            <CategoryCard key={cat.id} cat={cat} />
                        ))}
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
