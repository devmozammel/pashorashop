import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Zap, LayoutGrid, Timer, AlertCircle } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import FlashSaleTimer from "@/components/product/FlashSaleTimer";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Flash Sale | Authentic Bazar",
    description: "Incredible deals for a limited time only! Don't miss out on our premium fashion collection at unbeatable prices.",
};

export default async function FlashSalePage() {
    const now = new Date();
    
    // Fetch Active Flash Sale
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
                        include: { 
                            category: true,
                            variants: true 
                        }
                    }
                }
            }
        },
        orderBy: { endsAt: 'asc' }
    });

    let flashSale = null;
    let products = [];

    if (activeFlashSale) {
        flashSale = serializePrisma(activeFlashSale);
        // Map items to products with salePrice override
        products = activeFlashSale.items.map(item => {
            const p = serializePrisma(item.product);
            return {
                ...p,
                salePrice: item.salePrice, // Override with flash sale price
                discountPrice: item.salePrice // Ensure UI shows this as current price
            };
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── HEADER SECTION ── */}
            <div className="bg-white border-b border-gray-100 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4">
                    <div className="w-[500px] h-[500px] bg-red-50 rounded-full blur-[120px] opacity-60" />
                </div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4">
                    <div className="w-96 h-96 bg-orange-50 rounded-full blur-[100px] opacity-40" />
                </div>

                <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
                    <div className="max-w-4xl mx-auto text-center md:text-left md:mx-0">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-600 transition-colors mb-8 bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-full border border-gray-100 hover:border-red-100"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Return Home
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                                    <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center rotate-3 shadow-xl shadow-red-200 animate-pulse">
                                        <Zap className="w-7 h-7 fill-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-red-600 text-sm font-black uppercase tracking-[0.2em]">Live Now</span>
                                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-none">
                                            Flash Sale
                                        </h1>
                                    </div>
                                </div>
                                <p className="text-lg text-gray-600 max-w-xl leading-relaxed font-medium">
                                    Grab your favorites before they're gone! Extreme discounts available for a very limited time.
                                </p>
                            </div>

                            {flashSale && (
                                <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-[0_20px_50px_rgba(239,68,68,0.08)] flex flex-col items-center md:items-end">
                                    <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest mb-3">
                                        <Timer className="w-4 h-4" />
                                        Ends In:
                                    </div>
                                    <FlashSaleTimer endsAt={flashSale.endsAt} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── PRODUCTS SECTION ── */}
            <div className="container mx-auto px-4 py-12 md:py-20">
                {!flashSale || products.length === 0 ? (
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 py-32 flex flex-col items-center justify-center text-center px-4 overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-20" />
                        
                        <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 rotate-6 border border-gray-100">
                            <AlertCircle className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">No Active Flash Sales</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-10 text-lg">
                            Don't worry! We have plenty of other amazing deals in our shop. Check them out now.
                        </p>
                        <Link
                            href="/shop"
                            className="group relative inline-flex items-center justify-center px-10 py-4 bg-gray-900 overflow-hidden rounded-2xl font-bold text-white transition-all hover:bg-red-600"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Browse All Products
                                <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                            </span>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3 text-gray-900 font-bold bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                                <LayoutGrid className="w-5 h-5 text-red-600" />
                                <span className="text-sm">Found {products.length} exclusive deals</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
                            {products.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    isFlashSale={true} 
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── TRUST BADGES ── */}
            <div className="container mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Fast Delivery", desc: "Across all of Bangladesh", icon: "🚚" },
                        { title: "7 Days Return", desc: "Easy returns policy", icon: "🔄" },
                        { title: "Secure Payment", desc: "SSL Commerz Protected", icon: "🔒" },
                    ].map((badge, i) => (
                        <div key={i} className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white flex items-center gap-5">
                            <div className="text-3xl">{badge.icon}</div>
                            <div>
                                <h4 className="font-bold text-gray-900">{badge.title}</h4>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{badge.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
