
"use client";

import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function WishlistButton({ productId, variant = "default" }) {
    const { data: session } = useSession();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!session) return;
        // Check if in wishlist
        fetch(`/api/wishlist/check?productId=${productId}`)
            .then(res => res.json())
            .then(data => setIsInWishlist(data.exists));
    }, [productId, session]);

    const toggleWishlist = async () => {
        if (!session) {
            alert("Please login to add to wishlist");
            return;
        }
        setLoading(true);
        try {
            const method = isInWishlist ? 'DELETE' : 'POST';
            const res = await fetch('/api/wishlist', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            if (res.ok) {
                setIsInWishlist(!isInWishlist);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={loading}
            className={cn(
                "flex items-center justify-center transition-colors",
                variant === "default" && "h-12 w-12 border rounded-lg hover:bg-gray-50",
                variant === "icon" && "p-2 rounded-full hover:bg-gray-100",
                isInWishlist ? "text-red-500 border-red-200 bg-red-50" : "text-gray-400 border-gray-200"
            )}
        >
            <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
        </button>
    );
}
