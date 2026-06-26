"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import {
    Loader2, SlidersHorizontal, X, ChevronRight,
    LayoutGrid, List, Search, Tag, ArrowUpDown
} from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import SortDropdown from "@/components/ui/SortDropdown";

const SORT_OPTIONS = [
    { value: "newest", label: "Newest First" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "popular", label: "Most Popular" },
];

function SkeletonCard() {
    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
            <div className="aspect-[3/4] bg-gray-100" />
            <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
}

export default function ShopClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { addItem } = useCartStore();

    const [products, setProducts] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
    const [localMin, setLocalMin] = useState("");
    const [localMax, setLocalMax] = useState("");

    // Filters from URL
    const categoryId = searchParams.get("categoryId") || "";
    const subGroupId = searchParams.get("subGroupId") || "";
    const subItemId = searchParams.get("subItemId") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const page = parseInt(searchParams.get("page") || "1");

    useEffect(() => {
        setLocalMin(minPrice);
        setLocalMax(maxPrice);
    }, [minPrice, maxPrice]);

    useEffect(() => {
        fetch("/api/categories?includeSub=true")
            .then(res => res.json())
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams(searchParams);
        fetch(`/api/products?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data.products || []);
                setMetadata(data.pagination || null);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [searchParams]);

    const updateFilter = (key, value) => {
        const params = new URLSearchParams(searchParams);

        if (value) params.set(key, value);
        else params.delete(key);

        // If category changes, remove subcategory filter
        if (key === "categoryId") {
            params.delete("subGroupId");
            params.delete("subItemId");
        } else if (key === "subGroupId") {
            params.delete("subItemId");
        }

        if (key !== "page") params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams);
        if (localMin) params.set("minPrice", localMin); else params.delete("minPrice");
        if (localMax) params.set("maxPrice", localMax); else params.delete("maxPrice");
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const clearAllFilters = () => {
        router.push(pathname);
    };

    const hasFilters = categoryId || subGroupId || minPrice || maxPrice;

    // Find active names for breadcrumb/title
    const activeCategory = categories.find(c => c.id === categoryId);
    const activeCategoryName = activeCategory?.name;
    const activeGroup = activeCategory?.subcategoryGroups?.find(g => g.id === subGroupId);
    const activeGroupName = activeGroup?.name;
    const activeItemName = activeGroup?.items?.find(i => i.id === subItemId)?.name;

    const selectedCategoryLabel = activeItemName || activeGroupName || activeCategoryName || null;

    const SidebarContent = () => (
        <div className="space-y-7">
            {/* Categories */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Categories</p>
                <div className="space-y-1">
                    <button
                        onClick={() => { updateFilter("categoryId", ""); setMobileFilterOpen(false); }}
                        className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${!categoryId ? "bg-red-600 text-white font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
                    >
                        All Products
                        {!categoryId && <ChevronRight className="w-4 h-4" />}
                    </button>
                    {categories.map(cat => (
                        <div key={cat.id} className="space-y-1 mt-1">
                            <button
                                onClick={() => { updateFilter("categoryId", cat.id); setMobileFilterOpen(false); }}
                                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${categoryId === cat.id ? "bg-red-600 text-white font-semibold shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}
                            >
                                {cat.name}
                                {categoryId === cat.id && <ChevronRight className="w-4 h-4" />}
                            </button>

                            {/* Render Subcategories ONLY if this category is selected and has subcategories */}
                            {categoryId === cat.id && cat.subcategoryGroups && cat.subcategoryGroups.length > 0 && (
                                <div className="pl-4 py-1 space-y-1">
                                    {cat.subcategoryGroups.map(group => (
                                        <div key={group.id} className="space-y-1">
                                            <button
                                                onClick={() => { updateFilter("subGroupId", group.id); setMobileFilterOpen(false); }}
                                                className={`w-full text-left flex items-center px-3 py-1.5 rounded-lg text-sm transition-all ${subGroupId === group.id ? "font-bold text-red-600 border-l-2 border-red-600 bg-red-50" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-l-2 border-transparent"}`}
                                            >
                                                {group.name}
                                            </button>

                                            {/* Render 3rd Level Subcategory Items ONLY if this group is selected and has items */}
                                            {subGroupId === group.id && group.items && group.items.length > 0 && (
                                                <div className="pl-4 py-1 space-y-1 border-l-2 border-red-100 ml-3">
                                                    {group.items.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => { updateFilter("subItemId", item.id); setMobileFilterOpen(false); }}
                                                            className={`w-full text-left flex items-center px-3 py-1.5 rounded-lg text-[13px] transition-all ${subItemId === item.id ? "font-bold text-red-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}
                                                        >
                                                            • {item.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Price Range */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Price Range</p>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Min (৳)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition"
                                value={localMin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setLocalMin(val);
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Max (৳)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="5000"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition"
                                value={localMax}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setLocalMax(val);
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={() => { applyPriceFilter(); setMobileFilterOpen(false); }}
                        className="w-full bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium py-2.5 rounded-xl transition"
                    >
                        Apply Price Filter
                    </button>
                </div>
            </div>

            {/* Clear All */}
            {hasFilters && (
                <>
                    <div className="border-t border-gray-100" />
                    <button
                        onClick={() => { clearAllFilters(); setMobileFilterOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium py-2 rounded-xl hover:bg-red-50 transition"
                    >
                        <X className="w-4 h-4" /> Clear All Filters
                    </button>
                </>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <Link href="/" className="hover:text-gray-600">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-gray-700 font-medium">{selectedCategoryLabel || "All Products"}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {selectedCategoryLabel || "Shop All Products"}
                    </h1>
                    {metadata && (
                        <p className="text-sm text-gray-500 mt-1">
                            {metadata.total} product{metadata.total !== 1 ? "s" : ""} available
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* DESKTOP Sidebar */}
                    <aside className="w-64 shrink-0 hidden md:block">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
                            <SidebarContent />
                        </div>
                    </aside>

                    {/* Main content listing */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 mb-5 flex flex-wrap items-center gap-3">
                            {/* Mobile filter btn */}
                            <button
                                onClick={() => setMobileFilterOpen(true)}
                                className="md:hidden flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition"
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Filters {hasFilters && <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                            </button>

                            {/* Active filter chips */}
                            <div className="flex flex-wrap gap-2 flex-1">
                                {activeCategoryName && (
                                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200">
                                        <Tag className="w-3 h-3" />
                                        {activeCategoryName}
                                        <button onClick={() => updateFilter("categoryId", "")} className="hover:text-red-900"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                                {activeGroupName && (
                                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full border border-red-200">
                                        <Tag className="w-3 h-3" />
                                        {activeGroupName}
                                        <button onClick={() => updateFilter("subGroupId", "")} className="hover:text-red-900"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                                {(minPrice || maxPrice) && (
                                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full border border-amber-200">
                                        ৳{minPrice || "0"} — ৳{maxPrice || "∞"}
                                        <button onClick={() => { setLocalMin(""); setLocalMax(""); const p = new URLSearchParams(searchParams); p.delete("minPrice"); p.delete("maxPrice"); router.push(`${pathname}?${p.toString()}`); }} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                                    </span>
                                )}
                            </div>

                            {/* Sort + View toggles */}
                            <div className="flex items-center gap-3 ml-auto">
                                <SortDropdown 
                                    options={SORT_OPTIONS}
                                    value={sort}
                                    onChange={(val) => updateFilter("sort", val)}
                                />
                                <div className="hidden md:flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 transition ${viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-2 transition ${viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Product Grid / List */}
                        {loading ? (
                            <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 py-24 flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Search className="w-7 h-7 text-gray-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 text-lg">No products found</p>
                                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or browse all products.</p>
                                </div>
                                {hasFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        ) : viewMode === "list" ? (
                            <div className="space-y-3">
                                {products.map(product => (
                                    <Link key={product.id} href={`/product/${product.slug}`}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 p-4 hover:shadow-md transition-shadow group"
                                    >
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 relative">
                                            <Image
                                                src={Array.isArray(product.images) ? product.images[0] : (product.productImages?.[0]?.url || "/placeholder.png")}
                                                alt={product.name}
                                                fill
                                                sizes="80px"
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">{product.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{product.category?.name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-gray-900">৳{(product.salePrice || product.price)?.toLocaleString()}</p>
                                            {product.salePrice && product.price > product.salePrice && (
                                                <div className="flex flex-col items-end">
                                                    <p className="text-xs text-gray-400 line-through">৳{product.price?.toLocaleString()}</p>
                                                    <p className="text-[10px] font-bold text-red-600">
                                                        -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {products.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {metadata && metadata.totalPages > 1 && (
                            <div className="flex justify-center mt-10 gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => updateFilter("page", page - 1)}
                                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
                                >
                                    ← Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: metadata.totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => updateFilter("page", p)}
                                            className={`w-10 h-10 rounded-xl text-sm font-medium transition ${p === page ? "bg-red-600 text-white shadow" : "border border-gray-200 hover:bg-gray-100 text-gray-600"}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={page >= metadata.totalPages}
                                    onClick={() => updateFilter("page", page + 1)}
                                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-100 transition"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE Filter Drawer */}
            {mobileFilterOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl md:hidden flex flex-col">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                                <h2 className="font-bold text-gray-900">Filters</h2>
                            </div>
                            <button onClick={() => setMobileFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <SidebarContent />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
