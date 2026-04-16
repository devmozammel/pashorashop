"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Package, Heart, MapPin, Shield, LogOut, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        }
    }, [status, router]);

    const user = session?.user;

    if (status === "loading") {
        return <div className="p-10 text-center">Loading...</div>;
    }

    if (!user) return null;

    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };


    const menuItems = [
        { title: "My Orders", icon: Package, href: "/my-orders", color: "bg-blue-100 text-blue-600" },
        { title: "Wishlist", icon: Heart, href: "/wishlist", color: "bg-pink-100 text-pink-600" },
        { title: "Profile", icon: User, href: "/account/profile", color: "bg-purple-100 text-purple-600" },
        { title: "Addresses", icon: MapPin, href: "/account/addresses", color: "bg-green-100 text-green-600" },
        { title: "Security", icon: Shield, href: "/account/security", color: "bg-orange-100 text-orange-600" },
        { title: "Affiliate", icon: TrendingUp, href: "/account/affiliate", color: "bg-teal-100 text-teal-600" },
    ];

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">My Account</h1>

            <div className="grid gap-8 md:grid-cols-[300px_1fr]">
                {/* User Summary Card */}
                <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold mb-4">
                            {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <h2 className="text-xl font-bold">{user.name || "User"}</h2>
                        <p className="text-muted-foreground text-sm mb-6">{user.email || "No email"}</p>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-red-600 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <span className="font-medium text-gray-700 group-hover:text-primary transition-colors">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
