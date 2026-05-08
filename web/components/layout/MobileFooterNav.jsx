"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Search, User, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";

const NAV_ITEMS = [
    { title: "home", icon: Home, href: "/" },
    { title: "shop", icon: Search, href: "/shop" },
    { title: "cart", icon: ShoppingBag, href: "/cart", badge: 0 },
    { title: "wishlist", icon: Heart, href: "/wishlist" },
    { title: "account", icon: User, href: "/my-orders" },
];

export default function MobileFooterNav() {
    const pathname = usePathname();
    const { t } = useLocale();

    return (
        <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
        >
            <div className="mx-4 mb-4 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.06)] flex items-center justify-around px-2 py-3">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link 
                            key={item.href} 
                            href={item.href}
                            className="relative flex flex-col items-center justify-center p-2 group"
                        >
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                className={cn(
                                    "p-2 rounded-2xl transition-all duration-300",
                                    isActive ? "bg-black text-white shadow-lg shadow-black/20" : "text-gray-400 group-hover:bg-gray-100 group-hover:text-black"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {item.badge > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-white">
                                        {item.badge}
                                    </span>
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-tighter mt-1 transition-opacity",
                                isActive ? "opacity-100 text-black" : "opacity-0"
                            )}>
                                {t(item.title)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </motion.div>
    );
}
