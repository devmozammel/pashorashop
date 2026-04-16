"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/store/cart";
import { Check, Truck, ShieldCheck, ArrowRight, Star } from "lucide-react";
import WishlistButton from "@/components/storefront/WishlistButton";

export default function ProductDetailsClient({ product }) {
    const { addItem } = useCartStore();
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Group variants by name (e.g., Size, Color)
    // For MVP, assuming single variant type or flat list for now based on Schema
    // Schema has: name, value. We can just list them as options.
    const hasVariants = product.variants && product.variants.length > 0;

    // Calculate dynamic price
    const basePrice = parseFloat(product.price);
    const currentPrice = selectedVariant
        ? basePrice + parseFloat(selectedVariant.priceAdjustment)
        : basePrice;

    const handleAddToCart = () => {
        if (hasVariants && !selectedVariant) {
            alert("Please select a " + product.variants[0].name);
            return;
        }
        addItem(product, selectedVariant, 1);

        // Track AddToCart
        import("@/lib/fpixel").then(fb => {
            fb.event('AddToCart', {
                content_name: product.name,
                content_ids: [product.id],
                content_type: 'product',
                value: product.salePrice || product.price,
                currency: 'BDT' // Adjust currency
            });
        });
    };

    // Track ViewContent on mount
    useEffect(() => {
        import("@/lib/fpixel").then(fb => {
            fb.event('ViewContent', {
                content_name: product.name,
                content_ids: [product.id],
                content_type: 'product',
                value: product.salePrice || product.price,
                currency: 'BDT'
            });
        });
    }, [product]);

    const discount = product.salePrice && basePrice > 0
        ? Math.round(((basePrice - parseFloat(product.salePrice)) / basePrice) * 100)
        : 0;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">

                {/* Gallery */}
                <div className="space-y-4">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border">
                        {product.images && product.images.length > 0 ? (
                            <Image
                                src={product.images[currentImageIndex]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                        )}
                        {discount > 0 && (
                            <span className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-sm font-bold rounded-full">
                                -{discount}%
                            </span>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${i === currentImageIndex ? "border-primary" : "border-transparent hover:border-muted"}`}
                                >
                                    <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <div className="mb-2 text-sm text-muted-foreground uppercase tracking-wide font-medium">
                        {product.category?.name || "Uncategorized"}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                        {product.name}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-4 mb-6">
                        <span className="text-3xl font-bold text-primary">
                            {formatCurrency(product.salePrice ? parseFloat(product.salePrice) : currentPrice)}
                        </span>
                        {product.salePrice && (
                            <span className="text-xl text-muted-foreground line-through">
                                {formatCurrency(basePrice)}
                            </span>
                        )}
                    </div>

                    {/* Variants */}
                    {hasVariants && (
                        <div className="mb-8">
                            <label className="block text-sm font-medium mb-3">
                                Select {product.variants[0].name}
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {product.variants.map((variant) => {
                                    const isSelected = selectedVariant?.id === variant.id;
                                    const isOutOfStock = variant.stock <= 0;

                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            disabled={isOutOfStock}
                                            className={`
                                                px-4 py-2 rounded-full border text-sm font-medium transition-all
                                                ${isSelected
                                                    ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                                                    : "border-input bg-background hover:bg-muted text-foreground"
                                                }
                                                ${isOutOfStock ? "opacity-50 cursor-not-allowed decoration-slice line-through" : ""}
                                            `}
                                        >
                                            {variant.value}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

// Actions
                    <div className="flex flex-col gap-4 mb-8">
                        <div className="flex gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={hasVariants && !selectedVariant}
                                className="flex-1 bg-black text-white hover:bg-gray-800 h-14 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add to Cart
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <WishlistButton productId={product.id} variant="default" />
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-b text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-primary" />
                            <span>Free Delivery over $50</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span>Secure Payment</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-8 prose prose-sm max-w-none text-muted-foreground">
                        <h3 className="text-foreground font-semibold mb-2">Description</h3>
                        <p className="whitespace-pre-line">{product.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
