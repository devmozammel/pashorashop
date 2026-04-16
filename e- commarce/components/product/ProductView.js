"use client";

import { useState, useEffect } from "react";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductDetails from "@/components/product/ProductDetails";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProductView({ product }) {
    // We lift the selection state here to control images
    // detailed logic needs to be moved from ProductDetails or we pass a callback?
    // Moving logic is better for clean state.

    // Actually, ProductDetails is complex. Let's just refactor ProductDetails to render the Gallery?
    // No, layout is side-by-side. 
    // Let's make ProductView the main container.

    // 1. Re-implement selection logic (simplified here or move from ProductDetails)
    // To safe time and reduce risk, I will largely copy logic or import hooks if available.
    // But since logic is inside ProductDetails, I'll move it here.

    const { data: session } = useSession();
    const router = useRouter();
    const [selections, setSelections] = useState({});

    // Helper to get variants
    const getOptionsMap = (product) => {
        const optionsMap = {};
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(v => {
                if (v.size) {
                    if (!optionsMap["Size"]) optionsMap["Size"] = new Set();
                    optionsMap["Size"].add(v.size);
                }
                if (v.color) {
                    if (!optionsMap["Color"]) optionsMap["Color"] = new Set();
                    optionsMap["Color"].add(v.color);
                }
                if (!v.size && !v.color && v.name && v.value) {
                    if (!optionsMap[v.name]) optionsMap[v.name] = new Set();
                    optionsMap[v.name].add(v.value);
                }
            });
        }
        return optionsMap;
    };

    const optionsMap = getOptionsMap(product);
    const optionKeys = Object.keys(optionsMap);

    const getSelectedVariant = () => {
        if (!product.variants || product.variants.length === 0) return null;
        return product.variants.find(v => {
            if (optionsMap["Size"] && v.size !== selections["Size"]) return false;
            if (optionsMap["Color"] && v.color !== selections["Color"]) return false;
            for (const key of optionKeys) {
                if (key !== "Size" && key !== "Color") {
                    if (v.name === key && v.value !== selections[key]) return false;
                }
            }
            return true;
        });
    };

    const selectedVariant = getSelectedVariant();

    // Image Logic — filter empty/null URLs
    const isValidUrl = (url) => typeof url === 'string' && url.trim().length > 0;
    let currentImages = (product.displayImages || []).filter(isValidUrl);
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
        const variantImgs = selectedVariant.images.map(img => img.url).filter(isValidUrl);
        if (variantImgs.length > 0) currentImages = variantImgs;
    } else if (selectedVariant && product.productImages) {
        // Fallback: Filter productImages if they have variantId matching
        const variantImages = product.productImages
            .filter(img => img.variantId === selectedVariant.id && isValidUrl(img.url));
        if (variantImages.length > 0) {
            currentImages = variantImages.map(img => img.url);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16 items-start">
            {/* Gallery */}
            <div>
                <ProductImageGallery
                    images={currentImages}
                    name={product.name}
                />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-8">
                <ProductDetails
                    product={product}
                    selections={selections}
                    setSelections={setSelections}
                    selectedVariant={selectedVariant}
                    optionsMap={optionsMap}
                    optionKeys={optionKeys}
                />
            </div>

            {/* Mobile Sticky Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t z-40 md:hidden flex items-center gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col min-w-[30%]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Price</span>
                    <span className="font-bold text-lg text-black">
                        {require("@/lib/utils").formatPrice(selectedVariant ? (product.price + selectedVariant.priceAdjustment) : (product.salePrice || product.price))}
                    </span>
                </div>

                <div className="flex gap-2 flex-1">
                    <button
                        onClick={() => {
                            const { addItem, openDrawer } = require("@/lib/store/cart").useCartStore.getState();
                            if (product.variants && product.variants.length > 0 && !selectedVariant) {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                return;
                            }
                            addItem(product, selectedVariant, 1);
                            openDrawer();
                        }}
                        className="flex-1 bg-white border-2 border-black text-black h-12 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                        Cart
                    </button>
                    <button
                        onClick={() => {
                            const { addItem } = require("@/lib/store/cart").useCartStore.getState();
                            if (product.variants && product.variants.length > 0 && !selectedVariant) {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                return;
                            }

                            // Auth Guard: Check session before proceeding to checkout
                            if (!session) {
                                toast.error("Please login to complete your purchase");
                                router.push("/auth/login?callbackUrl=/checkout");
                                return;
                            }

                            addItem(product, selectedVariant, 1);
                            router.push("/checkout");
                        }}
                        className="flex-[2] bg-black text-white h-12 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
