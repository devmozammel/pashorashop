"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function CategoryCard({ cat }) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link href={`/shop?categoryId=${cat.id}`} className="group">
            <div className="relative aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden border hover:shadow-lg transition-all">
                {cat.image && !imageError ? (
                    <img
                        src={cat.image}
                        alt={cat.name}
                        className="object-cover w-full h-full"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 group-hover:bg-gray-300 transition-colors">
                        <span className="text-lg font-semibold text-gray-700 uppercase">{cat.name}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}
