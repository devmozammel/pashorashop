
"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatCurrency } from "@/lib/utils/format";
import { X, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { getProductDisplayName } from "@/lib/utils";

export default function QuickViewModal({ product, isOpen, onClose }) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const { addItem, openDrawer } = useCartStore();

    if (!isOpen || !product) return null;

    const basePrice = Number(product.discountPrice ?? product.salePrice ?? product.price ?? 0);
    const baseOriginalPrice = Number(product.price);
    
    const hasVariantPrices = selectedVariant && (selectedVariant.price !== null || selectedVariant.salePrice !== null);
    const price = hasVariantPrices
        ? (selectedVariant.salePrice !== null ? selectedVariant.salePrice : selectedVariant.price)
        : basePrice + (selectedVariant ? Number(selectedVariant.priceAdjustment || 0) : 0);

    const originalPrice = hasVariantPrices
        ? (selectedVariant.price !== null ? selectedVariant.price : price)
        : baseOriginalPrice + (selectedVariant ? Number(selectedVariant.priceAdjustment || 0) : 0);

    const hasDiscount = price < originalPrice;

    // Handle variants if any
    const variants = product.variants || [];

    const handleAddToCart = () => {
        addItem(product, selectedVariant, 1);
        onClose();
        openDrawer();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 grid md:grid-cols-2 max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Image Side */}
                <div className="relative bg-gray-100 min-h-[300px] md:min-h-full">
                    {product.images?.[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                </div>

                {/* Info Side */}
                <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto bg-white">
                    <div className="mb-auto">
                        <h2 className="text-2xl font-bold mb-2">
                            {getProductDisplayName(product.name, selectedVariant, variants)}
                        </h2>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-2xl font-bold text-primary">{formatCurrency(price)}</span>
                            {hasDiscount && (
                                <span className="text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                            )}
                        </div>

                        {/* Simple Description Snippet */}
                        <div className="text-sm text-muted-foreground mb-6 line-clamp-3">
                            {product.description?.replace(/<[^>]*>?/gm, '') || "No description available."}
                        </div>

                        {variants.length > 0 && (
                            <div className="mb-6">
                                <label className="text-sm font-medium mb-2 block">Available Options</label>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`px-3 py-1.5 border rounded-md text-sm transition-all ${selectedVariant?.id === variant.id
                                                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                                    : "hover:border-gray-400"
                                                }`}
                                        >
                                            {variant.name}: {variant.value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                            >
                                Add to Cart
                            </button>
                        </div>

                        <Link
                            href={`/product/${product.slug}`}
                            className="block text-center mt-4 text-sm text-primary hover:underline"
                            onClick={onClose}
                        >
                            View Full Details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
