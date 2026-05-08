"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Hero({ config }) {
    // Winterella / Institutional Elite Style
    // Soft beige bg: #fdfcf5 or #f9f7f0
    const isDark = config?.heroTheme === "dark";

    return (
        <section className={cn(
            "relative w-full overflow-hidden transition-colors duration-500",
            isDark ? "bg-[#0f1117] text-white" : "bg-[#fdfcf5] text-black"
        )}>
            <div className="container mx-auto px-4 md:px-8 relative min-h-[500px] lg:min-h-[700px] flex flex-col lg:flex-row items-center pt-12 lg:pt-0">
                
                {/* ── LEFT CONTENT ── */}
                <div className="w-full lg:w-1/2 z-10 space-y-6 md:space-y-8 text-center lg:text-left order-2 lg:order-1 pt-10 lg:pt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase border backdrop-blur-sm shadow-sm",
                            isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/10 text-black"
                        )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {isDark ? "Exclusive Edition" : "New Collection"}
                        </span>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-[100px] font-black leading-[0.95] tracking-tight"
                    >
                        {config?.heroTitle || "NEW SUMMER\nCOLLECTION"}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={cn(
                            "text-base md:text-lg max-w-md mx-auto lg:mx-0 opacity-80 font-medium leading-relaxed",
                            isDark ? "text-gray-400" : "text-gray-600"
                        )}
                    >
                        {config?.heroSubtitle || "Discover the essence of comfort and style. Premium quality for your everyday movement."}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4"
                    >
                        <Link href={config?.heroButtonLink || "/shop"}>
                            <Button className={cn(
                                "h-14 px-10 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-xl hover:-translate-y-1 active:scale-95",
                                isDark ? "bg-white text-black hover:bg-gray-100" : "bg-black text-white hover:bg-gray-800"
                            )}>
                                {config?.heroButtonText || "Shop Collection"} →
                            </Button>
                        </Link>
                        <Link href="/new-arrivals">
                            <Button variant="outline" className={cn(
                                "h-14 px-10 rounded-full font-bold text-sm tracking-widest uppercase border-2 transition-all duration-300",
                                isDark ? "border-white/20 text-white hover:bg-white/10" : "border-black/10 text-black hover:bg-black/5"
                            )}>
                                New Arrivals
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Trust Badges Bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className={cn(
                            "flex flex-wrap items-center justify-center lg:justify-start gap-6 md:gap-10 pt-12 opacity-60",
                            isDark ? "text-gray-400" : "text-gray-500"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold uppercase tracking-widest">Fast Delivery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold uppercase tracking-widest">7-Day Returns</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[11px] font-extrabold uppercase tracking-widest">Secure Payment</span>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT CONTENT (IMAGE & PRODUCT CARD) ── */}
                <div className="w-full lg:w-1/2 relative h-[400px] lg:h-full flex items-center justify-center order-1 lg:order-2">
                    {/* Background Decorative Element */}
                    <div className={cn(
                        "absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full blur-[100px] opacity-20 pointer-events-none",
                        isDark ? "bg-blue-500 bottom-0 right-0" : "bg-orange-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    )} />

                    {/* Main Hero Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative z-0 w-full h-full flex items-center justify-center lg:justify-end"
                    >
                        <div className="relative w-[320px] h-[400px] md:w-[450px] md:h-[600px] lg:w-[500px] lg:h-[700px]">
                            {config?.heroImageUrl ? (
                                <img
                                    src={config.heroImageUrl}
                                    alt="Hero Model"
                                    className="w-full h-full object-contain lg:object-cover drop-shadow-2xl"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 animate-pulse rounded-3xl" />
                            )}

                            {/* Floating Product Card */}
                            {(config?.heroProductTitle || config?.heroProductPrice) && (
                                <Link href={config?.heroProductLink || "/shop"}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 40, x: 20 }}
                                        animate={{ opacity: 1, y: 0, x: 0 }}
                                        transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                                        className="absolute bottom-10 -left-10 md:bottom-20 md:-left-20 w-[180px] md:w-[220px] glass p-3 md:p-4 rounded-2xl shadow-2xl border border-white/40 z-20 hover:scale-105 transition-transform duration-300 group cursor-pointer"
                                    >
                                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-[#f5f5f5]">
                                            <img
                                                src={config?.heroProductImage || "/logo.png"}
                                                alt="Product"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-xs md:text-sm text-gray-900 line-clamp-1">
                                                {config?.heroProductTitle || "Premium Fashion Item"}
                                            </h4>
                                            <p className="text-primary font-black text-sm md:text-base">
                                                {config?.heroProductPrice || "৳1,200"}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Limited Stock</span>
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                                                <ShoppingBag className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            )}

                            {/* Additional floating badge for "Premium" feel */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-20 right-0 md:-right-10 hidden md:flex flex-col items-center gap-1 bg-white/80 backdrop-blur-md px-4 py-4 rounded-full shadow-lg border border-white/50 z-10"
                            >
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-black vertical-text uppercase tracking-[0.3em] text-gray-800">Quality Checked</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Gradient for section transition */}
            <div className={cn(
                "absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t pointer-events-none",
                isDark ? "from-[#0f1117] to-transparent" : "from-[#fdfcf5] to-transparent"
            )} />
            
            <style jsx>{`
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </section>
    );
}
