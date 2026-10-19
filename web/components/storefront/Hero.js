"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, Banknote, ChevronLeft, ChevronRight } from "lucide-react";

export default function Hero({ config }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 1,
            title: "ইলেকট্রিক কুকার ও গ্রাইন্ডার মেগা কম্বো অফার",
            subtitle: "রান্না ও মসলা গুঁড়ো করার ঝামেলা শেষ এক নিমেষেই — প্রিমিয়াম কোয়ালিটি, হাই পাওয়ার মোটর ও বিদ্যুৎ সাশ্রয়ী!",
            badge: "মেগা কম্বো ৩৫% ছাড়",
            priceText: "৳২,৩০০ এর জায়গায় মাত্র ৳১,৪৯৯",
            buttonText: "অর্ডার করুন",
            link: "/product/electric-cooker-and-grinder-combo-offer",
            bgClass: "bg-gradient-to-r from-amber-950 via-zinc-900 to-slate-900",
            image: "https://db.shobkichu.com.bd/storage/v1/object/public/products/98ce9945-816c-422d-8ade-fec4bb4291d4.wm.webp",
        },
        {
            id: 2,
            title: "প্রেস্টিজ মাল্টিফাংশনাল ইলেকট্রিক কুকার",
            subtitle: "ভাত, স্যুপ, নুডুলস ও ডিম সেদ্ধ করুন দ্রুত ও সহজে — নন-স্টিক কোটিং ও নিরাপদ অটো-কাট ফিচার!",
            badge: "হট ডিল ৩৩% ছাড়",
            priceText: "সীমিত সময়ের জন্য মাত্র ৳৯৯৯",
            buttonText: "অর্ডার করুন",
            link: "/product/prestige-electric-cooker",
            bgClass: "bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900",
            image: "https://db.shobkichu.com.bd/storage/v1/object/public/products/3b1d001b-68c0-410e-a9c3-d35a1aab12b8.wm.webp",
        },
        {
            id: 3,
            title: "প্রিমিয়াম প্লেয়ার এডিশন স্পোর্টস জার্সি",
            subtitle: "১০০% ব্রিদেবল আরামদায়ক ফেব্রিক ও আকর্ষণীয় অফিশিয়াল ডিজাইন — সীমিত স্টক!",
            badge: "নতুন কালেকশন",
            priceText: "দেশজুড়ে ক্যাশ অন ডেলিভারি",
            buttonText: "কালেকশন দেখুন",
            link: "/shop",
            bgClass: "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-850",
            image: "https://res.cloudinary.com/dqijzckfb/image/upload/v1781631472/authentic-bazar/kmixrneu3uadlvhar0gj.jpg",
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
            <div className="relative w-full overflow-hidden rounded-2xl border border-gray-100 shadow-xs group">
                <div 
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            className={`w-full shrink-0 relative aspect-[16/7] min-h-[200px] sm:min-h-[260px] md:min-h-[320px] ${slide.bgClass} flex items-center justify-between p-6 sm:p-10 md:p-12 text-white overflow-hidden`}
                        >
                            {/* Text Content */}
                            <div className="relative z-10 max-w-xl space-y-2 sm:space-y-3">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-600/90 text-white tracking-wide">
                                    {slide.badge}
                                </span>

                                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold leading-tight text-white tracking-tight">
                                    {slide.title}
                                </h2>

                                <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 max-w-md leading-relaxed">
                                    {slide.subtitle}
                                </p>

                                <div className="pt-2 flex items-center gap-3 flex-wrap">
                                    <Link
                                        href={slide.link}
                                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs"
                                    >
                                        {slide.buttonText} →
                                    </Link>
                                    <span className="text-xs sm:text-sm text-gray-300 font-medium">
                                        {slide.priceText}
                                    </span>
                                </div>
                            </div>

                            {/* Slide image if provided */}
                            {slide.image && (
                                <div className="relative z-10 w-28 sm:w-52 md:w-64 lg:w-80 h-28 sm:h-52 md:h-64 lg:h-72 shrink-0 flex items-center justify-center">
                                    <div className="relative w-full h-full p-1 sm:p-2 flex items-center justify-center">
                                        <img
                                            src={slide.image}
                                            alt={slide.title}
                                            className="max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] rounded-lg transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>
                                </div>
                            )}
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
