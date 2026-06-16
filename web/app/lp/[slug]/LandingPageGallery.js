"use client";

import { useState } from "react";

export default function LandingPageGallery({ images, productName }) {
    const [activeIdx, setActiveIdx] = useState(0);

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-square flex items-center justify-center text-gray-400 text-4xl bg-white border rounded-2xl shadow-lg">
                📦
            </div>
        );
    }

    const activeImage = images[activeIdx];

    return (
        <div className="space-y-4 w-full">
            {/* Main Image */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl bg-white border">
                <img
                    src={activeImage}
                    alt={productName}
                    className="w-full h-full object-cover transition-all duration-300"
                />
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex gap-3 flex-wrap">
                    {images.map((img, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                console.log("Thumbnail clicked:", i);
                                setActiveIdx(i);
                            }}
                            className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white shrink-0 ${
                                activeIdx === i 
                                    ? "border-red-600 ring-2 ring-red-600/20 scale-105 shadow-sm" 
                                    : "border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
                            }`}
                        >
                            <img 
                                src={img} 
                                alt="" 
                                className="w-full h-full object-cover pointer-events-none" 
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
