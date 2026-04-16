"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { requireUserClient } from "@/lib/userSession";
import ProductCard from "@/components/product/ProductCard";
import { Heart, Loader2 } from "lucide-react";

export default function WishlistPage() {
    const { user, status } = requireUserClient();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchWishlist() {
            if (!user) return;

            // Fetch from Real User API
            try {
                const res = await fetch("/api/wishlist");
                if (res.ok) {
                    const data = await res.json();
                    setWishlistItems(data);
                } else {
                    console.error("Failed to fetch wishlist");
                }
            } catch (err) {
                console.error("Error fetching wishlist:", err);
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated") {
            fetchWishlist();
        }
    }, [user, status]);

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    return (
        <div className="container px-4 py-8 md:px-6 md:py-16 min-h-[70vh]">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                            <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                        </div>
                        My Wishlist
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Items you've saved for later</p>
                </div>

                {wishlistItems.length > 0 && (
                    <div className="bg-gray-100/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200">
                        <span className="text-sm font-bold text-gray-700">{wishlistItems.length} Products Saved</span>
                    </div>
                )}
            </div>

            {wishlistItems.length === 0 ? (
                <div className="relative group overflow-hidden bg-white border border-gray-100 rounded-[2.5rem] p-12 md:p-24 text-center shadow-2xl">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-red-50 text-red-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Heart className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
                            Your wishlist is empty
                        </h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg leading-relaxed">
                            It seems you haven't added any premium products yet. Start exploring our latest collections!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-3xl text-sm font-black uppercase tracking-widest bg-black text-white hover:bg-gray-800 h-14 px-10 shadow-xl transition-all hover:-translate-y-1 active:scale-95"
                        >
                            Browse Products
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="group relative">
                            <ProductCard product={item.product || item} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
