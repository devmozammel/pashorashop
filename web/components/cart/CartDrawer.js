"use client";

import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function CartDrawer() {
    const { items, isOpen, closeDrawer, removeItem, updateQuantity, getCartTotal } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={closeDrawer}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-300 flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <ShoppingBag className="w-5 h-5" />
                        Cart ({items.length})
                    </div>
                    <button onClick={closeDrawer} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                            <ShoppingBag className="w-12 h-12 opacity-20" />
                            <p>Your cart is empty.</p>
                            <Button variant="outline" onClick={closeDrawer}>Continue Shopping</Button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.uniqueKey} className="flex gap-4 py-4 border-b last:border-0">
                                <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                    {item.product.images?.[0] ? (
                                        <Image
                                            src={item.product.images[0]}
                                            alt={item.product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-xs text-gray-400">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                                        <button
                                            onClick={() => removeItem(item.uniqueKey)}
                                            className="text-gray-400 hover:text-red-500 ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {item.variant ? `${item.variant.name}: ${item.variant.value}` : 'Standard'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border rounded h-8">
                                            <button
                                                onClick={() => updateQuantity(item.uniqueKey, item.quantity - 1)}
                                                className="px-2 hover:bg-gray-100 h-full flex items-center"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.uniqueKey, item.quantity + 1)}
                                                className="px-2 hover:bg-gray-100 h-full flex items-center"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center font-bold text-lg">
                            <span>Subtotal</span>
                            <span>{formatPrice(getCartTotal())}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/cart" onClick={closeDrawer}>
                                <Button variant="outline" className="w-full">View Cart</Button>
                            </Link>
                            <Link href="/checkout" onClick={closeDrawer}>
                                <Button className="w-full">Checkout</Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
