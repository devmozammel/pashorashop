"use client";

import Link from "next/link";
import { useState } from "react";
import {
    Smartphone,
    Sparkles,
    Shirt,
    Zap,
    Baby,
    Dumbbell,
    Home,
    Watch,
    ShoppingBag,
    Footprints,
    Heart,
    Flame,
    Crown,
    Gamepad2,
    Dog
} from "lucide-react";

// Fallback vector icons if image fails
const FALLBACK_ICONS = {
    "beauty-skincare": Sparkles,
    "bags-backpacks": ShoppingBag,
    "perfumes-fragrances": Flame,
    "gaming-pc-gear": Gamepad2,
    "pet-care-accessories": Dog,
    "phones-gadgets": Smartphone,
    "men": Shirt,
    "women": Crown,
    "teens": Zap,
    "kids": Baby,
    "sports": Dumbbell,
    "home-living": Home,
    "accessories": Watch
};

export default function CategoryCard({ cat }) {
    const [imgError, setImgError] = useState(false);
    const slugKey = cat.slug?.toLowerCase() || "";

    // Path to realistic 3D rendered icon
    const icon3dPath = `/images/categories/${slugKey}.jpg`;
    const FallbackIcon = FALLBACK_ICONS[slugKey] || ShoppingBag;

    return (
        <Link
            href={`/category/${cat.slug}`}
            className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_35px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
        >
            {/* Ambient subtle glow background */}
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 pointer-events-none" />

            {/* 3D Realistic Icon Container */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100/80 dark:from-gray-800/90 dark:to-gray-800 border border-gray-100/80 dark:border-gray-700/60 flex items-center justify-center overflow-hidden p-1.5 shadow-sm group-hover:scale-105 group-hover:border-gray-200 transition-all duration-300">
                {!imgError ? (
                    <img
                        src={icon3dPath}
                        alt={cat.name}
                        className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <FallbackIcon className="w-8 h-8 sm:w-9 sm:h-9 text-gray-800 dark:text-gray-200 stroke-[2]" />
                )}
            </div>

            {/* Title & Explore Hint */}
            <div className="mt-3.5 flex flex-col items-center text-center w-full z-10">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                </span>

                <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-200 transition-colors flex items-center gap-1">
                    Explore &rarr;
                </span>
            </div>
        </Link>
    );
}
