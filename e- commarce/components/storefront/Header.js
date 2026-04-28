"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, Heart, MapPin, ChevronDown, Package } from "lucide-react";
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

    const [categories, setCategories] = useState([]);
    const [expandedCat, setExpandedCat] = useState(null);

    const items = useCartStore(state => state.items);
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

    const toggleExpand = (slug) => setExpandedCat(prev => prev === slug ? null : slug);
    const cartCount = mounted ? items.length : 0;
    const isSticky = settings?.enable_sticky_header !== "false";

    return (
        <>
            <header
                className={cn(
                    "w-full z-[40] transition-all duration-300",
                    isSticky ? "sticky top-0" : "relative",
                    isScrolled
                        ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border-b border-gray-100"
                        : "bg-white border-b border-gray-100"
                )}
            >
                {/* Main header row */}
                <div className={cn(
                    "container mx-auto px-4 flex items-center justify-between transition-all duration-300",
                    isScrolled ? "h-14" : "h-16 md:h-[68px]"
                )}>
                    {/* Mobile: Hamburger */}
                    <button
                        className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open Menu"
                    >
                        <Menu className="w-5 h-5 text-gray-700" />
                    </button>

                    {/* Logo */}
                    <div className="flex-1 flex justify-center md:flex-none md:justify-start md:mr-10">
                        <Link href="/">
                            <Logo />
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:block flex-1">
                        <CategoryNav />
                    </div>

                    {/* Right icons */}
                    <div className="flex items-center gap-0.5 md:gap-1">
                        {/* Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-black"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Notifications — desktop only */}
                        <div className="hidden md:block">
                            <NotificationDropdown />
                        </div>

                        {/* Wishlist */}
                        <Link
                            href="/wishlist"
                            className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-black relative"
                            aria-label="Wishlist"
                        >
                            <Heart className="w-5 h-5" />
                        </Link>

                        {/* User Menu — desktop only */}
                        <div className="hidden md:block">
                            <UserMenu />
                        </div>

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-black group"
                            aria-label="Cart"
                        >
                            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                            {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">
                                    {cartCount > 9 ? "9+" : cartCount}
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
                            className="relative w-[300px] bg-white h-full shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-black">
                                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                                    <Logo />
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Search Bar in Drawer */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <button
                                    onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>Search products...</span>
                                </button>
                            </div>

                            {/* Drawer Body */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <nav className="flex flex-col">
                                    <Link
                                        href="/"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-5 py-3.5 font-bold text-sm text-gray-900 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    >
                                        Home
                                    </Link>

                                    {categories.length === 0 && (
                                        <div className="px-5 py-6 space-y-3">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                                            ))}
                                        </div>
                                    )}

                                    {categories.map((cat) => {
                                        const hasSubs = cat.subcategoryGroups?.length > 0;
                                        const isExpanded = expandedCat === cat.slug;

                                        return (
                                            <div key={cat.id} className="border-b border-gray-50">
                                                <div className="flex items-center justify-between px-5 py-3.5">
                                                    <Link
                                                        href={`/category/${cat.slug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="font-semibold text-sm text-gray-800 flex-1"
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                    {hasSubs && (
                                                        <button
                                                            onClick={() => toggleExpand(cat.slug)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                                        >
                                                            <ChevronDown className={cn(
                                                                "w-4 h-4 text-gray-400 transition-transform duration-200",
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
                                                            transition={{ duration: 0.2 }}
                                                            className="overflow-hidden bg-gray-50"
                                                        >
                                                            <div className="px-6 pb-4 pt-2 space-y-3">
                                                                {cat.subcategoryGroups.map(group => (
                                                                    <div key={group.id} className="space-y-2">
                                                                        <Link
                                                                            href={`/category/${cat.slug}/${group.slug}`}
                                                                            onClick={() => setMobileMenuOpen(false)}
                                                                            className="block text-xs font-bold text-gray-700 uppercase tracking-wide"
                                                                        >
                                                                            {group.name}
                                                                        </Link>
                                                                        {group.items?.length > 0 && (
                                                                            <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
                                                                                {group.items.map(item => (
                                                                                    <Link
                                                                                        key={item.id}
                                                                                        href={`/category/${cat.slug}/${group.slug}/${item.slug}`}
                                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                                        className="block text-xs text-gray-500 hover:text-black transition-colors py-0.5"
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
                                <div className="mt-4 mx-4 p-4 bg-gray-50 rounded-2xl space-y-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Links</p>
                                    {[
                                        { href: "/track", label: "Track My Order", icon: Package },
                                        { href: "/pre-order", label: "Pre-Order & Sourcing", icon: ShoppingBag },
                                        { href: "/wishlist", label: "My Wishlist", icon: Heart },
                                        { href: "/my-orders", label: "My Orders", icon: Package },
                                    ].map(({ href, label, icon: Icon }) => (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-2.5 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                                        >
                                            <Icon className="w-4 h-4 text-gray-400" />
                                            {label}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Footer: Account */}
                            <div className="border-t border-gray-100 py-4 px-5 bg-gray-50/50">
                                <UserMenuMobile onClick={() => setMobileMenuOpen(false)} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
