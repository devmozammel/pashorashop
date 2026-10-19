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
    Flame,
    Crown,
    Gamepad2,
    Dog,
    CookingPot,
    HeartPulse
} from "lucide-react";

// Clean, concise Bengali labels (No redundant subtitles, zero ugly truncation)
const BN_NAMES = {
    "rice-cooker": "রাইস কুকার",
    "gadgets": "স্মার্ট গ্যাজেট",
    "phones-gadgets": "ফোন ও গ্যাজেট",
    "skincare-grooming": "স্কিনকেয়ার",
    "beauty-skincare": "বিউটি কেয়ার",
    "fitness": "ফিটনেস",
    "sports": "স্পোর্টস",
    "grocery": "গ্রোসারি",
    "sunnah-store": "সুন্নাহ স্টোর",
    "lifestyle": "লাইফস্টাইল",
    "men": "ছেলেদের ফ্যাশন",
    "women": "মেয়েদের ফ্যাশন",
    "teens": "তরুণদের ফ্যাশন",
    "kids": "বাচ্চাদের কালেকশন",
    "home-living": "হোম ও কিচেন",
    "bags-backpacks": "ব্যাগ ও লাগেজ",
    "perfumes-fragrances": "পারফিউম ও আতর",
    "accessories": "ফ্যাশন এক্সেসরিজ",
    "fashion-accessories": "ফ্যাশন এক্সেসরিজ",
    "gaming-pc-gear": "গেমিং গিয়ার",
    "pet-care-accessories": "পেট কেয়ার"
};

const FALLBACK_ICONS = {
    "rice-cooker": CookingPot,
    "gadgets": Smartphone,
    "phones-gadgets": Smartphone,
    "skincare-grooming": Sparkles,
    "beauty-skincare": Sparkles,
    "fitness": Dumbbell,
    "sports": Dumbbell,
    "men": Shirt,
    "women": Crown,
    "teens": Zap,
    "kids": Baby,
    "home-living": Home,
    "accessories": Watch,
    "fashion-accessories": Watch,
    "perfumes-fragrances": Flame,
    "gaming-pc-gear": Gamepad2,
    "pet-care-accessories": Dog
};

export default function CategoryCard({ cat }) {
    const slugKey = cat.slug?.toLowerCase() || "";
    const displayName = BN_NAMES[slugKey] || cat.name;
    const localImgPath = `/images/categories/${slugKey}.jpg`;

    const [imgSrc, setImgSrc] = useState(localImgPath);
    const [imgError, setImgError] = useState(false);

    const FallbackIcon = FALLBACK_ICONS[slugKey] || ShoppingBag;

    const handleImgError = () => {
        if (imgSrc === localImgPath && cat.image && cat.image !== localImgPath) {
            setImgSrc(cat.image);
        } else {
            setImgError(true);
        }
    };

    return (
        <Link
            href={`/shop?category=${cat.slug}`}
            className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-600 hover:shadow-sm transition-all p-3 sm:p-4 flex flex-col items-center text-center justify-between min-h-[140px] sm:min-h-[155px]"
        >
            {/* Circular Image Container (Clean & Professional) */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-50 border border-gray-100/90 flex items-center justify-center overflow-hidden p-2 group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                {!imgError ? (
                    <img
                        src={imgSrc}
                        alt={displayName}
                        className="w-full h-full object-contain"
                        onError={handleImgError}
                    />
                ) : (
                    <FallbackIcon className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-700 stroke-[1.8]" />
                )}
            </div>

            {/* Single Clean Title (No duplicate subtitle, natural 2-line wrap) */}
            <div className="mt-2.5 flex items-center justify-center w-full min-h-[34px]">
                <span className="text-xs sm:text-[13px] font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors text-center leading-tight line-clamp-2 px-0.5">
                    {displayName}
                </span>
            </div>
        </Link>
    );
}
