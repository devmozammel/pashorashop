
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useEffect, useState } from "react";

export default function MobileBottomNav({ settings }) {
    const pathname = usePathname();
    const cartCount = useCartStore(state => state.items.length);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // If disabled via settings
    // This check should ideally be in parent, but good to handle here too
    // However, if settings not passed, assume enabled or disabled? 
    // User said "optional toggle", usually means ON by default or follows settings.

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden h-16 pb-[env(safe-area-inset-bottom)]">
            <div className="grid grid-cols-4 h-full">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Home className="w-5 h-5" />
                    Home
                </Link>

                <Link
                    href="/category/women" // Example main category or /shop
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        pathname.startsWith("/category") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Grid className="w-5 h-5" />
                    Shop
                </Link>

                <Link
                    href="/cart"
                    className={cn(
                        "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        pathname === "/cart" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        {mounted && cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    Cart
                </Link>

                <Link
                    href="/auth/signin" // Or /account if logged in, handled by middleware/page redirect
                    className={cn(
                        "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                        pathname.startsWith("/auth") || pathname.startsWith("/my-orders") ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <User className="w-5 h-5" />
                    Account
                </Link>
            </div>
        </div>
    );
}
