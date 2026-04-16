"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ProductImageGallery({ images, name }) {
    // Ensure we always have an array
    const safeImages = Array.isArray(images) ? images : [];

    // Initialize state
    const [activeImage, setActiveImage] = useState(safeImages[0] || "");

    // Update state when props change
    useEffect(() => {
        if (safeImages.length > 0) {
            setActiveImage(safeImages[0]);
        } else {
            setActiveImage("");
        }
    }, [safeImages]);

    return (
        <div className="flex flex-col-reverse md:flex-row gap-6 sticky top-24">

            {/* Thumbnails - Hidden on mobile, shown on md+ */}
            {safeImages.length > 1 && (
                <div className="hidden md:flex md:flex-col gap-3 overflow-y-auto md:max-h-[450px] scrollbar-hide shrink-0">
                    {safeImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveImage(img)}
                            className={cn(
                                "relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                                activeImage === img
                                    ? "border-primary ring-2 ring-primary/10"
                                    : "border-gray-100 hover:border-gray-300"
                            )}
                            aria-label={`View image ${idx + 1}`}
                        >
                            <img
                                src={img}
                                alt={`${name} - Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Gallery / Mobile Slider */}
            <div className="flex-1 w-full relative group">
                {/* Mobile: Horizontal Scroll with Snap */}
                <div className="flex md:block overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar scroll-smooth">
                    {safeImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex-shrink-0 w-full snap-center md:snap-align-none",
                                idx > 0 ? "hidden md:flex" : "flex",
                                activeImage === img ? "md:flex" : "md:hidden"
                            )}
                        >
                            <div className="w-full relative aspect-[3/4] md:aspect-square lg:aspect-[3/4] max-h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in">
                                <img
                                    src={img}
                                    alt={`${name} - Image ${idx + 1}`}
                                    className="object-cover w-full h-full transition-transform duration-500 ease-in-out hover:scale-105"
                                />
                                {/* Mobile Index Indicator */}
                                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full md:hidden">
                                    {idx + 1} / {safeImages.length}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dot Indicators (Mobile Only) */}
                {safeImages.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4 md:hidden">
                        {safeImages.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    activeImage === safeImages[idx] ? "bg-primary w-4" : "bg-gray-300"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
