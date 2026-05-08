"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils"; // Updated import to use new formatPrice
import { useState } from "react";
import { Eye } from "lucide-react";
import QuickViewModal from "./QuickViewModal";
import { getProductThumbnail } from "@/lib/productImages";
import ProductCard from "@/components/product/ProductCard";

export default function ProductGrid({ products }) {
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">No products found.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            <QuickViewModal
                product={quickViewProduct}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
            />
        </>
    );
}
