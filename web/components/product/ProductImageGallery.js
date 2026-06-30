"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon, ZoomIn } from "lucide-react";

// Fallback placeholder — shows when image fails to load
const PLACEHOLDER = "/placeholder-product.png";

function SafeImage({ src, alt, className, priority = false, onError: onErrorProp }) {
    const [failed, setFailed] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        // If image already loaded (e.g. from cache or before JS execution)
        if (imgRef.current && imgRef.current.complete) {
            setLoaded(true);
        }
    }, [src]);

    const handleError = () => {
        setFailed(true);
        onErrorProp?.();
    };

    if (failed || !src) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-gray-100 text-gray-300 gap-2", className)}>
                <ImageIcon className="w-10 h-10" />
                <span className="text-xs text-gray-400">ছবি লোড হয়নি</span>
            </div>
        );
    }

    return (
        <>
            {!loaded && (
                <div className={cn("absolute inset-0 bg-gray-100 animate-pulse", className)} />
            )}
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                onError={handleError}
                onLoad={() => setLoaded(true)}
                className={cn(
                    "object-cover w-full h-full transition-all duration-300",
                    loaded ? "opacity-100 scale-100" : "opacity-0 scale-105",
                    className
                )}
            />
        </>
    );
}

export default function ProductImageGallery({ images, name }) {
    const safeImages = (Array.isArray(images) ? images : []).filter(Boolean);

    const [activeIdx, setActiveIdx] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const scrollRef = useRef(null);

    const handleScroll = (e) => {
        const container = e.target;
        const scrollLeft = container.scrollLeft;
        const width = container.clientWidth;
        if (width > 0) {
            const newIndex = Math.round(scrollLeft / width);
            if (newIndex !== activeIdx && newIndex >= 0 && newIndex < safeImages.length) {
                setActiveIdx(newIndex);
            }
        }
    };

    useEffect(() => {
        if (safeImages.length > 0) setActiveIdx(0);
    }, [images]);

    const activeImage = safeImages[activeIdx] || null;

    // Close lightbox on ESC
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") setLightbox(false); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    if (safeImages.length === 0) {
        return (
            <div className="w-full aspect-[3/4] max-h-[500px] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300 gap-3">
                <ImageIcon className="w-16 h-16" />
                <p className="text-sm text-gray-400">কোনো ছবি নেই</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-4 sticky top-24">

                {/* Main Image Container */}
                <div className="w-full">
                    {/* Desktop Main */}
                    <div
                        className="hidden md:block relative w-full aspect-square max-h-[580px] bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in group"
                        onClick={() => setLightbox(true)}
                    >
                        <SafeImage src={activeImage} alt={`${name}`} priority />
                        <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <ZoomIn className="w-3 h-3" /> Zoom
                        </div>
                    </div>

                    {/* Mobile Horizontal Scroll */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth gap-3"
                    >
                        {safeImages.map((img, idx) => (
                            <div
                                key={idx}
                                className="flex-shrink-0 w-full snap-center relative aspect-square max-h-[480px] bg-gray-50 rounded-2xl overflow-hidden"
                            >
                                <SafeImage src={img} alt={`${name} - ${idx + 1}`} priority={idx === 0} />
                                {safeImages.length > 1 && (
                                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                        {idx + 1} / {safeImages.length}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Dot Indicators — Mobile */}
                    {safeImages.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-3 md:hidden">
                            {safeImages.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all",
                                        idx === activeIdx ? "bg-black w-4" : "bg-gray-300 w-1.5"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Thumbnails — Desktop (Horizontal row below main image) */}
                {safeImages.length > 1 && (
                    <div className="hidden md:flex md:flex-row gap-3 overflow-x-auto scrollbar-hide py-1">
                        {safeImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIdx(idx)}
                                className={cn(
                                    "relative w-[76px] h-[76px] rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                                    activeIdx === idx
                                        ? "border-black ring-2 ring-black/10 shadow-sm"
                                        : "border-gray-100 hover:border-gray-300"
                                )}
                            >
                                <SafeImage src={img} alt={`${name} - ${idx + 1}`} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox — Desktop zoom */}
            {lightbox && activeImage && (
                <div
                    className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightbox(false)}
                >
                    <div className="relative max-w-3xl max-h-[90vh] w-full">
                        <img
                            src={activeImage}
                            alt={name}
                            className="w-full h-full object-contain rounded-xl max-h-[90vh]"
                            onError={(e) => { e.target.src = PLACEHOLDER; }}
                        />
                    </div>

                    {/* Thumbnail Navigation in Lightbox */}
                    {safeImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {safeImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(idx); }}
                                    className={cn(
                                        "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                                        idx === activeIdx ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER; }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
