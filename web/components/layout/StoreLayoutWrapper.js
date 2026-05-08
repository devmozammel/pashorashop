
"use client";

import { usePathname } from "next/navigation";
import CartDrawer from "@/components/storefront/CartDrawer";
import MobileNav from "@/components/storefront/MobileNav";
import MobileBottomNav from "@/components/storefront/MobileBottomNav";

export default function StoreLayoutWrapper({ children }) {
    const pathname = usePathname();
    // Exclude CartDrawer and MobileNav on Landing Pages and Admin Panel (optional)
    const isLandingPage = pathname?.startsWith('/lp/');
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <>
            {children}
            {/* We might still want CartDrawer in Admin? Probably not. */}
            {!isLandingPage && !isAdmin && <CartDrawer />}
            {!isLandingPage && <MobileNav />}
            {!isLandingPage && !isAdmin && <MobileBottomNav />}
        </>
    );
}
