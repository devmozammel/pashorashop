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
    Dog
} from "lucide-react";

// Category slug/name to Lucide Icon & Gradient mapping
const CATEGORY_THEMES = {
    "beauty-skincare": {
        icon: Heart,
        gradient: "from-pink-500 via-rose-500 to-fuchsia-600",
        shadow: "shadow-pink-500/20",
        bg: "bg-pink-50 dark:bg-pink-950/30",
        badge: "Beauty & Care"
    },
    "bags-backpacks": {
        icon: ShoppingBag,
        gradient: "from-emerald-500 via-teal-600 to-cyan-600",
        shadow: "shadow-teal-500/20",
        bg: "bg-teal-50 dark:bg-teal-950/30",
        badge: "Bags & Luggage"
    },
    "perfumes-fragrances": {
        icon: Flame,
        gradient: "from-rose-600 via-amber-500 to-red-600",
        shadow: "shadow-rose-500/20",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        badge: "Fragrance"
    },
    "gaming-pc-gear": {
        icon: Gamepad2,
        gradient: "from-purple-600 via-indigo-600 to-blue-600",
        shadow: "shadow-purple-500/20",
        bg: "bg-purple-50 dark:bg-purple-950/30",
        badge: "Gaming Gear"
    },
    "pet-care-accessories": {
        icon: Dog,
        gradient: "from-amber-500 via-orange-500 to-yellow-500",
        shadow: "shadow-amber-500/20",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        badge: "Pet Corner"
    },
    "phones-gadgets": {
        icon: Smartphone,
        gradient: "from-emerald-500 via-teal-500 to-cyan-600",
        shadow: "shadow-teal-500/20",
        bg: "bg-teal-50 dark:bg-teal-950/30",
        badge: "Gadgets & Phones"
    },
    "men": {
        icon: Shirt,
        gradient: "from-blue-600 via-indigo-600 to-violet-600",
        shadow: "shadow-blue-500/20",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        badge: "Fashion"
    },
    "women": {
        icon: Sparkles,
        gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
        shadow: "shadow-rose-500/20",
        bg: "bg-rose-50 dark:bg-rose-950/30",
        badge: "Trending"
    },
    "teens": {
        icon: Zap,
        gradient: "from-amber-500 via-orange-500 to-red-500",
        shadow: "shadow-amber-500/20",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        badge: "Youth Style"
    },
    "kids": {
        icon: Baby,
        gradient: "from-lime-500 via-emerald-500 to-teal-500",
        shadow: "shadow-emerald-500/20",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        badge: "Kids Corner"
    },
    "sports": {
        icon: Trophy,
        gradient: "from-red-500 via-orange-600 to-amber-600",
        shadow: "shadow-red-500/20",
        bg: "bg-red-50 dark:bg-red-950/30",
        badge: "Fitness"
    },
    "home-living": {
        icon: Home,
        gradient: "from-purple-600 via-violet-600 to-indigo-600",
        shadow: "shadow-purple-500/20",
        bg: "bg-purple-50 dark:bg-purple-950/30",
        badge: "Home Decor"
    },
    "accessories": {
        icon: Watch,
        gradient: "from-amber-500 via-yellow-500 to-orange-500",
        shadow: "shadow-yellow-500/20",
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
        badge: "Luxury"
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
                gradient: "from-cyan-500 to-blue-600",
                shadow: "shadow-cyan-500/20",
                bg: "bg-cyan-50 dark:bg-cyan-950/30",
                badge: "Footwear"
            };
        } else if (nameLower.includes("beauty") || nameLower.includes("cosmetic")) {
            theme = {
                icon: Heart,
                gradient: "from-pink-500 to-rose-600",
                shadow: "shadow-pink-500/20",
                bg: "bg-pink-50 dark:bg-pink-950/30",
                badge: "Beauty"
            };
        } else {
            theme = {
                icon: ShoppingBag,
                gradient: "from-indigo-500 via-purple-500 to-pink-500",
                shadow: "shadow-indigo-500/20",
                bg: "bg-indigo-50 dark:bg-indigo-950/30",
                badge: "Featured"
            };
        }
    }

    const Icon = theme.icon;

    return (
        <Link
            href={`/category/${cat.slug}`}
            className="group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 group-hover:opacity-20 blur-xl transition-opacity duration-300 pointer-events-none`} />

            {/* Icon Container */}
            <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${theme.gradient} ${theme.shadow} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.8]" />
            </div>

            {/* Content Area */}
            <div className="mt-3.5 flex flex-col items-center text-center w-full z-10">
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                </span>

                {/* Sub-badge / Explore hint */}
                <span className="mt-1 text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors flex items-center gap-1">
                    Explore &rarr;
                </span>
            </div>
        </Link>
    );
}

