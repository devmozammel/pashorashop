import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/product/ProductCard";
import { serializePrisma } from "@/lib/serialize";
import { Sparkles } from "lucide-react";

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pashorashop.com";
    const title = "নতুন পণ্য | New Arrivals | Pashora Shop";
    const description = "পাশোরা শপের সর্বশেষ নতুন পণ্য দেখুন। প্রতিদিন নতুন পণ্য আসছে — গ্যাজেট, ফ্যাশন ও লাইফস্টাইল কালেকশন।";
    return {
        title,
        description,
        alternates: { canonical: `${siteUrl}/new-arrivals` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/new-arrivals`,
            siteName: "Pashora Shop",
            images: [{ url: `${siteUrl}/logo.png`, width: 1200, height: 630, alt: "Pashora Shop New Arrivals" }],
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
}

export default async function NewArrivalsPage() {
    // Fetch products marked as New Arrival or recently added
    const productsRaw = await prisma.product.findMany({
        where: { 
            isActive: true,
            // Prioritize manually marked products, then by date
        },
        orderBy: [
            { isNewArrival: 'desc' },
            { createdAt: 'desc' }
        ],
        take: 24,
        include: {
            variants: true,
            category: true,
            productImages: {
                orderBy: { sortOrder: 'asc' },
                take: 1
            }
        }
    });

    const products = serializePrisma(productsRaw);

    return (
        <div className="bg-[#fdfcf5] min-h-screen pb-20">
            {/* ── HEADER SECTION ── */}
            <section className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden bg-black text-white">
                <div className="absolute inset-0 opacity-40">
                    <img 
                        src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070" 
                        alt="New Arrivals Background" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
                
                <div className="relative z-10 text-center space-y-4 px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Fresh Collection</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">New Arrivals</h1>
                    <p className="text-gray-300 max-w-lg mx-auto text-sm md:text-base font-medium">
                        Elevate your wardrobe with our latest drops. Quality craftsmanship meets modern design.
                    </p>
                </div>
            </section>

            {/* ── PRODUCT GRID ── */}
            <main className="container mx-auto px-4 md:px-8 -mt-10 relative z-20">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/5 p-6 md:p-10 border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-tight">LATEST DROPS</h2>
                            <p className="text-gray-500 text-sm font-medium">Showing the most recent {products.length} products</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Sorted by: <span className="text-black">Newest First</span>
                        </div>
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No new arrivals yet</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2">
                                Check back soon for our newest collection launches and exclusive drops.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
