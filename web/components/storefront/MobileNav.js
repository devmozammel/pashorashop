
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, User, LayoutGrid, Search } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileNav() {
    const pathname = usePathname();
    const openDrawer = useCartStore((state) => state.openDrawer);
    const items = useCartStore((state) => state.items);
    const cartCount = items.reduce((total, item) => total + (item.quantity || 1), 0);

    const isActive = (path) => {
        if (path === "/" && pathname === "/") return true;
        if (path !== "/" && pathname?.startsWith(path)) return true;
        return false;
    };

    const toBnNum = (n) => {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        return n.toString().split("").map(d => bnDigits[d] || d).join("");
    };

    const navItems = [
        { href: "/", label: "হোম", icon: Home },
        { href: "/shop", label: "ক্যাটাগরি", icon: LayoutGrid },
        { onClick: openDrawer, label: "কার্ট", icon: ShoppingBag, isCart: true },
        { href: "/wishlist", label: "উইশলিস্ট", icon: Heart },
        { href: "/account", label: "একাউন্ট", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-50 md:hidden">
            <nav className="bg-white/95 backdrop-blur-xl border-t border-gray-200/90 h-[64px] px-2 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const active = item.href ? isActive(item.href) : false;

                    const Content = (
                        <div
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 w-14 h-14 transition-all duration-200",
                                active ? "text-brand-700 font-bold" : "text-gray-500 hover:text-gray-800"
                            )}
                        >
                            {/* Active Top Line Indicator */}
                            {active && (
                                <span className="absolute top-0 w-8 h-1 bg-brand-600 rounded-full" />
                            )}

                            <div className="relative mt-1">
                                <Icon className={cn("w-5 h-5", active ? "stroke-[2.5]" : "stroke-[1.8]")} />

                                {item.isCart && cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-black h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full shadow-md animate-scaleIn">
                                        {toBnNum(cartCount)}
                                    </span>
                                )}
                            </div>

                            <span className={cn(
                                "text-[10px] tracking-tight leading-none",
                                active ? "font-black text-brand-700" : "font-medium"
                            )}>
                                {item.label}
                            </span>
                        </div>
                    );

                    if (item.href) {
                        return (
                            <Link key={idx} href={item.href} className="focus:outline-none">
                                {Content}
                            </Link>
                        );
                    }

                    return (
                        <button key={idx} onClick={item.onClick} type="button" className="focus:outline-none">
                            {Content}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}


