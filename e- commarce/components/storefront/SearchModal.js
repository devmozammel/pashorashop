"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight, Layers, TrendingUp, Tag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils/format";

export default function SearchModal({ isOpen, onClose }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ products: [], categories: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
        if (!isOpen) {
            setQuery("");
            setResults({ products: [], categories: [] });
        }
    }, [isOpen]);

    // Keyboard close
    useEffect(() => {
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 1) {
                setResults({ products: [], categories: [] });
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (query.trim()) {
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    const getProductImage = (product) => {
        if (product.productImages?.[0]?.url) return product.productImages[0].url;
        if (Array.isArray(product.images) && product.images[0]) return product.images[0];
        return null;
    };

    const getPrice = (product) => {
        return Number(product.discountPrice ?? product.salePrice ?? product.price ?? 0);
    };

    const getOriginalPrice = (product) => {
        if ((product.discountPrice || product.salePrice) && product.price) return product.price;
        return null;
    };

    if (!isOpen) return null;

    const hasResults = results.products.length > 0 || results.categories.length > 0;
    const showEmpty = query.length >= 1 && !loading && !hasResults;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-200">
                
                {/* Search Input */}
                <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5 border-b bg-white">
                    <Search className="w-5 h-5 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="পণ্যের নাম, ক্যাটাগরি বা কোড লিখুন..."
                        className="flex-1 text-base outline-none placeholder:text-gray-400 bg-transparent"
                    />
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
                    {query && !loading && (
                        <button type="button" onClick={() => setQuery("")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors ml-1">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </form>

                {/* Results Body */}
                <div className="overflow-y-auto flex-1">
                    
                    {/* Default State */}
                    {query.length < 1 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Search className="w-10 h-10 mb-3 text-gray-200" />
                            <p className="text-sm font-medium">যা খুঁজছেন তা লিখুন</p>
                            <p className="text-xs mt-1 text-gray-300">পণ্যের নাম, ক্যাটাগরি বা কোড</p>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="p-4 space-y-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {!loading && hasResults && (
                        <div className="divide-y divide-gray-50">
                            
                            {/* Categories */}
                            {results.categories.length > 0 && (
                                <div className="p-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Layers className="w-3 h-3" /> ক্যাটাগরি
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {results.categories.map(cat => (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.slug}`}
                                                onClick={onClose}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white rounded-full text-sm font-medium transition-all"
                                            >
                                                <Tag className="w-3 h-3" />
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Products */}
                            {results.products.length > 0 && (
                                <div className="p-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3" /> পণ্য ({results.products.length}টি)
                                    </p>
                                    <div className="space-y-1">
                                        {results.products.map(product => {
                                            const img = getProductImage(product);
                                            const price = getPrice(product);
                                            const original = getOriginalPrice(product);
                                            return (
                                                <Link
                                                    key={product.id}
                                                    href={`/product/${product.slug}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all group"
                                                >
                                                    {/* Image */}
                                                    <div className="relative w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                                        {img ? (
                                                            <Image src={img} alt={product.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Tag className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-black">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-sm font-bold text-gray-900">{formatCurrency(price)}</span>
                                                            {original && (
                                                                <span className="text-xs text-gray-400 line-through">{formatCurrency(original)}</span>
                                                            )}
                                                            {product.category && (
                                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{product.category.name}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No Results */}
                    {showEmpty && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Search className="w-10 h-10 mb-3 text-gray-200" />
                            <p className="text-sm font-medium text-gray-500">"{query}" এর জন্য কোনো পণ্য পাওয়া যায়নি</p>
                            <p className="text-xs mt-1">অন্য শব্দ দিয়ে সার্চ করুন</p>
                        </div>
                    )}
                </div>

                {/* Footer: View All */}
                {results.products.length > 0 && (
                    <div className="border-t bg-gray-50 px-4 py-3">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            "{query}" এর সব পণ্য দেখুন
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
