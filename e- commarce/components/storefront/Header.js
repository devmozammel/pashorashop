"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/ui/Logo";
import UserMenu from "@/components/storefront/UserMenu";
import UserMenuMobile from "@/components/storefront/UserMenuMobile";
import NotificationDropdown from "@/components/storefront/NotificationDropdown";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import SearchModal from "@/components/storefront/SearchModal";
import CategoryNav from "@/components/storefront/CategoryNav";

export default function Header({ settings }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Mobile Data
    const [categories, setCategories] = useState([]);
    const [expandedCat, setExpandedCat] = useState(null);

    // Global Cart Store
    const items = useCartStore(state => state.items);

    // Hydration safe cart count
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);

        // Fetch Categories for Mobile Menu
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories/mega');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
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

    const toggleExpand = (slug) => {
        setExpandedCat(prev => prev === slug ? null : slug);
    };

    const cartCount = mounted ? items.length : 0;
    const isSticky = settings?.enable_sticky_header !== "false";

    return (
        <>
            <header
                className={cn(
                    "w-full z-[40] transition-all duration-300 border-b",
                    isSticky ? "sticky top-0" : "relative",
                    isScrolled
                        ? "glass shadow-sm"
                        : "bg-background border-transparent"
                )}
            >


                <div className={cn(
                    "container mx-auto px-4 flex items-center justify-between transition-all duration-300",
                    isScrolled ? "h-14" : "h-16 md:h-20"
                )}>
                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 -ml-2 text-foreground/80 hover:text-foreground"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open Menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo - Centered dynamically */}
                    <div className="flex-1 flex justify-center md:flex-none md:justify-start md:mr-8 transition-transform">
                        <Link href="/">
                            <Logo />
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:block flex-1">
                        <CategoryNav />
                    </div>

                    {/* Icons */}
                    <div className="flex items-center gap-1 md:gap-3">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2 text-foreground/80 hover:text-foreground hover:bg-secondary/50 rounded-full transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <div className="hidden md:block">
                            <NotificationDropdown />
                        </div>

                        <Link
                            href="/wishlist"
                            className="p-2 text-foreground/80 hover:text-foreground hover:bg-secondary/50 rounded-full transition-colors relative"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                        </Link>

                        <div className="hidden md:block">
                            <UserMenu />
                        </div>

                        {/* Track Order Link */}
                        <Link 
                            href="/track" 
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-all text-[11px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-100 mr-2 shadow-sm"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Track Order
                        </Link>

                        <Link
                            href="/cart"
                            className="p-2 text-foreground/80 hover:text-foreground hover:bg-secondary/50 rounded-full transition-colors relative group"
                            aria-label="Cart"
                        >
                            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-in zoom-in animate-pulse shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-[100] flex md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-[300px] bg-white h-full shadow-2xl flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="h-[60px] flex items-center justify-between px-5 border-b border-gray-100">
                                <span className="font-bold text-xl text-gray-900">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <nav className="flex flex-col">
                                    <Link
                                        href="/"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-6 py-4 font-semibold text-gray-800 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        Home
                                    </Link>

                                    {categories.length === 0 && (
                                        <div className="px-6 py-8 text-center text-sm text-gray-400">
                                            <div className="animate-pulse flex flex-col gap-4">
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} className="h-5 bg-gray-100 rounded w-full" />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {categories.map((cat) => {
                                        const hasSubs = cat.subcategoryGroups && cat.subcategoryGroups.length > 0;
                                        const isExpanded = expandedCat === cat.slug;

                                        return (
                                            <div key={cat.id} className="border-b border-gray-50">
                                                <div className="flex items-center justify-between px-6 py-4 active:bg-gray-50">
                                                    <Link
                                                        href={`/category/${cat.slug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="font-semibold text-[15px] text-gray-800 flex-1"
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                    {hasSubs && (
                                                        <button
                                                            onClick={() => toggleExpand(cat.slug)}
                                                            className="p-2 -mr-2"
                                                        >
                                                            <div className={cn(
                                                                "w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-400 transition-transform duration-300",
                                                                isExpanded ? "rotate-180" : ""
                                                            )} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Subcategories Accordion */}
                                                <AnimatePresence>
                                                    {isExpanded && hasSubs && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-gray-50/50"
                                                        >
                                                            <div className="px-8 pb-4 space-y-4 pt-2">
                                                                {cat.subcategoryGroups.map(group => (
                                                                    <div key={group.id} className="space-y-3">
                                                                        <Link
                                                                            href={`/category/${cat.slug}/${group.slug}`}
                                                                            onClick={() => setMobileMenuOpen(false)}
                                                                            className="block text-sm font-bold text-gray-900"
                                                                        >
                                                                            {group.name}
                                                                        </Link>
                                                                        {group.items?.length > 0 && (
                                                                            <div className="grid grid-cols-1 gap-3 pl-2">
                                                                                {group.items.map(item => (
                                                                                    <Link
                                                                                        key={item.id}
                                                                                        href={`/category/${cat.slug}/${group.slug}/${item.slug}`}
                                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                                        className="text-[13px] text-gray-500 hover:text-black transition-colors"
                                                                                    >
                                                                                        {item.name}
                                                                                    </Link>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </nav>

                                {/* Secondary Links */}
                                <div className="mt-6 px-6 pb-20 space-y-6">
                                    <Link
                                        href="/track"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-[15px] font-medium text-gray-500 hover:text-gray-900"
                                    >
                                        Track Order
                                    </Link>
                                    <Link
                                        href="/wishlist"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-[15px] font-medium text-gray-500 hover:text-gray-900"
                                    >
                                        My Wishlist
                                    </Link>
                                    <Link
                                        href="/my-orders"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-[15px] font-medium text-gray-500 hover:text-gray-900"
                                    >
                                        My Orders
                                    </Link>
                                </div>
                            </div>

                            {/* Footer / Account Section */}
                            <div className="bg-gray-100/50 border-t border-gray-200 py-4 px-6">
                                <UserMenuMobile onClick={() => setMobileMenuOpen(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
