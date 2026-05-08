
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ProductImageGallery({ images, name }) {
    const [activeImage, setActiveImage] = useState(images?.[0] || "");

    if (!images || images.length === 0) {
        return (
            <div className="bg-gray-100 rounded-xl aspect-square flex items-center justify-center text-muted-foreground">
                No Image
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden group">
                <Image
                    src={activeImage}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                />
                {/* Mobile Swipe hints could go here, but native scroll is simpler below */}
            </div>

            {/* Thumbnails / Horizontal Scroll on Mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className={cn(
                            "relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 snap-start transition-all",
                            activeImage === img ? "border-primary" : "border-transparent opacity-70 hover:opacity-100 hover:border-gray-300"
                        )}
                    >
                        <Image src={img} alt={`${name} ${idx}`} fill className="object-cover" />
                    </button>
                ))}
            </div>
        </div>
    );
}
