"use client";

import { useCartStore } from "@/lib/store/cart";
import { X, Minus, Plus, ShoppingBag, Truck, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";

export default function CartDrawer() {
    const { items, isOpen, closeDrawer, removeItem, updateQuantity, getCartTotal } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState({ free_shipping_threshold: 1000 });

    useEffect(() => {
        setMounted(true);
        // Fetch valid settings
        fetch('/api/settings').then(res => res.json()).then(data => {
            if (data.free_shipping_threshold) {
                setSettings(prev => ({ ...prev, free_shipping_threshold: Number(data.free_shipping_threshold) }));
            }
        }).catch(err => console.error("Failed to fetch settings", err));
    }, []);

    if (!mounted) return null;

    const subtotal = getCartTotal();
    const threshold = settings.free_shipping_threshold;
    const progress = Math.min((subtotal / threshold) * 100, 100);
    const remaining = Math.max(threshold - subtotal, 0);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 transition-opacity backdrop-blur-sm"
                    onClick={closeDrawer}
                />
            )}

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-background shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-white z-10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Cart ({items.length})
                    </h2>
                    <button type="button" onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Free Shipping Progress */}
                <div className="px-4 py-3 bg-gray-50 border-b">
                    <div className="flex items-center gap-2 text-sm mb-2">
                        <Truck className="w-4 h-4 text-primary" />
                        {remaining > 0 ? (
                            <span>Add <span className="font-bold text-primary">{formatCurrency(remaining)}</span> for <span className="font-bold text-green-600">Free Shipping</span></span>
                        ) : (
                            <span className="text-green-600 font-bold">You've unlocked Free Shipping! 🎉</span>
                        )}
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Included Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-3/4 text-muted-foreground space-y-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                <ShoppingBag className="w-10 h-10 opacity-30" />
                            </div>
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <button onClick={closeDrawer} className="text-primary font-bold hover:underline">
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.uniqueKey} className="flex gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-gray-100 shrink-0 border">
                                    {item.product.images?.[0] ? (
                                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-sm line-clamp-2 pr-4">{item.product.name}</h3>
                                        <button
                                            onClick={() => removeItem(item.uniqueKey)}
                                            className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {item.variant && (item.variant.size || item.variant.color) && (
                                        <p className="text-xs text-gray-500">
                                            {[item.variant.size, item.variant.color].filter(Boolean).join(" / ")}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-2 pt-1">
                                        <div className="flex items-center border rounded-md bg-white">
                                            <button
                                                onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)}
                                                className="p-1.5 hover:bg-gray-100 disabled:opacity-50 text-gray-600"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                                                className="p-1.5 hover:bg-gray-100 text-gray-600"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t p-4 space-y-4 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {/* Coupon (Visual only for now) */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Discount Code"
                                className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-primary"
                            />
                            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black">
                                Apply
                            </button>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                        </div>

                        <Link
                            href="/checkout"
                            onClick={closeDrawer}
                            className="w-full bg-primary text-primary-foreground h-12 rounded-xl flex items-center justify-center font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                        >
                            Checkout Now
                        </Link>

                        <div className="flex justify-center gap-4 text-gray-400 pt-2">
                            {/* Generic Icons */}
                            <CreditCard className="w-6 h-6" />
                            {/* Add more icons logic or images if available */}
                            <span className="text-xs self-center">Secure Checkout</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
