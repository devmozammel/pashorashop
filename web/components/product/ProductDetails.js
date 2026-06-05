"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Heart, Share2, Minus, Plus, Truck, ShieldCheck, RotateCcw, Award, CheckCircle2 } from "lucide-react";
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
    optionKeys: propOptionKeys
}) {
    const addItem = useCartStore(state => state.addItem);
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
    const basePrice = product.salePrice ?? product.price; // Use null coalescence for 0 check if needed, but ?? checks null/undefined
    const priceAdjustment = selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0;
    const finalPrice = basePrice + priceAdjustment;

    const originalPrice = product.price + priceAdjustment;
    const isSale = basePrice < product.price;
    const discountPercentage = isSale ? Math.round(((product.price - basePrice) / product.price) * 100) : 0;

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

        // Auth Guard: Check session before proceeding to checkout
        if (!session) {
            toast.error("Please login to complete your purchase");
            router.push("/auth/login?callbackUrl=/checkout");
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
                        {product.name}
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

                {product.description ? (
                    <div
                        className="prose prose-sm md:prose-base max-w-none text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                ) : (
                    <p className="text-base text-muted-foreground leading-relaxed">
                        No description available.
                    </p>
                )}
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
            <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-border rounded-md shadow-sm">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="p-3 hover:bg-secondary transition-colors"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => q + 1)}
                            className="p-3 hover:bg-secondary transition-colors"
                            aria-label="Increase quantity"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Add to Cart (Desktop) */}
                    <Button
                        size="lg"
                        onClick={handleAddToCart}
                        className="flex-1 text-base font-bold bg-primary hover:bg-primary/90 shadow-md h-auto py-3 md:flex hidden"
                    >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                    </Button>

                    <Button
                        size="icon"
                        variant="outline"
                        className={cn(
                            "h-auto w-12 border-border hover:bg-secondary md:flex hidden",
                            isInWishlist && "text-red-500 hover:text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                        )}
                        onClick={toggleWishlist}
                        disabled={isWishlistLoading}
                    >
                        <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
                    </Button>
                </div>

                {/* Buy Now - No Link wrapper, onClick push router */}
                <Button
                    size="lg"
                    variant="secondary"
                    className="w-full text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-sm h-12"
                    onClick={handleBuyNow}
                >
                    {product.isPreOrder ? "Pre-Order Now" : "Buy Now"}
                </Button>
            </div>

            <div className="border-t border-border mt-4 pt-6 text-sm text-muted-foreground flex justify-between items-center">
                <span>SKU: <span className="font-mono text-foreground">{selectedVariant?.sku || product.sku || 'N/A'}</span></span>
                <button onClick={handleShare} className="md:hidden flex items-center gap-1 hover:text-foreground">
                    <Share2 className="w-4 h-4" /> Share
                </button>
            </div>

            {/* Premium Trust & Info Blocks */}
            <div className="mt-4 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-green-100 text-green-700 rounded-xl shrink-0">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Fast & Reliable Delivery</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Inside Dhaka: 2-3 days (70 BDT). Outside Dhaka: 3-5 days (130 BDT).</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">100% Authentic Quality</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">We guarantee the authenticity and quality of every product.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Fabric & Care</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">Premium material blend. Machine wash cold, tumble dry low.</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
