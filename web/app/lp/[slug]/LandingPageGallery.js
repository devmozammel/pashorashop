"use client";

import { useState } from "react";
import { Sparkles, Check, ChevronLeft, ChevronRight } from "lucide-react";

export default function LandingPageGallery({ images, productName }) {
    const [activeIdx, setActiveIdx] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square flex items-center justify-center text-gray-400 text-4xl bg-white border rounded-2xl shadow-lg">
                📦
            </div>
        );
    }

    // Normalize images: accept both strings and objects { url, color, label }
    const normalizedImages = images.map((item, idx) => {
        if (typeof item === "string") {
            let inferredColor = null;
            if (item.includes("r6jejkn1siodvffjnjkb") || item.includes("n7iuodyj") || item.includes("qbzqj1hw")) inferredColor = "Washed Brown";
            else if (item.includes("y2yygcaetz") || item.includes("zuyj58kqqn") || item.includes("rybpimxwtb") || item.includes("dvxqznbg")) inferredColor = "Black";
            else if (item.includes("xi22b9fs") || item.includes("mfm5woks") || item.includes("k89dbtpy") || item.includes("gbxujy2a")) inferredColor = "Off-White";

            return {
                url: item,
                color: inferredColor,
                label: inferredColor
            };
        }
        return {
            url: item.url,
            color: item.color || null,
            label: item.label || item.color || null
        };
    });

    const activeItem = normalizedImages[activeIdx] || normalizedImages[0];

    // Find distinct colors available
    const distinctColors = [];
    const colorMap = {
        "Washed Brown": { name: "Washed Brown", bg: "#7A5C43", border: "#5C432F", text: "#FFFFFF" },
        "Black": { name: "Black", bg: "#1A1A1A", border: "#000000", text: "#FFFFFF" },
        "Off-White": { name: "Off-White", bg: "#F5F3ED", border: "#D8D4C7", text: "#1A1A1A" }
    };

    normalizedImages.forEach((img, idx) => {
        if (img.color && !distinctColors.some(c => c.name === img.color)) {
            const meta = colorMap[img.color] || { name: img.color, bg: "#333", border: "#111", text: "#fff" };
            distinctColors.push({
                ...meta,
                firstIdx: idx
            });
        }
    });

    const handleColorClick = (colorName) => {
        const target = distinctColors.find(c => c.name === colorName);
        if (target !== undefined && target.firstIdx !== undefined) {
            setActiveIdx(target.firstIdx);
        }
    };

    const handlePrev = () => {
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : normalizedImages.length - 1));
    };

    const handleNext = () => {
        setActiveIdx((prev) => (prev < normalizedImages.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="space-y-3 sm:space-y-4 w-full">
            {/* Color Switcher Bar (if 2 or more colors present) */}
            {distinctColors.length > 1 && (
                <div className="bg-slate-50/95 border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-wider pl-0.5 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">কালার সিলেক্ট করুন ({distinctColors.length}টি কালার):</span>
                        <span className="sm:hidden">কালার ({distinctColors.length}টি):</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar py-0.5">
                        {distinctColors.map((col) => {
                            const isCurrent = activeItem?.color === col.name;
                            return (
                                <button
                                    key={col.name}
                                    type="button"
                                    onClick={() => handleColorClick(col.name)}
                                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                        isCurrent
                                            ? "bg-slate-900 text-white shadow-xs ring-2 ring-slate-900/20 scale-102"
                                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                                    }`}
                                >
                                    <span
                                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border shrink-0"
                                        style={{ backgroundColor: col.bg, borderColor: col.border }}
                                    />
                                    <span className="whitespace-nowrap">{col.name}</span>
                                    {isCurrent && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Showcase Image */}
            <div className="relative w-full aspect-square max-h-[380px] sm:max-h-[460px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-white border border-slate-200/80 group flex items-center justify-center">
                <img
                    src={activeItem?.url}
                    alt={productName}
                    className="w-full h-full object-contain p-2 sm:p-3 transition-all duration-300 group-hover:scale-102"
                />

                {/* Active Color Floating Pill */}
                {activeItem?.color && (
                    <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <span
                            className="w-2 h-2 rounded-full border border-white/40"
                            style={{ backgroundColor: colorMap[activeItem.color]?.bg || "#fff" }}
                        />
                        <span>কালার: {activeItem.color}</span>
                    </div>
                )}

                {/* Left / Right Nav Arrows */}
                {normalizedImages.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={handlePrev}
                            aria-label="Previous Image"
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 border border-slate-200 cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            aria-label="Next Image"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 border border-slate-200 cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnails Row - Single horizontally scrollable clean line */}
            {normalizedImages.length > 1 && (
                <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
                        <span>কালার ও অ্যাঙ্গেল:</span>
                        <span className="text-[10px] text-slate-400 font-medium sm:hidden">👉 সোয়াইপ করুন</span>
                    </div>
                    <div className="flex gap-2 sm:gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                        {normalizedImages.map((img, i) => {
                            const isSelected = activeIdx === i;
                            const isColorRep = distinctColors.some(c => c.firstIdx === i);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveIdx(i)}
                                    className={`relative rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-white shrink-0 group ${
                                        isSelected
                                            ? "border-emerald-600 ring-2 ring-emerald-600/30 scale-105 shadow-md z-10"
                                            : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                    } w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 p-0.5 sm:p-1`}
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="w-full h-full object-contain pointer-events-none rounded-lg sm:rounded-xl"
                                    />

                                    {/* Color Badge on Color Representative Thumbnails */}
                                    {img.color && isColorRep && (
                                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-white text-[8px] sm:text-[9px] font-bold py-0.5 px-0.5 text-center truncate leading-tight">
                                            {img.color}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
