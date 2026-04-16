"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export default function CategoryNav() {
    const [categories, setCategories] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories/mega', {
                    next: { tags: ['mega-menu'] },
                    cache: 'no-store' // Ensure fresh data for debugging, can be removed later if tagging is sufficient
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log("Mega Menu Data:", data);
                    setCategories(data);
                }
            } catch (error) {
                console.error("Failed to fetch menu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) return <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>;

    if (!categories || categories.length === 0) {
        // Optional: Fallback or empty state, but for now just don't render nav if empty to avoid breakage
        return null;
    }

    return (
        <nav className="hidden md:flex items-center gap-8 h-full">
            <Link href="/new-arrivals" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide relative group py-4">
                New Arrivals
                <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
            </Link>

            {categories.map((cat) => (
                <div
                    key={cat.slug}
                    className="group h-full flex items-center"
                    onMouseEnter={() => setActiveMenu(cat.slug)}
                    onMouseLeave={() => setActiveMenu(null)}
                >
                    <Link
                        href={`/category/${cat.slug}`}
                        className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide flex items-center gap-1 py-4 relative"
                    >
                        {cat.name}
                        {cat.subcategoryGroups?.length > 0 && <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />}
                        <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-primary transition-all group-hover:w-full" />
                    </Link>

                    {/* Mega Menu Dropdown */}
                    {cat.subcategoryGroups?.length > 0 && (
                        <div className="absolute left-0 top-full w-full bg-background border-b shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <div className="container mx-auto px-4 py-8">
                                <div className="grid grid-cols-4 gap-8">
                                    {/* Render Subcategories (Level 2) and Items (Level 3) */}
                                    {cat.subcategoryGroups.map((group) => (
                                        <div key={group.id}>
                                            <Link href={`/category/${cat.slug}/${group.slug}`} className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-xs hover:text-primary block">
                                                {group.name}
                                            </Link>

                                            {/* Render Items (Level 3) */}
                                            {group.items?.length > 0 && (
                                                <ul className="space-y-2">
                                                    {group.items.map((item) => (
                                                        <li key={item.id}>
                                                            <Link href={`/category/${cat.slug}/${group.slug}/${item.slug}`} className="text-sm text-gray-500 hover:text-primary transition-colors block">
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}

                                    {/* Placeholder for Image if less than 4 columns */}
                                    {cat.subcategoryGroups.length < 4 && (
                                        <div className="hidden lg:flex col-span-1 col-start-4 relative h-full min-h-[200px] rounded-lg overflow-hidden bg-gray-50 items-center justify-center ml-auto w-full">
                                            <div className="text-center p-6">
                                                <span className="text-gray-900 font-bold uppercase tracking-widest block mb-2">{cat.name}</span>
                                                <span className="text-xs text-gray-500">Shop Collection</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
}
