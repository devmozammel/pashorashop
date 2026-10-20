"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, getProductDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Heart, Share2, Minus, Plus, Truck, ShieldCheck, RotateCcw, Award, CheckCircle2, Zap } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function ProductDetails({
    product,
    selections: propSelections,
    setSelections: propSetSelections,
    selectedVariant: propSelectedVariant,
    optionsMap: propOptionsMap,
    optionKeys: propOptionKeys,
    onWhatsAppOrderInit
}) {
    const addItem = useCartStore(state => state.addItem);
    const openDrawer = useCartStore(state => state.openDrawer);
    const [quantity, setQuantity] = useState(1);
    const router = useRouter();
    const { data: session } = useSession();
    const [affiliateCode, setAffiliateCode] = useState(null);

    useEffect(() => {
        if (session) {
            fetch("/api/user/affiliate")
                .then(res => res.json())
                .then(data => {
                    if (data.enrolled && data.profile) {
                        setAffiliateCode(data.profile.code);
                    }
                })
                .catch(err => console.error(err));
        }
    }, [session]);

    const handleShare = async () => {
        try {
            const baseUrl = window.location.origin;
            const productUrl = `${baseUrl}/product/${product.slug}`;
            const shareUrl = affiliateCode ? `${productUrl}?ref=${affiliateCode}` : productUrl;
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied to clipboard!");
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    // Use Props if provided (ProductView context), otherwise local state (Legacy support)
    const [localSelections, setLocalSelections] = useState({});

    // Internal Logic (if props not passed)
    // We'll re-run logic if props missing, but ideally they are passed.
    const isControlled = !!propSelections;

    // Derived state
    let selections = isControlled ? propSelections : localSelections;
    let setSelections = isControlled ? propSetSelections : setLocalSelections;

    // Logic for Options Map (if not passed)
    const getLocalOptionsMap = () => {
        // ... (copy of logic) - simplified to avoid duplication, assume passed or re-calc
        // For brevity in this tool call, I'll rely on props or recalculate if needed.
        const map = {};
        if (product.variants) {
            product.variants.forEach(v => {
                if (v.size) { if (!map["Size"]) map["Size"] = new Set(); map["Size"].add(v.size); }
                if (v.color) { if (!map["Color"]) map["Color"] = new Set(); map["Color"].add(v.color); }
            });
        }
        return map;
    };

    const optionsMap = propOptionsMap || getLocalOptionsMap();
    const optionKeys = propOptionKeys || Object.keys(optionsMap);

    // Logic for SelectedVariant (if not passed)
    const getLocalSelectedVariant = () => {
        if (!product.variants) return null;
        return product.variants.find(v => {
            if (optionsMap["Size"] && v.size !== selections["Size"]) return false;
            if (optionsMap["Color"] && v.color !== selections["Color"]) return false;
            return true;
        });
    };

    const selectedVariant = propSelectedVariant !== undefined ? propSelectedVariant : getLocalSelectedVariant();

    // Wishlist State
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isWishlistLoading, setIsWishlistLoading] = useState(true);

    // Check initial wishlist status
    useEffect(() => {
        const checkWishlist = async () => {
            try {
                const res = await fetch(`/api/wishlist/check?productId=${product.id}`);

                // Handle 401 specifically if needed (though API returns 200 for guest)
                if (res.status === 401) {
                    setIsInWishlist(false);
                    return;
                }

                if (!res.ok) {
                    setIsInWishlist(false);
                    return;
                }

                // Safe parsing
                try {
                    const data = await res.json();
                    setIsInWishlist(!!data.exists);
                } catch (parseError) {
                    // Response was not JSON (likely HTML error page)
                    setIsInWishlist(false);
                }
            } catch (error) {
                console.error("Failed to check wishlist status:", error);
                setIsInWishlist(false);
            } finally {
                setIsWishlistLoading(false);
            }
        };

        if (product?.id) {
            checkWishlist();
        } else {
            setIsWishlistLoading(false);
        }
    }, [product.id]);

    const toggleWishlist = async () => {
        // Optimistic update
        const previousState = isInWishlist;
        setIsInWishlist(!previousState);

        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id }),
            });

            if (res.status === 401) {
                setIsInWishlist(previousState);
                router.push("/auth/login");
                return;
            }

            if (!res.ok) {
                throw new Error("Failed to toggle wishlist");
            }

            const text = await res.text();
            if (!text) return;
            const data = JSON.parse(text);
            if (data.added) setIsInWishlist(true);
            if (data.removed) setIsInWishlist(false);

        } catch (error) {
            console.error("Error toggling wishlist:", error);
            setIsInWishlist(previousState);
        }
    };

    // Variant Logic moved/handled above.

    // Handle Selection
    const handleSelect = (key, value) => {
        setSelections(prev => ({ ...prev, [key]: value }));
    };

    // handleSelect and getSelectedVariant logic handled via props/derived.

    // Price Logic (Int)
    const hasVariantPrices = selectedVariant && (selectedVariant.price !== null || selectedVariant.salePrice !== null);
    
    const finalPrice = hasVariantPrices
        ? (selectedVariant.salePrice !== null ? selectedVariant.salePrice : selectedVariant.price)
        : (product.salePrice ?? product.price) + (selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0);

    const originalPrice = hasVariantPrices
        ? (selectedVariant.price !== null ? selectedVariant.price : finalPrice)
        : product.price + (selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0);

    let isSale = finalPrice < originalPrice;
    let discountPercentage = 0;

    if (selectedVariant) {
        discountPercentage = isSale ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
    } else {
        const baseDiscount = isSale ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;
        const activeVariants = product.variants?.filter(v => v.isActive !== false) || [];
        if (activeVariants.length > 0) {
            const variantDiscounts = activeVariants.map(v => {
                const vp = v.salePrice !== null ? v.salePrice : (v.price !== null ? v.price : (product.salePrice ?? product.price) + (v.priceAdjustment || 0));
                const op = v.price !== null ? v.price : product.price + (v.priceAdjustment || 0);
                return op > 0 && vp < op ? Math.round(((op - vp) / op) * 100) : 0;
            });
            discountPercentage = Math.max(baseDiscount, ...variantDiscounts);
            if (discountPercentage > 0) {
                isSale = true;
            }
        } else {
            discountPercentage = baseDiscount;
        }
    }

    const handleAddToCart = () => {
        // Validate selections
        const missing = optionKeys.filter(key => !selections[key]);
        if (missing.length > 0) {
            alert(`Please select ${missing.join(", ")}`);
            return;
        }

        // Validate stock
        const stockToCheck = selectedVariant ? selectedVariant.stock : product.stock;
        if (stockToCheck < quantity) {
            alert("Requested quantity exceeds available stock");
            return;
        }

        addItem(product, selectedVariant, quantity);
        openDrawer();
    };

    const handleBuyNow = () => {
        // Validate selections
        const missing = optionKeys.filter(key => !selections[key]);
        if (missing.length > 0) {
            alert(`Please select ${missing.join(", ")}`);
            return;
        }

        // Validate stock
        const stockToCheck = selectedVariant ? selectedVariant.stock : product.stock;
        if (stockToCheck < quantity) {
            alert("Requested quantity exceeds available stock");
            return;
        }

        addItem(product, selectedVariant, quantity);
        router.push("/checkout");
    };

    return (
        <div className="flex flex-col gap-8">
            {/* Header Section */}
            <div>
                <div className="flex justify-between items-start">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4 leading-tight">
                        {getProductDisplayName(product.name, selectedVariant, product.variants)}
                    </h1>
                    {/* Share Button (Desktop) */}
                    <button onClick={handleShare} className="hidden md:flex p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {product.isPreOrder && (
                    <div className="mb-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                <Zap className="w-4 h-4 fill-current" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-orange-900">Pre-Order Item</span>
                                {product.expectedDeliveryText && (
                                    <span className="text-[11px] text-orange-700 font-medium">{product.expectedDeliveryText}</span>
                                )}
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-400 bg-gray-50/50 rounded-lg px-3 py-1.5 border border-gray-100 italic">
                            ৳100 advance payment required. Fully refundable if order cancelled.
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-baseline gap-3">
                        <span className="text-2xl md:text-3xl font-bold text-foreground">
                            {formatPrice(finalPrice)}
                        </span>
                        {isSale && (
                            <div className="flex items-center gap-2">
                                <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                                    {formatPrice(originalPrice)}
                                </span>
                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                    -{discountPercentage}%
                                </span>
                            </div>
                        )}
                    </div>
                    {((selectedVariant ? selectedVariant.stock : product.stock) > 0) ? (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                            In Stock
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                            Out of Stock
                        </span>
                    )}
                </div>

                {/* Description removed from sidebar to be rendered below the main grid */}
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Variants */}
            {optionKeys.length > 0 && (
                <div className="space-y-6">
                    {optionKeys.map(key => (
                        <div key={key} className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-foreground">{key}</span>
                                <span className="text-muted-foreground font-medium">{selections[key]}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(optionsMap[key]).map(val => (
                                    <button
                                        key={val}
                                        onClick={() => handleSelect(key, val)}
                                        className={cn(
                                            "min-w-[4rem] px-5 py-3 text-sm font-bold rounded-lg border-2 transition-all",
                                            selections[key] === val
                                                ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                                                : "border-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
                {/* Quantity + Add to Cart Row */}
                <div className="flex gap-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="p-3 hover:bg-gray-100 transition-colors rounded-l-xl text-gray-700"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-bold text-base text-gray-900">{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => q + 1)}
                            className="p-3 hover:bg-gray-100 transition-colors rounded-r-xl text-gray-700"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart */}
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={handleAddToCart}
                        className="flex-1 text-sm md:text-base font-bold border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl h-12 flex items-center justify-center gap-2"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        কার্টে যোগ করুন
                    </Button>

                    {/* Wishlist */}
                    <Button
                        size="icon"
                        variant="outline"
                        className={cn(
                            "h-12 w-12 border-gray-200 rounded-xl hover:bg-gray-50 shrink-0",
                            isInWishlist && "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
                        )}
                        onClick={toggleWishlist}
                        disabled={isWishlistLoading}
                    >
                        <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
                    </Button>
                </div>

                {/* Primary Buy Now / অর্ডার করুন Button */}
                <Button
                    size="lg"
                    className="w-full text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg rounded-xl h-12 transition-all flex items-center justify-center gap-2"
                    onClick={handleBuyNow}
                >
                    <CheckCircle2 className="w-5 h-5" />
                    {product.isPreOrder ? "প্রি-অর্ডার করুন" : "অর্ডার করুন (ক্যাশ অন ডেলিভারি)"}
                </Button>

                {/* WhatsApp Order Button */}
                {((selectedVariant ? selectedVariant.stock : product.stock) > 0) && (
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full text-sm font-semibold border-emerald-200 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80 rounded-xl h-11 flex items-center justify-center gap-2 transition-colors"
                        onClick={onWhatsAppOrderInit}
                    >
                        <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        হোয়াটসঅ্যাপে সরাসরি অর্ডার
                    </Button>
                )}
            </div>

            <div className="border-t border-gray-150 pt-4 text-xs text-gray-500 flex justify-between items-center">
                <span>প্রোডাক্ট কোড (SKU): <span className="font-mono text-gray-900 font-semibold">{selectedVariant?.sku || product.sku || product.id.slice(-8)}</span></span>
                <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-gray-900 font-medium">
                    <Share2 className="w-3.5 h-3.5" /> শেয়ার করুন
                </button>
            </div>

            {/* 4 Trust & Guarantee Highlights (Shobkichu Style) */}
            <div className="rounded-xl border border-gray-200/90 bg-gray-50/60 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                            <Truck className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-900 text-xs">দ্রুত হোম ডেলিভারি</h5>
                            <p className="text-[11px] text-gray-500 leading-snug">ঢাকায় ২৪ ঘণ্টা, সারাদেশে ২-৩ দিন</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-900 text-xs">ক্যাশ অন ডেলিভারি</h5>
                            <p className="text-[11px] text-gray-500 leading-snug">পণ্য হাতে পেয়ে চেক করে মূল্য দিন</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-900 text-xs">১ দিনের রিটার্ন</h5>
                            <p className="text-[11px] text-gray-500 leading-snug">সহজ ও দ্রুত রিপ্লেসমেন্ট নিশ্চয়তা</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h5 className="font-bold text-gray-900 text-xs">১০০% অরিজিনাল</h5>
                            <p className="text-[11px] text-gray-500 leading-snug">অথেন্টিক ও প্রিমিয়াম কোয়ালিটি</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
