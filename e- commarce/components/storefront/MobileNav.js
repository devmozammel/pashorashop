
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Search, Heart, User, LayoutGrid } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

import { motion, AnimatePresence } from "framer-motion";

export default function MobileNav() {
    const pathname = usePathname();
    const openDrawer = useCartStore((state) => state.openDrawer);
    const items = useCartStore((state) => state.items);
    const cartCount = items.length;

    // Helper to check active state
    const isActive = (path) => pathname === path;

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/shop", label: "Shop", icon: LayoutGrid },
        { onClick: openDrawer, label: "Cart", icon: ShoppingBag, isCart: true },
        { href: "/wishlist", label: "Saved", icon: Heart },
        { href: "/account", label: "Profile", icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 w-full z-50 md:hidden">
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="bg-black/95 backdrop-blur-2xl border-t border-white/10 h-[72px] px-4 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.4)]"
            >
                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const active = item.href ? isActive(item.href) : false;

                    const Content = (
                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all duration-300",
                                active ? "text-white" : "text-gray-400"
                            )}
                        >
                            <AnimatePresence>
                                {active && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </AnimatePresence>
                            <div className="relative">
                                <Icon className={cn("w-5 h-5", active ? "fill-white" : "")} />
                                {item.isCart && cartCount > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 bg-white text-black text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg"
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
                        </motion.div>
                    );

                    if (item.href) {
                        return (
                            <Link key={idx} href={item.href}>
                                {Content}
                            </Link>
                        );
                    }

                    return (
                        <button key={idx} onClick={item.onClick}>
                            {Content}
                        </button>
                    );
                })}
            </motion.div>
        </div>
    );
}

