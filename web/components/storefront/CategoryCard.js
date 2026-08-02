"use client";

import Link from "next/link";
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
    Dog,
    Smile,
    Activity,
    Layers
} from "lucide-react";

// Category slug/name to Icon & Vibrant Gradient mapping
const CATEGORY_THEMES = {
    "beauty-skincare": {
        icon: Sparkles,
        gradient: "from-pink-500 via-rose-500 to-fuchsia-600",
        shadow: "shadow-pink-500/30",
        badge: "Beauty Care"
    },
    "bags-backpacks": {
        icon: ShoppingBag,
        gradient: "from-emerald-500 via-teal-600 to-cyan-600",
        shadow: "shadow-emerald-500/30",
        badge: "Bags & Luggage"
    },
    "perfumes-fragrances": {
        icon: Flame,
        gradient: "from-rose-600 via-amber-500 to-red-600",
        shadow: "shadow-rose-500/30",
        badge: "Fragrance"
    },
    "gaming-pc-gear": {
        icon: Gamepad2,
        gradient: "from-purple-600 via-indigo-600 to-blue-600",
        shadow: "shadow-indigo-500/30",
        badge: "Gaming Gear"
    },
    "pet-care-accessories": {
        icon: Dog,
        gradient: "from-amber-500 via-orange-500 to-yellow-500",
        shadow: "shadow-amber-500/30",
        badge: "Pet Care"
    },
    "phones-gadgets": {
        icon: Smartphone,
        gradient: "from-emerald-500 via-teal-500 to-cyan-600",
        shadow: "shadow-teal-500/30",
        badge: "Phones & Tech"
    },
    "men": {
        icon: Shirt,
        gradient: "from-blue-600 via-indigo-600 to-violet-600",
        shadow: "shadow-blue-500/30",
        badge: "Men's Fashion"
    },
    "women": {
        icon: Crown,
        gradient: "from-fuchsia-500 via-pink-500 to-rose-600",
        shadow: "shadow-pink-500/30",
        badge: "Women's Fashion"
    },
    "teens": {
        icon: Zap,
        gradient: "from-amber-500 via-orange-500 to-red-500",
        shadow: "shadow-amber-500/30",
        badge: "Youth Style"
    },
    "kids": {
        icon: Baby,
        gradient: "from-lime-500 via-emerald-500 to-teal-500",
        shadow: "shadow-emerald-500/30",
        badge: "Kids Corner"
    },
    "sports": {
        icon: Dumbbell,
        gradient: "from-red-500 via-orange-600 to-amber-600",
        shadow: "shadow-red-500/30",
        badge: "Fitness & Sports"
    },
    "home-living": {
        icon: Home,
        gradient: "from-purple-600 via-violet-600 to-indigo-600",
        shadow: "shadow-purple-500/30",
        badge: "Home Decor"
    },
    "accessories": {
        icon: Watch,
        gradient: "from-amber-500 via-yellow-500 to-orange-500",
        shadow: "shadow-yellow-500/30",
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
        } else if (nameLower.includes("sport") || nameLower.includes("gym") || nameLower.includes("fitness")) {
            theme = CATEGORY_THEMES["sports"];
        } else if (nameLower.includes("home") || nameLower.includes("living")) {
            theme = CATEGORY_THEMES["home-living"];
        } else if (nameLower.includes("shoe") || nameLower.includes("footwear")) {
            theme = {
                icon: Footprints,
                gradient: "from-cyan-500 to-blue-600",
                shadow: "shadow-cyan-500/30",
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
                gradient: "from-indigo-500 via-purple-500 to-pink-500",
                shadow: "shadow-indigo-500/30",
                badge: "Featured"
            };
        }
    }

    const Icon = theme.icon;

    return (
        <Link
            href={`/category/${cat.slug}`}
            className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
        >
            {/* Soft Ambient Background Glow on Hover */}
            <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-300 pointer-events-none`} />

            {/* Vibrant Gradient Badge Container with Pure White Vector Icon */}
            <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${theme.gradient} ${theme.shadow} flex items-center justify-center p-3.5 text-white shadow-lg group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}>
                <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[2.2] drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
            </div>

            {/* Title & Explore Hint */}
            <div className="mt-3.5 flex flex-col items-center text-center w-full z-10">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                </span>

                <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors flex items-center gap-1">
                    Explore &rarr;
                </span>
            </div>
        </Link>
    );
}
