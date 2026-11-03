"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";

const SAMPLE_ORDERS = [
    {
        name: "তানভীর হাসান",
        location: "ধানমন্ডি, ঢাকা",
        product: "ফোল্ডেবল ইলেকট্রিক ট্রাভেল কেটলি",
        time: "২ মিনিট আগে",
        slug: "foldable-electric-travel-kettle-portable-water-heater",
        image: "https://res.cloudinary.com/fyxpjjdd/image/upload/v1793729600/pashora-shop/jv5qolvnmcl3v9yeirbv.jpg"
    },
    {
        name: "আরিফুল ইসলাম",
        location: "পাঁচলাইশ, চট্টগ্রাম",
        product: "CYXG Q10 2-in-1 Wireless Earbuds",
        time: "৫ মিনিট আগে",
        slug: "high-quality-q87-wireless-earbuds-easy-touch-control-earphones-low-latency-outdoor-wireless-headset",
        image: "https://res.cloudinary.com/fyxpjjdd/image/upload/v1793729600/pashora-shop/jv5qolvnmcl3v9yeirbv.jpg"
    },
    {
        name: "সাদিয়া রহমান",
        location: "উত্তরা, ঢাকা",
        product: "ফোল্ডেবল ইলেকট্রিক ট্রাভেল কেটলি",
        time: "৭ মিনিট আগে",
        slug: "foldable-electric-travel-kettle-portable-water-heater",
        image: "https://res.cloudinary.com/fyxpjjdd/image/upload/v1793729600/pashora-shop/jv5qolvnmcl3v9yeirbv.jpg"
    },
    {
        name: "মেহেদী হাসান",
        location: "বগুড়া সদর",
        product: "Unisex Henley Waffle T-Shirt",
        time: "১২ মিনিট আগে",
        slug: "unisex-henley-full-sleeve-waffle-textured-t-shirt-off-white",
        image: "https://res.cloudinary.com/dqijzckfb/image/upload/v1793218261/authentic-bazar/fashion-favors/xi22b9fsfmdkyitdezgc.jpg"
    }
];

export default function RecentSalesPopup() {
    const [currentOrder, setCurrentOrder] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (isDismissed) return;

        // Show first notification after 6 seconds
        const initialTimer = setTimeout(() => {
            triggerPopup(0);
        }, 6000);

        let interval;
        const startInterval = () => {
            interval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * SAMPLE_ORDERS.length);
                triggerPopup(randomIndex);
            }, 18000); // Trigger every 18 seconds
        };

        const intervalTimer = setTimeout(startInterval, 7000);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(intervalTimer);
            if (interval) clearInterval(interval);
        };
    }, [isDismissed]);

    const triggerPopup = (index) => {
        if (isDismissed) return;
        setCurrentOrder(SAMPLE_ORDERS[index]);
        setIsVisible(true);

        // Hide after 5 seconds
        setTimeout(() => {
            setIsVisible(false);
        }, 5000);
    };

    if (!currentOrder || isDismissed) return null;

    return (
        <div
            className={`fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 transition-all duration-500 transform ${
                isVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            }`}
        >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-3 pr-8 max-w-sm flex items-center gap-3 relative hover:shadow-2xl transition-shadow group">
                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                    title="বন্ধ করুন"
                    type="button"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                    <Image
                        src={currentOrder.image}
                        alt={currentOrder.product}
                        fill
                        className="object-cover"
                        sizes="48px"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সবেমাত্র অর্ডার হয়েছে</span>
                        <span className="text-slate-400 font-normal">· {currentOrder.time}</span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {currentOrder.name} <span className="font-normal text-slate-500">({currentOrder.location})</span>
                    </p>

                    <Link
                        href={`/product/${currentOrder.slug}`}
                        className="text-[11px] text-slate-600 hover:text-emerald-700 font-medium truncate block transition-colors underline-offset-2 hover:underline"
                    >
                        {currentOrder.product}
                    </Link>
                </div>
            </div>
        </div>
    );
}
