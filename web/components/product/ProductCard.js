"use client";

import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { getProductThumbnail } from "@/lib/productImages";
import { motion } from "framer-motion";

export default function ProductCard({ product, isFlashSale }) {
    const thumbnail = getProductThumbnail(product);

    let displayPriceStr = "";
    let displayOriginalPriceStr = null;
    let discountPercent = 0;
    let isSale = false;
    let hasRange = false;

    const basePrice = product.discountPrice ?? product.salePrice ?? product.price;
    const isBaseSale = basePrice < product.price;

    if (product.variants && product.variants.length > 0) {
        const activeVariants = product.variants.filter(v => v.isActive !== false);
        if (activeVariants.length > 0) {
            const variantPrices = activeVariants.map(v => basePrice + (v.priceAdjustment || 0));
            const variantOriginalPrices = activeVariants.map(v => product.price + (v.priceAdjustment || 0));

            const minPrice = Math.min(...variantPrices);
            const maxPrice = Math.max(...variantPrices);

            const minOrig = Math.min(...variantOriginalPrices);
            const maxOrig = Math.max(...variantOriginalPrices);

            if (minPrice === maxPrice) {
                displayPriceStr = formatPrice(minPrice);
                if (minPrice < minOrig) {
                    displayOriginalPriceStr = formatPrice(minOrig);
                    discountPercent = Math.round(((minOrig - minPrice) / minOrig) * 100);
                    isSale = true;
                }
            } else {
                displayPriceStr = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
                hasRange = true;
                const hasAnyDiscount = activeVariants.some(v => (basePrice + (v.priceAdjustment || 0)) < (product.price + (v.priceAdjustment || 0)));
                if (hasAnyDiscount) {
                    isSale = true;
                    const discountPercentages = activeVariants
                        .map(v => {
                            const vp = basePrice + (v.priceAdjustment || 0);
                            const op = product.price + (v.priceAdjustment || 0);
                            return op > 0 ? Math.round(((op - vp) / op) * 100) : 0;
                        })
                        .filter(pct => pct > 0);
                    if (discountPercentages.length > 0) {
                        discountPercent = Math.max(...discountPercentages);
                    }
                }
            }
        } else {
            displayPriceStr = formatPrice(basePrice);
            if (isBaseSale) {
                displayOriginalPriceStr = formatPrice(product.price);
                discountPercent = Math.round(((product.price - basePrice) / product.price) * 100);
                isSale = true;
            }
        }
    } else {
        displayPriceStr = formatPrice(basePrice);
        if (isBaseSale) {
            displayOriginalPriceStr = formatPrice(product.price);
            discountPercent = Math.round(((product.price - basePrice) / product.price) * 100);
            isSale = true;
        }
    }

    const addItem = useCartStore(state => state.addItem);
    const router = useRouter();

    const handleQuickAdd = (e) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();

        // If product has variants, redirect to details
        if (product.variants && product.variants.length > 0) {
            router.push(`/product/${product.slug}`);
            return;
        }

        // Add to cart directly
        addItem(product, null, 1);
    };

    return (
        <motion.article 
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className="group premium-card flex flex-col h-full bg-white dark:bg-card border border-transparent hover:border-black/5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] rounded-2xl overflow-hidden transition-all duration-300"
        >
            <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden bg-secondary/50">
                {thumbnail ? (
                    <SafeImage
                        src={thumbnail}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-secondary/50 text-muted-foreground">
                        <span className="text-xs font-medium uppercase tracking-wider">No Image</span>
                    </div>
                )}

                {/* Sale Badge - Percentage */}
                {isSale && discountPercent > 0 && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-tight rounded shadow-lg z-10 transition-transform group-hover:scale-110">
                        -{discountPercent}%
                    </span>
                )}

                {/* Desktop Quick Add Button Overlay */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center z-10 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex">
                     <Button
                        size="sm"
                        className="rounded-full shadow-xl bg-black/90 text-white hover:bg-black backdrop-blur-sm px-6 h-10 font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105"
                        onClick={handleQuickAdd}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Quick Add
                    </Button>
                </div>
            </Link>

            <div className="flex flex-col gap-1 p-2.5 md:p-4 flex-1 justify-between">
                <Link href={`/product/${product.slug}`}>
                    <h3 className="text-[13px] md:text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-center flex-wrap gap-1.5 mt-auto pt-2 border-t border-border/50">
                    <span className="font-bold text-sm md:text-lg">
                        {displayPriceStr}
                    </span>
                    {isSale && displayOriginalPriceStr && (
                        <>
                            <span className="text-[10px] md:text-xs text-muted-foreground line-through decoration-red-500/50">
                                {displayOriginalPriceStr}
                            </span>
                            <span className="text-[10px] font-bold text-red-600">
                                (-{discountPercent}%)
                            </span>
                        </>
                    )}
                </div>
            </div>
        </motion.article>
    );
}
