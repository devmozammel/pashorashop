"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2, Lock, MapPin, Truck, Coins, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExpressCheckout({ params }) {
    const { productId } = params;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [settings, setSettings] = useState({
        shipping_fee_inside: "70",
        shipping_fee_outside: "130"
    });

    const [selections, setSelections] = useState({});

    const getOptionsMap = (product) => {
        const optionsMap = {};
        if (product && product.variants && product.variants.length > 0) {
            product.variants.forEach(v => {
                if (v.size) {
                    if (!optionsMap["Size"]) optionsMap["Size"] = new Set();
                    optionsMap["Size"].add(v.size);
                }
                if (v.color) {
                    if (!optionsMap["Color"]) optionsMap["Color"] = new Set();
                    optionsMap["Color"].add(v.color);
                }
            });
        }
        return optionsMap;
    };

    const optionsMap = getOptionsMap(product);
    const optionKeys = Object.keys(optionsMap);

    const getSelectedVariant = () => {
        if (!product || !product.variants || product.variants.length === 0) return null;
        return product.variants.find(v => {
            if (optionsMap["Size"] && v.size !== selections["Size"]) return false;
            if (optionsMap["Color"] && v.color !== selections["Color"]) return false;
            return true;
        });
    };

    const selectedVariant = getSelectedVariant();

    // Checkout Form State
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        shippingArea: "inside", // 'inside' or 'outside'
        paymentMethod: "COD"   // 'COD' or 'ONLINE'
    });

    useEffect(() => {
        // Fetch product details and site settings in parallel
        async function loadData() {
            try {
                const [productRes, settingsRes] = await Promise.all([
                    fetch(`/api/products/${productId}`),
                    fetch("/api/settings")
                ]);

                if (productRes.ok) {
                    const productData = await productRes.json();
                    setProduct(productData);
                }

                if (settingsRes.ok) {
                    const settingsData = await settingsRes.json();
                    setSettings(settingsData);
                }
            } catch (e) {
                console.error("Failed to load express checkout data:", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (optionKeys.length > 0) {
            const missing = optionKeys.filter(key => !selections[key]);
            if (missing.length > 0) {
                alert(`দয়া করে ${missing.join(", ")} সিলেক্ট করুন (Please select ${missing.join(", ")})`);
                setSubmitting(false);
                return;
            }
        }

        const basePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
        const priceAdjustment = selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0;
        const finalPrice = basePrice + priceAdjustment;
        const shippingCost = form.shippingArea === "inside"
            ? (Number(settings.shipping_fee_inside) || 70)
            : (Number(settings.shipping_fee_outside) || 130);

        // Split name into firstName and lastName as required by /api/checkout
        const nameParts = form.name.trim().split(" ");
        const firstName = nameParts[0] || "Customer";
        const lastName = nameParts.slice(1).join(" ") || " ";

        try {
            // Create Order payload compliant with /api/checkout schema
            const orderData = {
                items: [{
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
                        stock: selectedVariant.stock
                    } : null,
                    quantity: 1,
                    price: finalPrice
                }],
                customer: {
                    firstName,
                    lastName,
                    phone: form.phone,
                    address: form.address,
                    city: form.city,
                    shippingArea: form.shippingArea,
                    paymentMethod: form.paymentMethod
                },
                shippingCost,
                couponCode: null,
                affiliateCode: null
            };

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const data = await res.json();
                
                // If the payment method was ONLINE, redirect to UddoktaPay
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    router.push(`/order-success/${data.orderId}`);
                }
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to place order. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;
    if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

    const basePrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
    const priceAdjustment = selectedVariant ? (selectedVariant.priceAdjustment || 0) : 0;
    const finalPrice = basePrice + priceAdjustment;
    const shippingCost = form.shippingArea === "inside"
        ? (Number(settings.shipping_fee_inside) || 70)
        : (Number(settings.shipping_fee_outside) || 130);
    const orderTotal = finalPrice + shippingCost;

    return (
        <div className="min-h-screen bg-gray-50 py-12 font-sans">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900">Express Checkout</h1>
                    <p className="text-gray-500 mt-1">Complete your purchase in seconds</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm h-fit space-y-4">
                        <h2 className="font-bold text-lg text-gray-900 border-b pb-2">Order Summary</h2>
                        <div className="flex gap-4 pb-4 border-b">
                            <div className="relative w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border">
                                {(product.images?.[0] || product.productImages?.[0]?.url) ? (
                                    <Image src={product.images?.[0] || product.productImages[0].url} alt={product.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
                                <p className="text-gray-500 text-xs font-semibold">Qty: 1</p>
                                <p className="font-black text-red-600 text-sm">{formatCurrency(finalPrice)}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2 text-sm border-b pb-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold">{formatCurrency(finalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-semibold">{formatCurrency(shippingCost)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between font-black text-lg pt-2 text-gray-900">
                            <span>Total</span>
                            <span className="text-red-600">{formatCurrency(orderTotal)}</span>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                        <h2 className="font-bold text-lg text-gray-900 border-b pb-2 mb-4">Shipping Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {optionKeys.length > 0 && (
                                <div className="space-y-3 pb-4 border-b">
                                    <h3 className="font-bold text-sm text-gray-800">সাইজ সিলেক্ট করুন (Select Size)</h3>
                                    {optionKeys.map(key => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                                                <span>{key === "Size" ? "সাইজ" : key === "Color" ? "কালার" : key}</span>
                                                <span className="text-black font-bold">{selections[key]}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(optionsMap[key]).map(val => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => setSelections(prev => ({ ...prev, [key]: val }))}
                                                        className={`px-4 py-2.5 text-xs font-bold rounded-lg border-2 transition-all ${
                                                            selections[key] === val
                                                                ? "border-black bg-black text-white shadow-md"
                                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                                        }`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="আপনার নাম লিখুন"
                                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="১১ ডিজিটের মোবাইল নম্বর"
                                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-800">Shipping Area</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Inside Dhaka Card */}
                                    <label
                                        className={`relative flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                            form.shippingArea === "inside"
                                                ? "border-black bg-black text-white shadow-md scale-[1.02]"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="shippingArea"
                                            value="inside"
                                            checked={form.shippingArea === "inside"}
                                            onChange={() => setForm({ ...form, shippingArea: "inside" })}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${form.shippingArea === "inside" ? "bg-white/20" : "bg-gray-100"}`}>
                                            <MapPin className={`w-4 h-4 ${form.shippingArea === "inside" ? "text-white" : "text-gray-500"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold leading-tight">Inside Dhaka</p>
                                            <p className={`text-[11px] font-black mt-0.5 ${form.shippingArea === "inside" ? "text-gray-300" : "text-gray-500"}`}>
                                                ৳{Number(settings.shipping_fee_inside) || 70}
                                            </p>
                                        </div>
                                        {form.shippingArea === "inside" && (
                                            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                            </div>
                                        )}
                                    </label>

                                    {/* Outside Dhaka Card */}
                                    <label
                                        className={`relative flex items-center gap-2.5 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                            form.shippingArea === "outside"
                                                ? "border-black bg-black text-white shadow-md scale-[1.02]"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="shippingArea"
                                            value="outside"
                                            checked={form.shippingArea === "outside"}
                                            onChange={() => setForm({ ...form, shippingArea: "outside" })}
                                            className="sr-only"
                                        />
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${form.shippingArea === "outside" ? "bg-white/20" : "bg-gray-100"}`}>
                                            <Truck className={`w-4 h-4 ${form.shippingArea === "outside" ? "text-white" : "text-gray-500"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold leading-tight">Outside Dhaka</p>
                                            <p className={`text-[11px] font-black mt-0.5 ${form.shippingArea === "outside" ? "text-gray-300" : "text-gray-500"}`}>
                                                ৳{Number(settings.shipping_fee_outside) || 130}
                                            </p>
                                        </div>
                                        {form.shippingArea === "outside" && (
                                            <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <div className="w-1.5 h-1.5 bg-black rounded-full" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700">Full Address</label>
                                <textarea
                                    required
                                    placeholder="আপনার বিস্তারিত ঠিকানা লিখুন"
                                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                                    rows="2"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700">City / District</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="শহর বা জেলা"
                                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
                                    value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <label className="block text-sm font-bold mb-2 text-gray-800">Payment Method</label>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {/* Cash on Delivery */}
                                    <label
                                        className={`relative flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                            form.paymentMethod === 'COD'
                                                ? "border-black bg-black text-white shadow-md scale-[1.01]"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={form.paymentMethod === 'COD'}
                                            onChange={() => setForm({ ...form, paymentMethod: 'COD' })}
                                            className="sr-only"
                                        />
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${form.paymentMethod === 'COD' ? "bg-white/20" : "bg-gray-100"}`}>
                                            <Coins className={`w-5 h-5 ${form.paymentMethod === 'COD' ? "text-white" : "text-gray-600"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold leading-tight">Cash on Delivery</p>
                                            <p className={`text-xs mt-0.5 ${form.paymentMethod === 'COD' ? "text-gray-300" : "text-gray-500"}`}>হাতে পেয়ে টাকা পরিশোধ (৳১০০% নিরাপদ)</p>
                                        </div>
                                        {form.paymentMethod === 'COD' && (
                                            <div className="absolute top-3 right-3 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <div className="w-2 h-2 bg-black rounded-full" />
                                            </div>
                                        )}
                                    </label>

                                    {/* Online Payment */}
                                    <label
                                        className={`relative flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                            form.paymentMethod === 'ONLINE'
                                                ? "border-black bg-black text-white shadow-md scale-[1.01]"
                                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="ONLINE"
                                            checked={form.paymentMethod === 'ONLINE'}
                                            onChange={() => setForm({ ...form, paymentMethod: 'ONLINE' })}
                                            className="sr-only"
                                        />
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${form.paymentMethod === 'ONLINE' ? "bg-white/20" : "bg-gray-100"}`}>
                                            <CreditCard className={`w-5 h-5 ${form.paymentMethod === 'ONLINE' ? "text-white" : "text-gray-600"}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold leading-tight">Online Payment</p>
                                            <p className={`text-xs mt-0.5 ${form.paymentMethod === 'ONLINE' ? "text-gray-300" : "text-gray-500"}`}>bKash, Nagad, Rocket, Cards (মার্কেট সেরা ডিসকাউন্ট)</p>
                                        </div>
                                        {form.paymentMethod === 'ONLINE' && (
                                            <div className="absolute top-3 right-3 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                                <div className="w-2 h-2 bg-black rounded-full" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-black text-white h-12 rounded-xl font-black text-lg mt-6 hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <Lock className="w-4 h-4" />}
                                Place Order — {formatCurrency(orderTotal)}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
