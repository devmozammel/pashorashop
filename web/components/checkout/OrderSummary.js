"use client";

import { useCartStore } from "@/lib/store/cart";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Tag } from "lucide-react";

export default function OrderSummary({ loading, onPlaceOrder }) {
    const { items, getCartTotal } = useCartStore();
    const [couponCode, setCouponCode] = useState("");
    const [coupon, setCoupon] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");

    const subtotal = getCartTotal();
    const shipping = subtotal > 1000 ? 0 : 60;

    let discount = 0;
    if (coupon) {
        if (coupon.type === "PERCENTAGE") {
            discount = (subtotal * parseFloat(coupon.discount)) / 100;
        } else {
            discount = parseFloat(coupon.discount);
        }
    }

    const total = subtotal - discount + shipping;

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setVerifying(true);
        setError("");

        try {
            const res = await fetch("/api/coupons/verify", {
                method: "POST",
                body: JSON.stringify({ code: couponCode }),
            });
            const data = await res.json();

            if (res.ok) {
                setCoupon(data);
            } else {
                setError(data.error);
                setCoupon(null);
            }
        } catch (err) {
            setError("Failed to verify coupon");
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-6 sticky top-24">
            <h2 className="text-xl font-bold">Order Summary</h2>

            {/* Items List */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {items.map((item) => (
                    <div key={item.uniqueKey} className="flex gap-4">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden shrink-0">
                            {item.product.images?.[0] && (
                                <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                            )}
                        </div>
                        <div className="flex-1 text-sm">
                            <p className="font-medium line-clamp-2">{item.product.name}</p>
                            <p className="text-muted-foreground">{item.quantity} x ${item.price}</p>
                            {item.variant && <p className="text-xs text-muted-foreground">{item.variant.value}</p>}
                        </div>
                        <div className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{shipping === 0 ? "Free" : `$${shipping}`}</span>
                </div>
                {coupon && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({coupon.code})</span>
                        <span>-${discount.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Coupon Input */}
            <div className="flex gap-2">
                <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon Code"
                    className="flex-1 px-3 py-2 border rounded-md text-sm outline-none focus:border-primary"
                />
                <button
                    onClick={handleApplyCoupon}
                    disabled={verifying || !couponCode}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                    {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>

            <button
                form="checkout-form"
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full h-12 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => onPlaceOrder({ couponCode: coupon?.code })}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Place Order"}
            </button>
        </div>
    );
}
