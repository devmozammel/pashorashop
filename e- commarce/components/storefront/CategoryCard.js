"use client";

import Link from "next/link";
import { useState } from "react";

export default function CategoryCard({ cat }) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link href={`/shop?categoryId=${cat.id}`} className="group flex flex-col items-center gap-2">
            {/* Image circle */}
            <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 group-hover:border-black/20 group-hover:shadow-md transition-all duration-300">
                {cat.image && !imageError ? (
                    <img
                        src={cat.image}
                        alt={cat.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-2xl font-black text-gray-400 uppercase">
                            {cat.name?.charAt(0)}
                        </span>
                    </div>
                )}
            </div>
            {/* Name */}
            <span className="text-xs font-bold text-gray-700 group-hover:text-black text-center leading-tight transition-colors line-clamp-1 w-full">
                {cat.name}
            </span>
        </Link>
    );
}
