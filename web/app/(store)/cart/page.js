"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartPage() {
    const { items, updateQuantity, removeItem, getCartTotal } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="p-12 text-center">Loading cart...</div>;

    if (items.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                <p className="text-gray-600 mb-8">Looks like you haven't added anything yet.</p>
                <Link href="/">
                    <Button size="lg">Start Shopping</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                    {items.map((item) => (
                        <div key={item.uniqueKey} className="flex gap-4 p-4 border rounded-xl bg-white shadow-sm">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                {item.product.images?.[0] ? (
                                    <Image
                                        src={item.product.images[0]}
                                        alt={item.product.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-xs text-gray-400">No Image</div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <Link href={`/product/${item.product.slug}`} className="font-semibold hover:underline line-clamp-2">
                                            {item.product.name}
                                        </Link>
                                        <button
                                            onClick={() => removeItem(item.uniqueKey)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {item.variant ? (
                                            <span>{item.variant.name}: {item.variant.value}</span>
                                        ) : (
                                            <span>Standard</span>
                                        )}
                                    </div>
                                    <div className="font-bold mt-1">
                                        {formatPrice(item.price)}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4">
                                    <div className="flex items-center border rounded-md">
                                        <button
                                            onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)}
                                            className="p-1 hover:bg-gray-100"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                                            className="p-1 hover:bg-gray-100"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatPrice(getCartTotal())}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="text-gray-500 italic">Calculated at checkout</span>
                            </div>
                        </div>
                        <div className="border-t my-4 pt-4 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{formatPrice(getCartTotal())}</span>
                        </div>
                        <Link href="/checkout" className="block w-full">
                            <Button size="lg" className="w-full gap-2 text-base">
                                Checkout <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                        <p className="text-xs text-gray-400 text-center mt-4">Safe and Secure Checkout</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
