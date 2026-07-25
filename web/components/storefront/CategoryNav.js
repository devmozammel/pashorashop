"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, ArrowRight, Sparkles, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryNav() {
    const [categories, setCategories] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories/mega', { cache: 'no-store' });
                if (res.ok) setCategories(await res.json());
            } catch (error) {
                console.error("Failed to fetch menu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading) return (
        <div className="flex items-center gap-6">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            ))}
        </div>
    );

    if (!categories || categories.length === 0) return null;

    return (
        <nav className="hidden md:flex items-center h-full">
            {/* Hot Products / Hot Deals */}
            <Link
                href="/#hot-products"
                className="group relative flex items-center gap-1.5 px-3 py-2 mx-0.5 rounded-lg text-[12px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 transition-all duration-200"
            >
                <Flame className="w-3.5 h-3.5 fill-red-500 text-red-600 animate-bounce" />
                Hot Deals
            </Link>

            {/* New Arrivals — Special highlight */}
            <Link
                href="/new-arrivals"
                className="group relative flex items-center gap-1.5 px-3 py-2 mx-0.5 rounded-lg text-[12px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-all duration-200"
            >
                <Sparkles className="w-3 h-3" />
                New Arrivals
            </Link>

            {/* Separator */}
            <div className="w-px h-4 bg-gray-200 mx-1" />

            {/* Category items */}
            {categories.map((cat) => {
                const hasMega = cat.subcategoryGroups?.length > 0;
                const isActive = activeMenu === cat.slug;

                return (
                    <div
                        key={cat.slug}
                        className="relative h-full flex items-center"
                        onMouseEnter={() => setActiveMenu(cat.slug)}
                        onMouseLeave={() => setActiveMenu(null)}
                    >
                        <Link
                            href={`/category/${cat.slug}`}
                            className={`group relative flex items-center gap-1 px-3 py-2 mx-0.5 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-all duration-200
                                ${isActive
                                    ? "text-black bg-gray-100"
                                    : "text-gray-600 hover:text-black hover:bg-gray-100"
                                }`}
                        >
                            {cat.name}
                            {hasMega && (
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isActive ? "rotate-180 text-black" : "text-gray-400"}`} />
                            )}
                        </Link>

                        {/* Mega Menu Dropdown */}
                        {hasMega && (
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-[60]"
                                        style={{ minWidth: "580px" }}
                                    >
                                        {/* Arrow tip */}
                                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45 z-10 shadow-sm" />

                                        <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden">
                                            {/* Header strip */}
                                            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-100">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{cat.name}</span>
                                                <Link
                                                    href={`/category/${cat.slug}`}
                                                    className="flex items-center gap-1 text-[11px] font-bold text-black hover:gap-2 transition-all"
                                                >
                                                    View All <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>

                                            {/* Columns */}
                                            <div className="p-5 grid gap-6"
                                                style={{ gridTemplateColumns: `repeat(${Math.min(cat.subcategoryGroups.length, 4)}, 1fr)` }}
                                            >
                                                {cat.subcategoryGroups.map((group) => (
                                                    <div key={group.id} className="space-y-2.5">
                                                        <Link
                                                            href={`/category/${cat.slug}/${group.slug}`}
                                                            className="block text-[11px] font-black uppercase tracking-widest text-black hover:text-gray-600 transition-colors pb-2 border-b border-gray-100"
                                                        >
                                                            {group.name}
                                                        </Link>

                                                        {group.items?.length > 0 && (
                                                            <ul className="space-y-1.5">
                                                                {group.items.map((item) => (
                                                                    <li key={item.id}>
                                                                        <Link
                                                                            href={`/category/${cat.slug}/${group.slug}/${item.slug}`}
                                                                            className="text-[12px] text-gray-500 hover:text-black hover:translate-x-0.5 transition-all flex items-center gap-1 group/item"
                                                                        >
                                                                            <span className="w-1 h-1 rounded-full bg-gray-300 group-hover/item:bg-black transition-colors flex-shrink-0" />
                                                                            {item.name}
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Footer CTA */}
                                            <div className="px-5 py-3 bg-black flex items-center justify-between">
                                                <span className="text-white text-[11px] font-medium">Explore {cat.name} Collection</span>
                                                <Link
                                                    href={`/category/${cat.slug}`}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[11px] font-black rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-wide"
                                                >
                                                    Shop Now <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
