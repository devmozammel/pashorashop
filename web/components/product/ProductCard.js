"use client";

import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, Star, Truck, Zap } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { getProductThumbnail } from "@/lib/productImages";

export default function ProductCard({ product, isFlashSale, isHot }) {
    const thumbnail = getProductThumbnail(product);
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);
    const openDrawer = useCartStore((state) => state.openDrawer);

    let displayPriceStr = "";
    let displayOriginalPriceStr = null;
    let discountPercent = 0;
    let isSale = false;

    const basePrice = product.discountPrice ?? product.salePrice ?? product.price;
    const isBaseSale = basePrice < product.price;

    if (product.variants && product.variants.length > 0) {
        const activeVariants = product.variants.filter((v) => v.isActive !== false);
        if (activeVariants.length > 0) {
            const variantPrices = activeVariants.map((v) =>
                v.salePrice !== null ? v.salePrice : (v.price !== null ? v.price : basePrice + (v.priceAdjustment || 0))
            );
            const variantOriginalPrices = activeVariants.map((v) =>
                v.price !== null ? v.price : product.price + (v.priceAdjustment || 0)
            );

            const minPrice = Math.min(...variantPrices);
            const maxPrice = Math.max(...variantPrices);
            const minOrig = Math.min(...variantOriginalPrices);

            if (minPrice === maxPrice) {
                displayPriceStr = formatPrice(minPrice);
                if (minPrice < minOrig) {
                    displayOriginalPriceStr = formatPrice(minOrig);
                    discountPercent = Math.round(((minOrig - minPrice) / minOrig) * 100);
                    isSale = true;
                }
            } else {
                displayPriceStr = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
                const hasAnyDiscount = activeVariants.some((v, idx) => variantPrices[idx] < variantOriginalPrices[idx]);
                if (hasAnyDiscount) {
                    isSale = true;
                    const discountPercentages = activeVariants
                        .map((v, idx) => {
                            const vp = variantPrices[idx];
                            const op = variantOriginalPrices[idx];
                            return op > 0 ? Math.round(((op - vp) / op) * 100) : 0;
                        })
                        .filter((pct) => pct > 0);
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

    const handleQuickAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.variants && product.variants.length > 0) {
            router.push(`/product/${product.slug}`);
            return;
        }
        addItem(product, null, 1);
        openDrawer();
    };

    const handleDirectOrder = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (product.variants && product.variants.length > 0) {
            router.push(`/product/${product.slug}`);
            return;
        }
        addItem(product, null, 1);
        router.push("/checkout");
    };

    // Realistic rating & sold count calculation from product id
    const pseudoReviews = ((product.id?.charCodeAt(0) || 5) % 30) + 12;
    const pseudoSold = ((product.id?.charCodeAt(product.id.length - 1) || 7) * 7) + 54;
    const pseudoRating = (4.3 + (((product.id?.charCodeAt(1) || 2) % 6) / 10)).toFixed(1);

    return (
        <article className="group relative bg-white rounded-xl border border-gray-200/90 hover:border-gray-300 hover:shadow-md transition-all flex flex-col h-full overflow-hidden">
            <Link href={`/product/${product.slug}`} className="flex flex-col flex-1">
                {/* ── IMAGE CONTAINER ── */}
                <div className="relative aspect-square bg-gray-50 shrink-0 overflow-hidden">
                    {thumbnail ? (
                        <SafeImage
                            src={thumbnail}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover select-none group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            No Image
                        </div>
                    )}

                    {/* Single Clean Discount Badge */}
                    {isSale && discountPercent > 0 ? (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs z-10">
                            -{discountPercent}%
                        </span>
                    ) : (isHot || isFlashSale) ? (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs z-10">
                            {isFlashSale ? "ফ্ল্যাশ সেল" : "হট ডিল"}
                        </span>
                    ) : null}
                </div>

                {/* ── CARD CONTENT ── */}
                <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                        {/* Product Title */}
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-700 transition-colors leading-snug">
                            {product.name}
                        </h3>

                        {/* Rating & Sold count */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                            <div className="flex items-center text-amber-500">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="ml-1 font-semibold text-gray-700">{pseudoRating}</span>
                            </div>
                            <span className="text-gray-300">·</span>
                            <span className="truncate">{pseudoSold} বিক্রি</span>
                        </div>
                    </div>

                    {/* Price Block */}
                    <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-base sm:text-lg font-bold text-gray-900 tabular-nums">
                            {displayPriceStr}
                        </span>
                        {isSale && displayOriginalPriceStr && (
                            <span className="text-xs text-gray-400 line-through tabular-nums">
                                {displayOriginalPriceStr}
                            </span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Clean Action Buttons */}
            <div className="px-3 pb-3 pt-0 grid grid-cols-2 gap-2">
                <button
                    onClick={handleQuickAdd}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-gray-200 hover:border-emerald-600 hover:text-emerald-700 text-gray-700 text-xs font-semibold transition-colors bg-white hover:bg-emerald-50/50"
                    title="কার্টে যোগ করুন"
                >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    কার্ট
                </button>
                <button
                    onClick={handleDirectOrder}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    title="সরাসরি অর্ডার করুন"
                >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    অর্ডার
                </button>
            </div>
        </article>
    );
}
