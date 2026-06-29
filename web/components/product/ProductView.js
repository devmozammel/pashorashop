"use client";

import { useState, useEffect } from "react";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductDetails from "@/components/product/ProductDetails";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    const [selections, setSelections] = useState(() => {
        const initialSelections = {};
        if (product.variants && product.variants.length > 0) {
            const firstVariant = product.variants.find(v => v.isActive !== false);
            if (firstVariant) {
                if (firstVariant.size) initialSelections["Size"] = firstVariant.size;
                if (firstVariant.color) initialSelections["Color"] = firstVariant.color;
            }
        }
        return initialSelections;
    });

    // WhatsApp Direct Order State
    const [whatsappNumber, setWhatsappNumber] = useState("8801613134043");
    const [showWaModal, setShowWaModal] = useState(false);
    const [waName, setWaName] = useState("");
    const [waPhone, setWaPhone] = useState("");
    const [waAddress, setWaAddress] = useState("");
    const [waArea, setWaArea] = useState("inside");
    const [waLoading, setWaLoading] = useState(false);
    const [settings, setSettings] = useState({ shipping_fee_inside: "70", shipping_fee_outside: "130" });

    useEffect(() => {
        if (product.variants && product.variants.length > 0) {
            const firstVariant = product.variants.find(v => v.isActive !== false);
            if (firstVariant) {
                const initialSelections = {};
                if (firstVariant.size) initialSelections["Size"] = firstVariant.size;
                if (firstVariant.color) initialSelections["Color"] = firstVariant.color;
                setSelections(initialSelections);
            }
        } else {
            setSelections({});
        }
    }, [product.id]);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.shipping_fee_inside || data.shipping_fee_outside) {
                    setSettings(prev => ({ ...prev, ...data }));
                }
                if (data.store_settings) {
                    try {
                        const s = JSON.parse(data.store_settings);
                        if (s.whatsapp) {
                            let cleanNum = s.whatsapp.replace(/\D/g, "");
                            if (cleanNum.startsWith("01")) {
                                cleanNum = "88" + cleanNum;
                            }
                            setWhatsappNumber(cleanNum);
                        }
                    } catch (_) {}
                }
            })
            .catch(err => console.error("Failed to load settings", err));
    }, []);

    const handleWhatsAppOrderInit = () => {
        const missing = optionKeys.filter(key => !selections[key]);
        if (missing.length > 0) {
            alert(`Please select ${missing.join(", ")}`);
            return;
        }

        const stockToCheck = selectedVariant ? selectedVariant.stock : product.stock;
        if (stockToCheck < 1) {
            alert("This item is currently out of stock");
            return;
        }

        setShowWaModal(true);
    };

    const handleWhatsAppOrderSubmit = async (e) => {
        e.preventDefault();
        if (!waName.trim() || !waPhone.trim() || !waAddress.trim()) {
            alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন");
            return;
        }

        let cleanPhone = waPhone.replace(/\D/g, "");
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith("01")) {
            alert("সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)");
            return;
        }

        setWaLoading(true);

        try {
            const nameParts = waName.trim().split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || ".";

            const shippingCost = waArea === "inside" 
                ? Number(settings.shipping_fee_inside || "70") 
                : Number(settings.shipping_fee_outside || "130");

            const hasVariantPrices = selectedVariant && (selectedVariant.price !== null || selectedVariant.salePrice !== null);
            const finalPrice = hasVariantPrices
                ? (selectedVariant.salePrice !== null ? selectedVariant.salePrice : selectedVariant.price)
                : (product.salePrice ?? product.price) + (selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0);

            const checkoutPayload = {
                items: [
                    {
                        product: {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            salePrice: product.salePrice
                        },
                        variant: selectedVariant ? {
                            id: selectedVariant.id,
                            size: selectedVariant.size,
                            color: selectedVariant.color,
                            priceAdjustment: selectedVariant.priceAdjustment,
                            price: selectedVariant.price,
                            salePrice: selectedVariant.salePrice,
                            stock: selectedVariant.stock
                        } : null,
                        quantity: 1
                    }
                ],
                customer: {
                    firstName,
                    lastName,
                    phone: cleanPhone,
                    address: waAddress,
                    city: waArea === "inside" ? "Dhaka" : "Outside Dhaka",
                    shippingArea: waArea,
                    paymentMethod: "COD"
                },
                shippingCost,
                couponCode: null,
                affiliateCode: null
            };

            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutPayload)
            });

            const data = await res.json();

            if (data.success && data.orderId) {
                toast.success("অর্ডারটি সফলভাবে প্লেস হয়েছে! আপনাকে হোয়াটসঅ্যাপে রিডাইরেক্ট করা হচ্ছে...");

                const variantStr = selectedVariant 
                    ? `Size: ${selectedVariant.size || ''} ${selectedVariant.color ? `, Color: ${selectedVariant.color}` : ''}`.trim() 
                    : "";

                const waMessage = `*হোয়াটসঅ্যাপ ডিরেক্ট অর্ডার (authenticbazar.shop)*\n` +
                    `---------------------------------------------\n` +
                    `অর্ডার নম্বর: ${data.orderNumber || 'N/A'}\n` +
                    `প্রোডাক্ট: ${product.name}\n` +
                    (variantStr ? `${variantStr}\n` : '') +
                    `পরিমাণ: 1 টি\n` +
                    `মোট মূল্য: ৳${finalPrice + shippingCost} (ডেলিভারি চার্জ সহ)\n\n` +
                    `*গ্রাহকের তথ্য:*\n` +
                    `নাম: ${waName}\n` +
                    `মোবাইল: ${cleanPhone}\n` +
                    `ঠিকানা: ${waAddress}\n` +
                    `এরিয়া: ${waArea === "inside" ? "inside Dhaka" : "outside Dhaka"}\n` +
                    `---------------------------------------------\n` +
                    `অনুগ্রহ করে আমার অর্ডারটি কনফার্ম করুন। ধন্যবাদ!`;

                const waUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(waMessage)}`;
                
                window.location.href = waUrl;
                setShowWaModal(false);
            } else {
                alert(data.error || "অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
            }
        } catch (error) {
            console.error(error);
            alert("অর্ডার প্লেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            setWaLoading(false);
        }
    };

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-16 md:mb-0 pb-28 md:pb-0 items-start">
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
                    onWhatsAppOrderInit={handleWhatsAppOrderInit}
                />
            </div>

            {/* Mobile Sticky Actions */}
            <div className="fixed bottom-[72px] left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t z-[60] md:hidden flex items-center gap-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                <div className="flex flex-col min-w-[25%]">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Price</span>
                    <span className="font-bold text-base text-black">
                        {(() => {
                            const hasVariantPrices = selectedVariant && (selectedVariant.price !== null || selectedVariant.salePrice !== null);
                            const finalPrice = hasVariantPrices
                                ? (selectedVariant.salePrice !== null ? selectedVariant.salePrice : selectedVariant.price)
                                : (product.salePrice ?? product.price) + (selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0);
                            return require("@/lib/utils").formatPrice(finalPrice);
                        })()}
                    </span>
                </div>

                <div className="flex gap-2 flex-1">
                    <button
                        onClick={handleWhatsAppOrderInit}
                        className="flex-1 bg-emerald-600 text-white h-12 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md"
                    >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                        </svg>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => {
                            const { addItem } = require("@/lib/store/cart").useCartStore.getState();
                            if (product.variants && product.variants.length > 0 && !selectedVariant) {
                                toast.info("প্রথমে Size/Color সিলেক্ট করুন");
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                return;
                            }
                            addItem(product, selectedVariant, 1);
                            router.push("/checkout");
                        }}
                        className="flex-1 bg-black text-white h-12 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg flex items-center justify-center"
                    >
                        Buy Now
                    </button>
                </div>
            </div>

            {/* WhatsApp Quick Order Modal */}
            {showWaModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all p-6 space-y-6">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                                </svg>
                                সরাসরি হোয়াটসঅ্যাপে অর্ডার
                            </h3>
                            <button 
                                onClick={() => setShowWaModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleWhatsAppOrderSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">আপনার নাম (Full Name)</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="যেমন: তানজিম আহমেদ"
                                    value={waName}
                                    onChange={(e) => setWaName(e.target.value)}
                                    className="w-full text-sm p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">মোবাইল নম্বর (Phone Number)</label>
                                <input
                                    type="tel"
                                    required
                                    pattern="01[3-9][0-9]{8}"
                                    placeholder="যেমন: 017XXXXXXXX"
                                    value={waPhone}
                                    onChange={(e) => setWaPhone(e.target.value)}
                                    className="w-full text-sm p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">ডেলিভারি ঠিকানা (Full Address)</label>
                                <textarea
                                    required
                                    rows="2"
                                    placeholder="যেমন: গ্রাম, ডাকঘর, থানা, জেলা"
                                    value={waAddress}
                                    onChange={(e) => setWaAddress(e.target.value)}
                                    className="w-full text-sm p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">ডেলিভারি এলাকা (Delivery Area)</label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setWaArea("inside")}
                                        className={`flex items-center justify-between p-3 border rounded-xl transition ${
                                            waArea === "inside" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200"
                                        }`}
                                    >
                                        <span className="text-sm font-semibold">Inside Dhaka</span>
                                        <span className="text-xs text-emerald-700 font-bold">৳{settings.shipping_fee_inside || "70"}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setWaArea("outside")}
                                        className={`flex items-center justify-between p-3 border rounded-xl transition ${
                                            waArea === "outside" ? "border-emerald-600 bg-emerald-50/50" : "border-gray-200"
                                        }`}
                                    >
                                        <span className="text-sm font-semibold">Outside Dhaka</span>
                                        <span className="text-xs text-emerald-700 font-bold">৳{settings.shipping_fee_outside || "130"}</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={waLoading}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                            >
                                {waLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> প্রসেস হচ্ছে...
                                    </>
                                ) : (
                                    <>
                                        কনফার্ম করুন ও হোয়াটসঅ্যাপে পাঠান
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
