"use client";

import Link from "next/link";
import {
    Smartphone,
    Sparkles,
    Shirt,
    Zap,
    Baby,
    Trophy,
    Home,
    Watch,
    ShoppingBag,
    Layers,
    Footprints,
    Heart,
    Flame,
    Crown,
    Headphones,
    Smile,
    Gamepad2,
    Dog,
    Tag,
    Tv,
    Briefcase,
    Gem,
    Scissors
} from "lucide-react";

// Category slug/name to Lucide Icon & White Theme mapping
const CATEGORY_THEMES = {
    "beauty-skincare": {
        icon: Heart,
        color: "text-rose-500 dark:text-rose-400",
        badgeBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50",
        badge: "Beauty Care"
    },
    "bags-backpacks": {
        icon: Briefcase,
        color: "text-teal-600 dark:text-teal-400",
        badgeBg: "bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50",
        badge: "Bags & Luggage"
    },
    "perfumes-fragrances": {
        icon: Flame,
        color: "text-amber-500 dark:text-amber-400",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50",
        badge: "Fragrance"
    },
    "gaming-pc-gear": {
        icon: Gamepad2,
        color: "text-indigo-600 dark:text-indigo-400",
        badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50",
        badge: "Gaming Gear"
    },
    "pet-care-accessories": {
        icon: Dog,
        color: "text-orange-500 dark:text-orange-400",
        badgeBg: "bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/50",
        badge: "Pet Care"
    },
    "phones-gadgets": {
        icon: Smartphone,
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50",
        badge: "Phones & Tech"
    },
    "men": {
        icon: Shirt,
        color: "text-blue-600 dark:text-blue-400",
        badgeBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50",
        badge: "Men's Fashion"
    },
    "women": {
        icon: Crown,
        color: "text-fuchsia-600 dark:text-fuchsia-400",
        badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-100 dark:border-fuchsia-900/50",
        badge: "Women's Fashion"
    },
    "teens": {
        icon: Zap,
        color: "text-amber-500 dark:text-amber-400",
        badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50",
        badge: "Youth Style"
    },
    "kids": {
        icon: Baby,
        color: "text-cyan-600 dark:text-cyan-400",
        badgeBg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/50",
        badge: "Kids Corner"
    },
    "sports": {
        icon: Trophy,
        color: "text-red-600 dark:text-red-400",
        badgeBg: "bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/50",
        badge: "Fitness"
    },
    "home-living": {
        icon: Home,
        color: "text-purple-600 dark:text-purple-400",
        badgeBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/50",
        badge: "Home Decor"
    },
    "accessories": {
        icon: Watch,
        color: "text-yellow-600 dark:text-yellow-400",
        badgeBg: "bg-yellow-50 dark:bg-yellow-950/40 border-yellow-100 dark:border-yellow-900/50",
        badge: "Accessories"
    }
};

export default function CategoryCard({ cat }) {
    const slugKey = cat.slug?.toLowerCase() || "";
    const nameLower = cat.name?.toLowerCase() || "";

    // Determine Theme
    let theme = CATEGORY_THEMES[slugKey];

    if (!theme) {
        if (nameLower.includes("phone") || nameLower.includes("mobile") || nameLower.includes("gadget")) {
            theme = CATEGORY_THEMES["phones-gadgets"];
        } else if (nameLower.includes("men")) {
            theme = CATEGORY_THEMES["men"];
        } else if (nameLower.includes("women")) {
            theme = CATEGORY_THEMES["women"];
        } else if (nameLower.includes("teen")) {
            theme = CATEGORY_THEMES["teens"];
        } else if (nameLower.includes("kid") || nameLower.includes("baby")) {
            theme = CATEGORY_THEMES["kids"];
        } else if (nameLower.includes("sport") || nameLower.includes("gym")) {
            theme = CATEGORY_THEMES["sports"];
        } else if (nameLower.includes("home") || nameLower.includes("living")) {
            theme = CATEGORY_THEMES["home-living"];
        } else if (nameLower.includes("shoe") || nameLower.includes("footwear")) {
            theme = {
                icon: Footprints,
                color: "text-cyan-600 dark:text-cyan-400",
                badgeBg: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-100 dark:border-cyan-900/50",
                badge: "Footwear"
            };
        } else if (nameLower.includes("beauty") || nameLower.includes("cosmetic") || nameLower.includes("skin")) {
            theme = CATEGORY_THEMES["beauty-skincare"];
        } else if (nameLower.includes("bag") || nameLower.includes("luggage")) {
            theme = CATEGORY_THEMES["bags-backpacks"];
        } else if (nameLower.includes("perfume") || nameLower.includes("fragrance") || nameLower.includes("attar")) {
            theme = CATEGORY_THEMES["perfumes-fragrances"];
        } else if (nameLower.includes("game") || nameLower.includes("gaming") || nameLower.includes("pc")) {
            theme = CATEGORY_THEMES["gaming-pc-gear"];
        } else if (nameLower.includes("pet") || nameLower.includes("cat") || nameLower.includes("dog")) {
            theme = CATEGORY_THEMES["pet-care-accessories"];
        } else {
            theme = {
                icon: ShoppingBag,
                color: "text-indigo-600 dark:text-indigo-400",
                badgeBg: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50",
                badge: "Featured"
            };
        }
    }

    const Icon = theme.icon;

    return (
        <Link
            href={`/category/${cat.slug}`}
            className="group relative flex flex-col items-center justify-between p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
        >
            {/* White/Soft Badge Icon Container */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${theme.badgeBg} border flex items-center justify-center p-3.5 group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                <Icon className={`w-8 h-8 sm:w-9 sm:h-9 stroke-[1.8] ${theme.color} transition-transform duration-300 group-hover:scale-110`} />
            </div>

            {/* Content Area */}
            <div className="mt-3.5 flex flex-col items-center text-center w-full z-10">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                </span>

                {/* Sub-badge / Explore hint */}
                <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-gray-200 transition-colors flex items-center gap-1">
                    Explore &rarr;
                </span>
            </div>
        </Link>
    );
}
