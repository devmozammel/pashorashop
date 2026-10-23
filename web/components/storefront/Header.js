"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    Search, ShoppingBag, Menu, X, Heart, MapPin, ChevronDown, Package, 
    Headset, ShieldCheck, Flame, Sparkles, Phone, MessageSquare, User, ArrowRight,
    Shirt, Crown, Baby, Dumbbell, Home, Watch, Smartphone, Gamepad2, Dog,
    CookingPot, Utensils, LayoutGrid, Loader2, Tag, Layers, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";
import UserMenu from "@/components/storefront/UserMenu";
import UserMenuMobile from "@/components/storefront/UserMenuMobile";
import NotificationDropdown from "@/components/storefront/NotificationDropdown";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import SearchModal from "@/components/storefront/SearchModal";

const BN_CAT_DATA = {
    "rice-cooker": { name: "রাইস ও ইলেকট্রিক কুকার", icon: CookingPot, hot: true },
    "gadgets": { name: "স্মার্ট গ্যাজেটস", icon: Smartphone, hot: true },
    "skincare-grooming": { name: "সবকিছু কেয়ার ও স্কিনকেয়ার", icon: Sparkles, hot: true },
    "lifestyle": { name: "দৈনন্দিন লাইফস্টাইল", icon: Home },
    "home-living": { name: "হোম ও কিচেন", icon: Utensils },
    "accessories": { name: "ফ্যাশন এক্সেসরিজ", icon: Watch },
    "phones-gadgets": { name: "ফোন ও গ্যাজেট", icon: Smartphone },
    "beauty-skincare": { name: "বিউটি ও কেয়ার", icon: Sparkles },
    "men": { name: "পুরুষদের ফ্যাশন", icon: Shirt },
    "women": { name: "নারীদের ফ্যাশন", icon: Crown },
    "teens": { name: "তরুণদের কালেকশন", icon: Sparkles },
    "kids": { name: "বাচ্চাদের আইটেম", icon: Baby },
    "sports": { name: "স্পোর্টস ও ফিটনেস", icon: Dumbbell },
    "bags-backpacks": { name: "ব্যাগ ও লাগেজ", icon: ShoppingBag },
    "perfumes-fragrances": { name: "পারফিউম ও আতর", icon: Flame },
    "gaming-pc-gear": { name: "গেমিং ও পিসি", icon: Gamepad2 },
    "pet-care-accessories": { name: "পেট কেয়ার", icon: Dog }
};

const PRIORITY_SLUGS = [
    "rice-cooker",
    "gadgets",
    "skincare-grooming",
    "lifestyle",
    "home-living",
    "accessories",
    "phones-gadgets",
    "beauty-skincare",
    "men",
    "women",
    "sports",
    "kids"
];

export default function Header({ settings }) {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    
    // Live Search Autocomplete State
    const [searchTerm, setSearchTerm] = useState("");
    const [searchSuggestions, setSearchSuggestions] = useState({ products: [], categories: [] });
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchContainerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Mega Menu State
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const megaMenuRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [expandedCat, setExpandedCat] = useState(null);

    const items = useCartStore(state => state.items);
    const openDrawer = useCartStore(state => state.openDrawer);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);

        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories/mega', { cache: 'no-store' });
                if (res.ok) setCategories(await res.json());
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };
        fetchCategories();

        const handleOpenSearch = () => setSearchOpen(true);
        const handleOpenMenu = () => setMobileMenuOpen(true);
        window.addEventListener("openSearchModal", handleOpenSearch);
        window.addEventListener("openMobileMenu", handleOpenMenu);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("openSearchModal", handleOpenSearch);
            window.removeEventListener("openMobileMenu", handleOpenMenu);
        };
    }, []);

    // Live search debounce
    useEffect(() => {
        const query = searchTerm.trim();
        if (query.length < 1) {
            setSearchSuggestions({ products: [], categories: [] });
            setSearchLoading(false);
            setSelectedIndex(-1);
            return;
        }

        setSearchLoading(true);
        setSearchDropdownOpen(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchSuggestions(data);
                }
            } catch (err) {
                console.error("Search suggestions error:", err);
            } finally {
                setSearchLoading(false);
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Click outside handler for search & mega-menu
    useEffect(() => {
        const handleOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setSearchDropdownOpen(false);
            }
            if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
                setMegaMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchTerm.trim();
        if (q) {
            setSearchDropdownOpen(false);
            router.push(`/shop?search=${encodeURIComponent(q)}`);
        }
    };

    const handleKeyDown = (e) => {
        const total = searchSuggestions.products?.length || 0;
        if (!searchDropdownOpen || total === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1 < total ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : total - 1));
        } else if (e.key === "Escape") {
            setSearchDropdownOpen(false);
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            const selected = searchSuggestions.products[selectedIndex];
            if (selected) {
                setSearchDropdownOpen(false);
                router.push(`/product/${selected.slug}`);
            }
        }
    };

    const getProductImg = (prod) => {
        if (prod.productImages && prod.productImages.length > 0 && prod.productImages[0]?.url) {
            return prod.productImages[0].url;
        }
        if (Array.isArray(prod.images) && prod.images.length > 0 && prod.images[0]) {
            return prod.images[0];
        }
        return "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=150&q=80";
    };

    // Sort categories: Priority slugs first, then remainder
    const sortedCategories = [...categories].sort((a, b) => {
        const aIndex = PRIORITY_SLUGS.indexOf(a.slug?.toLowerCase());
        const bIndex = PRIORITY_SLUGS.indexOf(b.slug?.toLowerCase());
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
    });

    const toggleExpand = (slug) => setExpandedCat(prev => prev === slug ? null : slug);
    const cartCount = mounted ? items.length : 0;
    const isSticky = settings?.enable_sticky_header !== "false";
    const supportPhone = settings?.support_phone || "+8801620778044";
    let rawWa = settings?.whatsapp || settings?.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801620778044";
    let waNumber = String(rawWa).replace(/\D/g, "");
    if (!waNumber || waNumber.includes("01337744458") || waNumber.includes("01613134043")) {
        waNumber = "8801620778044";
    }
    if (waNumber.startsWith("0")) waNumber = "88" + waNumber;
    if (!waNumber.startsWith("88")) waNumber = "88" + waNumber;

    return (
        <>
            <header
                className={cn(
                    "w-full z-[40] transition-all duration-300",
                    isSticky ? "sticky top-0" : "relative",
                    "bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)] border-b border-gray-100"
                )}
            >


                {/* ── TIER 2: Main Header Row ── */}
                <div className={cn(
                    "container mx-auto px-4 flex items-center justify-between transition-all duration-300 gap-3 md:gap-6",
                    isScrolled ? "h-14" : "h-16 md:h-[68px]"
                )}>
                    {/* Mobile: Hamburger Button */}
                    <button
                        className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open Menu"
                    >
                        <Menu className="w-5 h-5 text-gray-800" />
                    </button>

                    {/* Brand Logo */}
                    <div className="flex items-center shrink-0">
                        <Link href="/" className="flex items-center">
                            <Logo />
                        </Link>
                    </div>

                    {/* Desktop Central Live Search Bar with Instant Autocomplete */}
                    <div ref={searchContainerRef} className="hidden lg:flex flex-1 max-w-xl mx-4 relative">
                        <form onSubmit={handleSearchSubmit} className="w-full">
                            <div className="relative w-full rounded-xl ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-brand-600 bg-white overflow-hidden flex items-center transition-all shadow-sm">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => { if (searchTerm.trim().length > 0) setSearchDropdownOpen(true); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder="পণ্য, কুকার, গ্যাজেট বা স্কিনকেয়ার খুঁজুন..."
                                    className="w-full h-11 pl-4 pr-20 text-sm text-gray-900 bg-white placeholder:text-gray-400 outline-none"
                                    aria-label="Search products"
                                    autoComplete="off"
                                />

                                <div className="absolute right-12 flex items-center gap-1">
                                    {searchLoading && (
                                        <Loader2 className="w-4 h-4 animate-spin text-brand-600 mr-1" />
                                    )}
                                    {searchTerm && !searchLoading && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setSearchSuggestions({ products: [], categories: [] });
                                                setSearchDropdownOpen(false);
                                                searchInputRef.current?.focus();
                                            }}
                                            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                            title="Clear"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    aria-label="Search"
                                    className="h-11 px-4 grid place-items-center bg-brand-600 hover:bg-brand-700 text-white transition-colors shrink-0"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                        {/* Floating Live Autocomplete Dropdown */}
                        <AnimatePresence>
                            {searchDropdownOpen && searchTerm.trim().length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.99 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-gray-100 overflow-hidden z-[100] max-h-[480px] flex flex-col"
                                >
                                    {/* Categories Chips */}
                                    {searchSuggestions.categories?.length > 0 && (
                                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                                                <Layers className="w-3 h-3" /> ক্যাটাগরি:
                                            </span>
                                            {searchSuggestions.categories.map((cat) => (
                                                <Link
                                                    key={cat.id}
                                                    href={`/category/${cat.slug}`}
                                                    onClick={() => setSearchDropdownOpen(false)}
                                                    className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-gray-700 rounded-lg text-xs font-medium border border-gray-200/80 transition-colors shrink-0 flex items-center gap-1"
                                                >
                                                    <Tag className="w-2.5 h-2.5 opacity-60" />
                                                    <span>{cat.name}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Products Results List */}
                                    <div className="overflow-y-auto flex-1 divide-y divide-gray-50 py-1">
                                        {searchLoading && searchSuggestions.products?.length === 0 && (
                                            <div className="p-4 space-y-3">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                                                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!searchLoading && searchSuggestions.products?.length === 0 && searchSuggestions.categories?.length === 0 && (
                                            <div className="p-8 text-center text-gray-500">
                                                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm font-semibold text-gray-700">
                                                    &ldquo;{searchTerm}&rdquo; দিয়ে কোনো পণ্য পাওয়া যায়নি
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    কুকার, গ্রাইন্ডার, গ্যাজেট বা স্কিনকেয়ার লিখে সার্চ করে দেখতে পারেন
                                                </p>
                                            </div>
                                        )}

                                        {searchSuggestions.products?.map((prod, idx) => {
                                            const img = getProductImg(prod);
                                            const currentPrice = Number(prod.discountPrice ?? prod.salePrice ?? prod.price ?? 0);
                                            const origPrice = (prod.discountPrice || prod.salePrice) && prod.price ? Number(prod.price) : null;
                                            const isSelected = selectedIndex === idx;

                                            return (
                                                <Link
                                                    key={prod.id}
                                                    href={`/product/${prod.slug}`}
                                                    onClick={() => setSearchDropdownOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 transition-colors group",
                                                        isSelected ? "bg-emerald-50" : "hover:bg-gray-50"
                                                    )}
                                                >
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/60 shrink-0 relative">
                                                        <Image
                                                            src={img}
                                                            alt={prod.name}
                                                            fill
                                                            sizes="48px"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                                            {prod.name}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {prod.category?.name && (
                                                                <span className="text-[10px] text-gray-600 bg-gray-100 font-medium px-1.5 py-0.5 rounded">
                                                                    {prod.category.name}
                                                                </span>
                                                            )}
                                                            <span className="text-xs font-bold text-emerald-600">
                                                                {formatPrice(currentPrice)}
                                                            </span>
                                                            {origPrice && origPrice > currentPrice && (
                                                                <span className="text-[11px] text-gray-400 line-through">
                                                                    {formatPrice(origPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    {/* Bottom Footer: View all results */}
                                    <div className="p-2.5 bg-gray-50 border-t border-gray-100 shrink-0">
                                        <button
                                            type="button"
                                            onClick={handleSearchSubmit}
                                            className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <span>&ldquo;{searchTerm}&rdquo; দিয়ে সকল পণ্য দেখুন</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right action icons & buttons */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                        {/* Mobile Search Button */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-700"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Desktop Support CTA */}
                        <Link
                            href="/contact"
                            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                            <Headset className="w-4 h-4 text-brand-600" />
                            <span>সাপোর্ট</span>
                        </Link>

                        {/* Notifications — desktop */}
                        <div className="hidden md:block">
                            <NotificationDropdown />
                        </div>

                        {/* Wishlist */}
                        <Link
                            href="/wishlist"
                            className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-black relative"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                        </Link>

                        {/* User Menu — desktop */}
                        <div className="hidden md:block">
                            <UserMenu />
                        </div>

                        {/* Cart Button */}
                        <button
                            onClick={openDrawer}
                            className="relative p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 hover:text-brand-700 group flex items-center"
                            aria-label="Open Cart"
                        >
                            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── TIER 3: Category Pills Sub-Navbar (Desktop) ── */}
                <div className="hidden lg:block bg-white border-t border-gray-100 relative">
                    <div className="container mx-auto px-4 h-11 flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
                        
                        {/* All Categories Button with Mega Menu Dropdown */}
                        <div ref={megaMenuRef} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setMegaMenuOpen(prev => !prev)}
                                className={cn(
                                    "px-3.5 py-2 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg font-bold whitespace-nowrap inline-flex items-center gap-1.5 border border-emerald-200 transition-all",
                                    megaMenuOpen && "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                )}
                            >
                                <LayoutGrid className={cn("w-3.5 h-3.5", megaMenuOpen ? "text-white" : "text-emerald-700")} />
                                <span>সব ক্যাটাগরি</span>
                                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", megaMenuOpen && "rotate-180")} />
                            </button>

                            {/* Mega Menu Dropdown Card */}
                            <AnimatePresence>
                                {megaMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.16 }}
                                        className="absolute left-0 top-[calc(100%+8px)] w-[680px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-gray-100 p-5 z-[100]"
                                    >
                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                                জনপ্রিয় ক্যাটাগরি ও কালেকশন
                                            </p>
                                            <Link
                                                href="/shop"
                                                onClick={() => setMegaMenuOpen(false)}
                                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                            >
                                                সব পণ্য দেখুন <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {sortedCategories.map((cat) => {
                                                const meta = BN_CAT_DATA[cat.slug?.toLowerCase()] || { name: cat.name, icon: ShoppingBag };
                                                const IconComp = meta.icon;
                                                return (
                                                    <Link
                                                        key={cat.id}
                                                        href={`/category/${cat.slug}`}
                                                        onClick={() => setMegaMenuOpen(false)}
                                                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50/70 group transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white grid place-items-center shrink-0 transition-colors">
                                                            <IconComp className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-gray-800 group-hover:text-emerald-800 truncate">
                                                                {meta.name}
                                                            </p>
                                                            {meta.hot && (
                                                                <span className="text-[9px] font-bold text-rose-600 uppercase">
                                                                    হট চয়েস
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Flash Sale Pill */}
                        <Link 
                            href="/flash-sale" 
                            className="px-3 py-1.5 text-rose-700 hover:bg-rose-50 rounded-lg font-bold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors border border-rose-100/80 bg-rose-50/40"
                        >
                            <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                            ফ্ল্যাশ সেল
                        </Link>

                        {/* New Arrivals Pill */}
                        <Link 
                            href="/new-arrivals" 
                            className="px-3 py-1.5 text-gray-700 hover:text-emerald-700 hover:bg-gray-50 rounded-lg font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            নতুন কালেকশন
                        </Link>

                        {/* Top Category Badges in Priority Order */}
                        {sortedCategories.slice(0, 8).map((cat) => {
                            const meta = BN_CAT_DATA[cat.slug?.toLowerCase()] || { name: cat.name, icon: ShoppingBag };
                            const IconComponent = meta.icon;
                            return (
                                <Link
                                    key={cat.id}
                                    href={`/category/${cat.slug}`}
                                    className="px-2.5 py-1.5 text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/80 rounded-lg font-medium whitespace-nowrap inline-flex items-center gap-1.5 transition-colors"
                                >
                                    <IconComponent className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                                    <span>{meta.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>

            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-[100] flex md:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="relative w-[86%] max-w-[340px] bg-white h-full shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Drawer Brand Header */}
                            <div className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 text-white p-4 pt-5 pb-5">
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white transition-colors"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white p-1 grid place-items-center shadow shrink-0">
                                        <Logo variant="black" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-extrabold text-base leading-tight truncate">
                                            {settings?.store_name || "Pashora Shop"}
                                        </p>
                                        <p className="text-[11px] opacity-90 truncate">
                                            বাংলাদেশের বিশ্বস্ত অনলাইন শপ
                                        </p>
                                    </div>
                                </div>

                                {/* Call & WhatsApp Quick Buttons */}
                                <div className="mt-3.5 grid grid-cols-2 gap-2">
                                    <a
                                        href={`tel:${supportPhone}`}
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 transition-colors"
                                    >
                                        <Phone className="w-3.5 h-3.5" />
                                        কল করুন
                                    </a>
                                    <a
                                        href={`https://wa.me/${waNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-black py-2 transition-colors shadow-sm"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                        WhatsApp
                                    </a>
                                </div>
                            </div>

                            {/* Search Bar in Drawer */}
                            <div className="px-3.5 py-3 border-b border-gray-100 bg-gray-50/50">
                                <form onSubmit={(e) => { e.preventDefault(); setMobileMenuOpen(false); handleSearchSubmit(e); }} className="relative flex">
                                    <input
                                        type="search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="পণ্য বা ব্র্যান্ড খুঁজুন..."
                                        className="w-full h-10 pl-3 pr-10 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                                    />
                                    <button type="submit" className="absolute right-0 top-0 h-10 w-10 grid place-items-center text-gray-400 hover:text-brand-600">
                                        <Search className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar overscroll-contain">
                                {/* Main Links */}
                                <ul className="px-2 py-2 border-b border-gray-100">
                                    <li>
                                        <Link
                                            href="/"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                        >
                                            <span className="w-4 h-4 grid place-items-center text-gray-500 shrink-0">🏠</span>
                                            <span className="flex-1 truncate">হোম</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/shop"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                        >
                                            <span className="w-4 h-4 grid place-items-center text-gray-500 shrink-0">🛍️</span>
                                            <span className="flex-1 truncate">সব পণ্য</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/flash-sale"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <span className="w-4 h-4 grid place-items-center text-red-500 shrink-0">⚡</span>
                                            <span className="flex-1 truncate font-bold">ফ্ল্যাশ সেল</span>
                                            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Hot</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/track"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-800 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                        >
                                            <Package className="w-4 h-4 text-gray-500 shrink-0" />
                                            <span className="flex-1 truncate">অর্ডার ট্র্যাক করুন</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                                        </Link>
                                    </li>
                                </ul>

                                {/* Categories Section Header */}
                                <div className="px-4 pt-3 pb-1">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">ক্যাটাগরি সমূহ</p>
                                </div>

                                <ul className="px-2 pb-3">
                                    {categories.map((cat) => {
                                        const hasSubs = cat.subcategoryGroups?.length > 0;
                                        const isExpanded = expandedCat === cat.slug;
                                        const meta = (cat.slug && BN_CAT_DATA[cat.slug.toLowerCase()]) || { name: cat.name, icon: ShoppingBag };
                                        const IconComp = meta?.icon || ShoppingBag;

                                        return (
                                            <li key={cat.id} className="border-b border-gray-50 last:border-0">
                                                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <Link
                                                        href={`/category/${cat.slug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="flex items-center gap-2.5 flex-1 min-w-0"
                                                    >
                                                        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 grid place-items-center text-xs shrink-0">
                                                            <IconComp className="w-3.5 h-3.5" />
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-800 truncate">
                                                            {meta.name}
                                                        </span>
                                                    </Link>
                                                    {hasSubs && (
                                                        <button
                                                            onClick={() => toggleExpand(cat.slug)}
                                                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                                            aria-label="Expand category"
                                                        >
                                                            <ChevronDown className={cn(
                                                                "w-4 h-4 transition-transform duration-200",
                                                                isExpanded && "rotate-180"
                                                            )} />
                                                        </button>
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && hasSubs && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-gray-50 rounded-lg mx-2 mb-2 p-2.5 space-y-2"
                                                        >
                                                            {cat.subcategoryGroups.map(group => (
                                                                <div key={group.id} className="space-y-1">
                                                                    <Link
                                                                        href={`/category/${cat.slug}/${group.slug}`}
                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                        className="block text-xs font-bold text-gray-700 uppercase"
                                                                    >
                                                                        {group.name}
                                                                    </Link>
                                                                    {group.items?.length > 0 && (
                                                                        <div className="pl-2 border-l border-gray-200 space-y-1">
                                                                            {group.items.map(item => (
                                                                                <Link
                                                                                    key={item.id}
                                                                                    href={`/category/${cat.slug}/${group.slug}/${item.slug}`}
                                                                                    onClick={() => setMobileMenuOpen(false)}
                                                                                    className="block text-[11px] text-gray-500 hover:text-brand-700 py-0.5"
                                                                                >
                                                                                    {item.name}
                                                                                </Link>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Account link */}
                                <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <UserMenuMobile onClick={() => setMobileMenuOpen(false)} />
                                </div>
                            </div>

                            {/* Drawer Bottom Trust Strip */}
                            <div className="border-t border-gray-100 bg-emerald-50/50 px-4 py-2.5 flex items-center justify-between text-[11px] text-gray-600">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    ১০০% অরিজিনাল
                                </span>
                                <span className="font-semibold text-gray-500">ক্যাশ অন ডেলিভারি</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
