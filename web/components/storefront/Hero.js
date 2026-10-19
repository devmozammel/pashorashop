"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, Banknote, ChevronLeft, ChevronRight } from "lucide-react";

export default function Hero({ config }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "Prestige মাল্টি ফাংশন ইলেকট্রিক কুকার",
            link: "/product/prestige-electric-cooker",
            bannerImage: "/banners/banner-prestige-cooker.jpg",
        },
        {
            id: 2,
            title: "SILVER CREST ইলেকট্রিক গ্রাইন্ডার",
            link: "/product/silver-crest-hr-2026-2000w-electric-grinder",
            bannerImage: "/banners/banner-silvercrest-grinder.jpg",
        },
        {
            id: 3,
            title: "B72-B ট্রু ওয়্যারলেস ব্লুটুথ ইয়ারবাডস",
            link: "/product/b72-b-true-wireless-bluetooth-earbuds",
            bannerImage: "/banners/banner-b72-earbuds.png",
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    return (
        <section aria-label="Hero and Trust Highlights" className="w-full space-y-3.5">
            {/* ── BANNER CAROUSEL ── */}
            <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm group">
                <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className="w-full shrink-0 relative aspect-[1024/338] bg-slate-900 overflow-hidden"
                        >
                            <Link href={slide.link} className="block w-full h-full group/slide relative">
                                <img
                                    src={slide.bannerImage}
                                    alt={slide.title}
                                    className="w-full h-full object-cover sm:object-fill transition-transform duration-500 group-hover/slide:scale-[1.01]"
                                    loading="eager"
                                />
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Left/Right Arrow Navigation */}
                <button
                    onClick={prevSlide}
                    aria-label="Previous slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={nextSlide}
                    aria-label="Next slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-sm grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Indicators / Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                currentSlide === idx ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* ── TRUST VALUE HIGHLIGHTS (Clean & Uniform) ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Fast Delivery */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3 hover:border-gray-300 transition-colors">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                        <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate">
                            দ্রুত ডেলিভারি
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">
                            ঢাকায় ২৪ ঘণ্টা, সারাদেশে হোম ডেলিভারি
                        </p>
                    </div>
                </div>

                {/* 2. Original Product */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3 hover:border-gray-300 transition-colors">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate">
                            ১০০% অরিজিনাল
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">
                            কোয়ালিটি চেক করা আসল পণ্য
                        </p>
                    </div>
                </div>

                {/* 3. Easy Returns */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3 hover:border-gray-300 transition-colors">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                        <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate">
                            সহজ রিটার্ন
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">
                            ৭ দিনের ঝামেলাহীন রিটার্ন সাপোর্ট
                        </p>
                    </div>
                </div>

                {/* 4. Cash on Delivery */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3 hover:border-gray-300 transition-colors">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center">
                        <Banknote className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight truncate">
                            ক্যাশ অন ডেলিভারি
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-1">
                            পণ্য হাতে পেয়ে টাকা পরিশোধ করুন
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
