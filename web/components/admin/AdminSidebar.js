"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard, Settings, Layers, Box, Tag, Image as ImageIcon,
    ShoppingCart, Truck, Users, Activity, FileText, Gift, Star,
    Monitor, DollarSign, ToggleLeft, BarChart, LogOut, List, TrendingUp, Mail, Ban, Calculator
} from "lucide-react";
import { signOut } from "next-auth/react";

// Nav items optionally have a featureKey bounding them to toggles
const NAV_ITEMS = [
    { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { title: "Pre-Orders", href: "/admin/pre-orders", icon: ShoppingCart },
    { title: "Abandoned Carts", href: "/admin/abandoned-carts", icon: ShoppingCart },
    { title: "Products", href: "/admin/products", icon: Box },
    { title: "Categories", href: "/admin/categories", icon: Layers },
    { title: "Sub Groups", href: "/admin/subcategory-groups", icon: Layers },
    { title: "Sub Items", href: "/admin/subcategory-items", icon: Layers },
    { title: "Users", href: "/admin/users", icon: Users },
    { title: "Affiliates", href: "/admin/affiliates", icon: TrendingUp },
    { title: "Reviews", href: "/admin/reviews", icon: Star },
    { title: "Flash Sale", href: "/admin/flash-sale", icon: Gift },
    { title: "Coupons", href: "/admin/coupons", icon: Gift },
    { title: "Homepage", href: "/admin/homepage", icon: Monitor },
    { title: "Landing Pages", href: "/admin/landing-pages", icon: FileText },
    { title: "Contact Msgs", href: "/admin/contact-messages", icon: Mail },
    { title: "Blacklist", href: "/admin/blacklist", icon: Ban },
    { title: "Settings", href: "/admin/settings", icon: Settings },
    { title: "Calculator", href: "/admin/calculator", icon: Calculator },
    { title: "Investments", href: "/admin/investments", icon: DollarSign },
    { title: "Features", href: "/admin/features", icon: ToggleLeft },

    // Experimental / Toggled Features
    { title: "Variants", href: "/admin/variants", icon: Tag, featureKey: "variants" },
    { title: "Images", href: "/admin/images", icon: ImageIcon, featureKey: "images" },
    { title: "Inventory", href: "/admin/inventory", icon: Box, featureKey: "inventory" },
    { title: "Pricing", href: "/admin/pricing", icon: DollarSign, featureKey: "pricing" },
    { title: "Timeline", href: "/admin/order-timeline", icon: Activity, featureKey: "orderTimeline" },
    { title: "Shipping", href: "/admin/shipping", icon: Truck, featureKey: "shipping" },
    { title: "Payments", href: "/admin/payments", icon: DollarSign, featureKey: "payments" },
    { title: "Banners", href: "/admin/banners", icon: Monitor, featureKey: "banners" },
    { title: "Activity", href: "/admin/activity", icon: Activity, featureKey: "activity" },
    { title: "Feed Export", href: "/admin/feed-export", icon: FileText, featureKey: "feedExport" },
    { title: "Tracking", href: "/admin/tracking", icon: BarChart, featureKey: "tracking" }
];

export default function AdminSidebar({ isOpen }) {
    const pathname = usePathname();
    const [toggles, setToggles] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchToggles = async () => {
            try {
                const res = await fetch("/api/admin/features");
                const data = await res.json();
                if (data.ok) {
                    setToggles(data.data);
                }
            } catch (error) {
                console.error("Failed to load toggles");
            } finally {
                setIsLoaded(true);
            }
        };
        fetchToggles();
    }, []);

    // Filter items based on toggles
    const visibleItems = NAV_ITEMS.filter(item => {
        if (!item.featureKey) return true; // Core feature
        if (!isLoaded) return false; // Hide toggled features until loaded to prevent flicker
        return toggles[item.featureKey] === true;
    });

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0 md:static md:h-screen flex flex-col`}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center border-b shrink-0">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Authentic Bazar
                </span>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <nav className="px-3 space-y-1">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer User Info */}
            <div className="p-4 border-t bg-gray-50 mt-auto shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        AD
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                        <p className="text-xs text-gray-500 truncate">Super Admin</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 10px;
                }
            `}</style>
        </aside>
    );
}
