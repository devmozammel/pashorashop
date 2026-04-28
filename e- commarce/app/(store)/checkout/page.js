"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TrustBadges from "@/components/storefront/TrustBadges";
import { MapPin, Truck, Banknote, Smartphone, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
    const { items, getCartTotal, clearCart, updateQuantity, removeItem } = useCartStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState({ shipping_fee_inside: "60", shipping_fee_outside: "120" });
    // Zustand persist hydration guard — prevents false "empty cart" on page refresh
    const [hasHydrated, setHasHydrated] = useState(
        () => useCartStore.persist?.hasHydrated?.() ?? false
    );

    // Coupon State
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, type }
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMessage, setCouponMessage] = useState("");
    const [affiliateCode, setAffiliateCode] = useState(null);

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (data.shipping_fee_inside || data.shipping_fee_outside) {
                    setSettings(prev => ({
                        ...prev,
                        ...data
                    }));
                }
            })
            .catch(err => console.error("Failed to load settings", err));

        try {
            const refData = localStorage.getItem("affiliate_ref");
            if (refData) {
                const parsed = JSON.parse(refData);
                if (parsed.code && parsed.expires > Date.now()) {
                    setAffiliateCode(parsed.code);
                } else {
                    localStorage.removeItem("affiliate_ref");
                }
            }
        } catch (e) {
            console.error(e);
        }

        // Mark as hydrated after first render — Zustand has loaded from localStorage by now
        setHasHydrated(true);
    }, []);

    const { data: session, status: sessionStatus } = useSession();
    const isGuest = sessionStatus === "unauthenticated";

    const userData = session?.user;

    useEffect(() => {
        if (userData) {
            setFormData(prev => ({
                ...prev,
                firstName: userData.name?.split(" ")[0] || prev.firstName,
                lastName: userData.name?.split(" ").slice(1).join(" ") || prev.lastName,
                // phone: userData.phone || prev.phone, // If phone is added to user model later
            }));
        }
    }, [userData]);

    // ... existing useEffect for settings

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        paymentMethod: "COD",
        shippingArea: "inside"
    });

    // Wait for Zustand to hydrate from localStorage before checking empty cart
    if (!hasHydrated) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading your cart...</p>
            </div>
        );
    }

    if (items.length === 0 && !isRedirecting) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <Link href="/"><Button>Continue Shopping</Button></Link>
            </div>
        );
    }

    const shippingCost = formData.shippingArea === "inside"
        ? (Number(settings.shipping_fee_inside) || 60)
        : (Number(settings.shipping_fee_outside) || 120);

    // Recalculate totals
    const subtotal = getCartTotal();
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal - discount + shippingCost;

    // Pre-order logic
    const preOrderItems = items.filter(i => i.product.isPreOrder);
    const advanceAmount = preOrderItems.reduce((acc, i) => acc + (100 * i.quantity), 0);
    const requiresAdvance = advanceAmount > 0;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponMessage("");
        setError("");

        try {
            const res = await fetch("/api/coupons/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: couponCode,
                    total: subtotal // Send subtotal as 'total' param required by API
                })
            });

            const data = await res.json();

            if (res.ok && data.valid) {
                setAppliedCoupon({
                    code: data.code,
                    discountAmount: data.discountAmount,
                    type: data.type
                });
                setCouponMessage(data.message || "Coupon applied successfully!");
                toast.success("Coupon applied!");
            } else {
                setAppliedCoupon(null);
                setCouponMessage(data.message || "Invalid coupon");
                toast.error(data.message || "Invalid coupon");
            }

        } catch (err) {
            setCouponMessage("Failed to apply coupon");
            console.error(err);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
        setCouponMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Guest checkout is allowed, so we don't redirect to register anymore.
        // The backend handles confirmedUserId as null for guests.

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    customer: formData,
                    shippingCost,
                    couponCode: appliedCoupon ? appliedCoupon.code : null, // Pass coupon code
                    affiliateCode: affiliateCode, // Pass affiliate tracking code
                    // total // Server recalculates, but we can pass if needed for validation (not strictly used by my updated backend)
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Checkout failed");

            // Success
            // For COD, we clear the cart immediately. 
            // For Online/Card, we keep it until they reach the success page 
            // (in case they cancel or come back).
            if (!data.paymentUrl) {
                clearCart();
            }

            // Clear local coupon state
            setAppliedCoupon(null);
            setCouponCode("");

            if (data.paymentUrl) {
                setIsRedirecting(true);
                window.location.href = data.paymentUrl;
            } else {
                router.push(`/order-success/${data.orderId}`);
            }

        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Guest Prompt Banner */}
            {isGuest && (
                <div className="container mx-auto px-4 pt-4">
                    <div className="flex items-center justify-between gap-4 bg-black text-white rounded-2xl px-5 py-4">
                        <div>
                            <p className="font-bold text-sm">দ্রুত অর্ডার করতে অ্যাকাউন্ট খুলুন!</p>
                            <p className="text-gray-400 text-xs mt-0.5">অর্ডার ট্র্যাক করুন, হিস্ট্রি দেখুন এবং আরও সুবিধা পান।</p>
                        </div>
                        <Link href="/auth/register?callbackUrl=/checkout" className="shrink-0 bg-white text-black text-xs font-black px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                            অ্যাকাউন্ট খুলুন
                        </Link>
                    </div>
                </div>
            )}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-5 flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
                    <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                        ← Back to Cart
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">


                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

                    {/* ── LEFT: FORM ── */}
                    <div className="space-y-6">

                        {/* Shipping Card */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</div>
                                <h2 className="text-lg font-bold">Shipping Details</h2>
                            </div>

                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</label>
                                        <input
                                            required
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            placeholder="John"
                                            className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</label>
                                        <input
                                            required
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                            className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                    <input
                                        required
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Address</label>
                                        <textarea
                                            required
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            placeholder="House #, Road #, Area..."
                                            rows="3"
                                            className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white resize-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">City / District</label>
                                        <input
                                            required
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="Dhaka"
                                            className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipping Area</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Inside Dhaka Card */}
                                            <label
                                                className={`relative flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                                                    formData.shippingArea === "inside"
                                                        ? "border-black bg-black text-white shadow-md"
                                                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="shippingArea"
                                                    value="inside"
                                                    checked={formData.shippingArea === "inside"}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${formData.shippingArea === "inside" ? "bg-white/20" : "bg-gray-100"}`}>
                                                    <MapPin className={`w-5 h-5 ${formData.shippingArea === "inside" ? "text-white" : "text-gray-500"}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold leading-tight">Inside Dhaka</p>
                                                    <p className={`text-xs font-semibold mt-0.5 ${formData.shippingArea === "inside" ? "text-gray-300" : "text-gray-400"}`}>
                                                        ৳{Number(settings.shipping_fee_inside) || 60}
                                                    </p>
                                                </div>
                                                {formData.shippingArea === "inside" && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-black rounded-full" />
                                                    </div>
                                                )}
                                            </label>

                                            {/* Outside Dhaka Card */}
                                            <label
                                                className={`relative flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                                                    formData.shippingArea === "outside"
                                                        ? "border-black bg-black text-white shadow-md"
                                                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="shippingArea"
                                                    value="outside"
                                                    checked={formData.shippingArea === "outside"}
                                                    onChange={handleChange}
                                                    className="sr-only"
                                                />
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${formData.shippingArea === "outside" ? "bg-white/20" : "bg-gray-100"}`}>
                                                    <Truck className={`w-5 h-5 ${formData.shippingArea === "outside" ? "text-white" : "text-gray-500"}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold leading-tight">Outside Dhaka</p>
                                                    <p className={`text-xs font-semibold mt-0.5 ${formData.shippingArea === "outside" ? "text-gray-300" : "text-gray-400"}`}>
                                                        ৳{Number(settings.shipping_fee_outside) || 120}
                                                    </p>
                                                </div>
                                                {formData.shippingArea === "outside" && (
                                                    <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                                        <div className="w-2 h-2 bg-black rounded-full" />
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">2</div>
                                <h2 className="text-lg font-bold">Payment Method</h2>
                            </div>
                            <div className="space-y-3">
                                {/* COD */}
                                <label className={`relative flex items-center gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.paymentMethod === "COD" ? "border-black bg-black text-white shadow-md" : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                                }`}>
                                    <input type="radio" name="paymentMethod" value="COD" form="checkout-form" checked={formData.paymentMethod === "COD"} onChange={handleChange} className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.paymentMethod === "COD" ? "bg-white/20" : "bg-gray-100"}`}>
                                        <Banknote className={`w-5 h-5 ${formData.paymentMethod === "COD" ? "text-white" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm">Cash on Delivery</p>
                                        <p className={`text-xs mt-0.5 ${formData.paymentMethod === "COD" ? "text-gray-300" : "text-gray-400"}`}>অর্ডার পৌঁছানোর পর পেমেন্ট</p>
                                    </div>
                                    {formData.paymentMethod === "COD" && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-black rounded-full" />
                                        </div>
                                    )}
                                </label>

                                {/* Mobile Banking */}
                                <label className={`relative flex items-center gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.paymentMethod === "ONLINE" ? "border-black bg-black text-white shadow-md" : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                                }`}>
                                    <input type="radio" name="paymentMethod" value="ONLINE" form="checkout-form" checked={formData.paymentMethod === "ONLINE"} onChange={handleChange} className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.paymentMethod === "ONLINE" ? "bg-white/20" : "bg-gray-100"}`}>
                                        <Smartphone className={`w-5 h-5 ${formData.paymentMethod === "ONLINE" ? "text-white" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm">Mobile Banking</p>
                                        <p className={`text-xs mt-0.5 ${formData.paymentMethod === "ONLINE" ? "text-gray-300" : "text-gray-400"}`}>bKash · Nagad · Rocket</p>
                                    </div>
                                    {formData.paymentMethod === "ONLINE" && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-black rounded-full" />
                                        </div>
                                    )}
                                </label>

                                {/* Card */}
                                <label className={`relative flex items-center gap-3.5 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    formData.paymentMethod === "CARD" ? "border-black bg-black text-white shadow-md" : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"
                                }`}>
                                    <input type="radio" name="paymentMethod" value="CARD" form="checkout-form" checked={formData.paymentMethod === "CARD"} onChange={handleChange} className="sr-only" />
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.paymentMethod === "CARD" ? "bg-white/20" : "bg-gray-100"}`}>
                                        <CreditCard className={`w-5 h-5 ${formData.paymentMethod === "CARD" ? "text-white" : "text-gray-500"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm">Card Payment</p>
                                        <p className={`text-xs mt-0.5 ${formData.paymentMethod === "CARD" ? "text-gray-300" : "text-gray-400"}`}>Visa · MasterCard · Amex</p>
                                    </div>
                                    {formData.paymentMethod === "CARD" && (
                                        <div className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-black rounded-full" />
                                        </div>
                                    )}
                                </label>
                            </div>


                            {requiresAdvance && formData.paymentMethod === "COD" && (
                                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
                                            <span className="text-lg">ℹ️</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-orange-900">Advance Payment Required</p>
                                            <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                                Your cart contains pre-order items. You need to pay <span className="font-bold">{formatPrice(advanceAmount)}</span> in advance to confirm your order. 
                                                The remaining <span className="font-bold">{formatPrice(total - advanceAmount)}</span> will be paid on delivery.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* ── RIGHT: ORDER SUMMARY ── */}
                    <div className="sticky top-24 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                            <div className="bg-gray-900 text-white px-6 py-4">
                                <h2 className="font-bold text-base">Order Summary</h2>
                                <p className="text-gray-400 text-xs mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} in your cart</p>
                            </div>

                            {/* Items */}
                            <div className="divide-y max-h-[360px] overflow-y-auto">
                                {items.map((item) => {
                                    const lineTotal = item.price * item.quantity;
                                    return (
                                        <div key={item.uniqueKey} className="flex gap-3 p-4">
                                            {/* Image */}
                                            <div className="relative w-14 h-18 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border" style={{ height: '72px' }}>
                                                {(item.product.productImages?.[0]?.url || item.product.images?.[0]) && (
                                                    <Image
                                                        src={item.product.productImages?.[0]?.url || item.product.images[0]}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm line-clamp-1">{item.product.name}</p>

                                                {/* Variant Badges */}
                                                {item.variant && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {item.variant.size && (
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md border">
                                                                {item.variant.size}
                                                            </span>
                                                        )}
                                                        {item.variant.color && (
                                                            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md border">
                                                                <span className="w-2 h-2 rounded-full border" style={{ backgroundColor: item.variant.color.toLowerCase() }} />
                                                                {item.variant.color}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Qty controls + price */}
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                                                        <button type="button" onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)} disabled={item.quantity <= 1}
                                                            className="w-6 h-6 text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm flex items-center justify-center font-bold">−</button>
                                                        <span className="w-6 h-6 flex items-center justify-center text-xs font-bold border-x border-gray-200">{item.quantity}</span>
                                                        <button type="button" onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                                                            className="w-6 h-6 text-gray-500 hover:bg-gray-100 transition-colors text-sm flex items-center justify-center font-bold">+</button>
                                                    </div>
                                                    <span className="font-bold text-sm">{formatPrice(lineTotal)}</span>
                                                </div>

                                                <button type="button" onClick={() => removeItem(item.uniqueKey)}
                                                    className="text-[10px] text-red-400 hover:text-red-600 mt-1 transition-colors">
                                                    Remove
                                                </button>
                                                
                                                {item.product.isPreOrder && (
                                                    <div className="mt-2 text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 inline-block uppercase">
                                                        Pre-Order (৳100 Advance)
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Coupon */}
                            <div className="px-4 py-4 border-t bg-gray-50">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coupon Code</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="ENTER CODE"
                                        className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all"
                                        disabled={!!appliedCoupon}
                                    />
                                    {appliedCoupon ? (
                                        <button onClick={handleRemoveCoupon} type="button" className="h-10 px-3 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors">Remove</button>
                                    ) : (
                                        <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode} type="button"
                                            className="h-10 px-4 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
                                            {couponLoading ? "..." : "Apply"}
                                        </button>
                                    )}
                                </div>
                                {couponMessage && (
                                    <p className={`text-xs mt-2 font-medium ${appliedCoupon ? "text-green-600" : "text-red-500"}`}>{couponMessage}</p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="px-4 py-4 border-t space-y-2.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount ({appliedCoupon.code})</span>
                                        <span className="font-semibold">− {formatPrice(appliedCoupon.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping ({formData.shippingArea === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
                                    <span className="font-medium">{formatPrice(shippingCost)}</span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2.5 border-t mt-2">
                                    <span>Total</span>
                                    <span className="text-lg">{formatPrice(total)}</span>
                                </div>

                                {requiresAdvance && formData.paymentMethod === "COD" && (
                                    <div className="pt-2 space-y-1">
                                        <div className="flex justify-between text-sm text-orange-600 font-bold">
                                            <span>Pay Now (Advance)</span>
                                            <span>{formatPrice(advanceAmount)}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px] text-gray-500 italic">
                                            <span>Pay on Delivery</span>
                                            <span>{formatPrice(total - advanceAmount)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop: Place Order */}
                            <div className="p-4 pt-2">
                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={loading}
                                    className="w-full h-13 bg-black text-white font-bold text-sm rounded-xl hover:bg-gray-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg py-4 tracking-wide"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        (requiresAdvance && formData.paymentMethod === "COD")
                                        ? `Pay Advance ${formatPrice(advanceAmount)} & Order`
                                        : `Place Order — ${formatPrice(total)}`
                                    )}
                                </button>
                                <p className="text-[11px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
                                    🔒 Secure & encrypted checkout
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
