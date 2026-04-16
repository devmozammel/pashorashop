"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Assuming sonner is used, or alert
import TrustBadges from "@/components/storefront/TrustBadges";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
    const { items, getCartTotal, clearCart, updateQuantity, removeItem } = useCartStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState({ shipping_fee_inside: "70", shipping_fee_outside: "130" });

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
    }, []);

    const { data: session, status: sessionStatus } = useSession();
    
    // Auth Guard: Redirect to login if not authenticated
    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            router.replace("/auth/login?callbackUrl=/checkout");
        }
    }, [sessionStatus, router]);

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

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <Link href="/"><Button>Continue Shopping</Button></Link>
            </div>
        );
    }

    const shippingCost = formData.shippingArea === "inside"
        ? (Number(settings.shipping_fee_inside) || 70)
        : (Number(settings.shipping_fee_outside) || 130);

    // Recalculate totals
    const subtotal = getCartTotal();
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const total = subtotal - discount + shippingCost;

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
            clearCart();
            // Clear coupon state too
            setAppliedCoupon(null);
            setCouponCode("");

            if (data.paymentUrl) {
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
            {/* Page Header */}
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

                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipping Area</label>
                                        <select
                                            name="shippingArea"
                                            value={formData.shippingArea}
                                            onChange={handleChange}
                                            className="w-full h-11 px-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                                        >
                                            <option value="inside">Inside Dhaka — {Number(settings.shipping_fee_inside) || 70} BDT</option>
                                            <option value="outside">Outside Dhaka — {Number(settings.shipping_fee_outside) || 130} BDT</option>
                                        </select>
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
                                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "COD" ? "border-black bg-black/[0.03]" : "border-gray-200 hover:border-gray-300"}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        form="checkout-form"
                                        checked={formData.paymentMethod === "COD"}
                                        onChange={handleChange}
                                        className="accent-black w-4 h-4"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-2xl">💵</span>
                                        <div>
                                            <p className="font-semibold text-sm">Cash on Delivery</p>
                                            <p className="text-xs text-gray-500">Pay when your order arrives</p>
                                        </div>
                                    </div>
                                    {formData.paymentMethod === "COD" && (
                                        <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full">Selected</span>
                                    )}
                                </label>

                                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "ONLINE" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="ONLINE"
                                        form="checkout-form"
                                        checked={formData.paymentMethod === "ONLINE"}
                                        onChange={handleChange}
                                        className="accent-blue-600 w-4 h-4"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-2xl">📱</span>
                                        <div>
                                            <p className="font-semibold text-sm">Mobile Banking</p>
                                            <p className="text-xs text-gray-500">bKash · Nagad · Rocket</p>
                                        </div>
                                    </div>
                                    {formData.paymentMethod === "ONLINE" && (
                                        <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">Selected</span>
                                    )}
                                </label>

                                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.paymentMethod === "CARD" ? "border-violet-600 bg-violet-50" : "border-gray-200 hover:border-gray-300"}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="CARD"
                                        form="checkout-form"
                                        checked={formData.paymentMethod === "CARD"}
                                        onChange={handleChange}
                                        className="accent-violet-600 w-4 h-4"
                                    />
                                    <div className="flex items-center gap-3 flex-1">
                                        <span className="text-2xl">💳</span>
                                        <div>
                                            <p className="font-semibold text-sm">Card Payment</p>
                                            <p className="text-xs text-gray-500">Visa · MasterCard · Amex</p>
                                        </div>
                                    </div>
                                    {formData.paymentMethod === "CARD" && (
                                        <span className="text-xs font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">Selected</span>
                                    )}
                                </label>

                            </div>

                            {error && (
                                <div className="mt-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Mobile: Place Order button */}
                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loading}
                            className="lg:hidden w-full h-14 bg-black text-white font-bold text-base rounded-xl hover:bg-gray-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? "Processing..." : `Place Order — ${formatPrice(total)}`}
                        </button>
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
                                    ) : `Place Order — ${formatPrice(total)}`}
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
