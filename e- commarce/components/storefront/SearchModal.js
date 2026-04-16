"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ArrowRight, Layers, TrendingUp } from "lucide-react";
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
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
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
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 flex flex-col max-h-[80vh]">
                <form onSubmit={handleSubmit} className="border-b p-4 flex items-center gap-3 bg-white z-10">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for products, categories..."
                        className="flex-1 text-lg outline-none placeholder:text-gray-400"
                    />
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </form>

                <div className="overflow-y-auto p-4 bg-gray-50 flex-1">
                    {query.length < 2 && (
                        <div className="text-center py-8 text-gray-500">
                            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Type to search...</p>
                        </div>
                    )}

                    {(results.categories.length > 0 || results.products.length > 0) && (
                        <div className="space-y-6">
                            {results.categories.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Categories
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {results.categories.map(cat => (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.slug}`}
                                                onClick={onClose}
                                                className="px-3 py-1 bg-white border rounded-full text-sm hover:bg-primary hover:text-white hover:border-primary transition-colors"
                                            >
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.products.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Products</h3>
                                    <div className="space-y-2">
                                        {results.products.map(product => {
                                            const price = Number(product.discountPrice ?? product.salePrice ?? product.price ?? 0);
                                            return (
                                                <Link
                                                    key={product.id}
                                                    href={`/product/${product.slug}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-4 p-2 bg-white rounded-lg hover:shadow-md transition-all group border border-transparent hover:border-gray-100"
                                                >
                                                    <div className="relative w-12 h-12 bg-gray-100 rounded-md overflow-hidden shrink-0">
                                                        {product.images?.[0] && (
                                                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                                                        <p className="text-sm text-muted-foreground">{formatCurrency(price)}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {query.length >= 2 && results.products.length === 0 && results.categories.length === 0 && !loading && (
                        <div className="py-8 text-center text-gray-500">
                            No results found for "{query}"
                        </div>
                    )}
                </div>

                {results.products.length > 0 && (
                    <div className="p-3 bg-white border-t">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            View all results for "{query}"
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
