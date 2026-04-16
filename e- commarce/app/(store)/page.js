import { prisma } from "@/lib/prisma";
import Hero from "@/components/storefront/Hero";
import ProductCard from "@/components/product/ProductCard";
import FlashSale from "@/components/storefront/FlashSale";
import CategoryCard from "@/components/storefront/CategoryCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    // 1. Fetch Homepage Config
    const config = await prisma.homepageConfig.findFirst();

    // 2. Fetch Featured Products (if enabled)
    let featuredProducts = [];
    if (config?.showFeatured !== false) { // Default true
        const featuredRaw = await prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: { variants: true }
        });
        featuredProducts = serializePrisma(featuredRaw);
    }

    // 3. Fetch New Arrivals (if enabled)
    let newArrivals = [];
    if (config?.showNewArrivals !== false) {
        const newArrivalsRaw = await prisma.product.findMany({
            where: { isActive: true },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: { variants: true }
        });
        newArrivals = serializePrisma(newArrivalsRaw);
    }

    // 4. Fetch Active Flash Sale (if enabled)
    let flashSale = null;
    let flashSaleProducts = [];
    if (config?.showFlashSale !== false) {
        const now = new Date();
        const activeFlashSale = await prisma.flashSale.findFirst({
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
            orderBy: { endsAt: 'asc' } // Get the one ending soonest? or just first
        });

        if (activeFlashSale) {
            flashSale = serializePrisma(activeFlashSale);
            // Map items to products with salePrice override
            flashSaleProducts = activeFlashSale.items.map(item => {
                const p = serializePrisma(item.product);
                return {
                    ...p,
                    salePrice: item.salePrice, // Override with flash sale price
                    discountPrice: item.salePrice // Ensure UI shows this as current price
                };
            });
        }
    }

    // 5. Fetch Categories — prefer showOnHomepage, fallback to any active
    let categories = await prisma.category.findMany({
        where: { showOnHomepage: true, isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 6,
    });

    if (categories.length === 0) {
        // Fallback: show first 6 active categories even if not marked showOnHomepage
        categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            take: 6,
        });
    }


    return (
        <div className="flex flex-col gap-16 pb-16">
            {/* ── HERO SECTION ── */}
            <Hero config={config} />

            {/* ── MOBILE CATEGORY SCROLL ── */}
            <section className="md:hidden pt-4 -mb-8">
                <div className="flex overflow-x-auto gap-4 px-4 pb-4 no-scrollbar scroll-smooth">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/shop?categoryId=${cat.id}`}
                            className="flex flex-col items-center gap-2 flex-shrink-0"
                        >
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                                <img
                                    src={cat.image || '/logo.png'}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap">{cat.name}</span>
                        </Link>
                    ))}
                </div>
            </section>


            {/* Configurable Sections */}

            {/* Categories (Desktop only or Grid) */}
            <section className="container px-4 hidden md:block">
                <h2 className="text-2xl font-bold tracking-tight mb-8">Shop by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat) => (
                        <CategoryCard key={cat.id} cat={cat} />
                    ))}
                </div>
            </section>

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
