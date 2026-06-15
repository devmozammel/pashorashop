
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExpressCheckout({ params }) {
    const { productId } = params;
    const router = useRouter();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Checkout Form State
    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        paymentMethod: "COD"
    });

    useEffect(() => {
        // Fetch product details
        // We can reuse the public product API if it supports ID, or create a specific one
        // Let's assume /api/products returns list, maybe filter?
        // Better: Use the database directly via server component?
        // Since this is client component, we need an API.
        // Let's use the public product details API if available or mock it for now with the list.
        // Actually, we have /api/products, let's fetch all and find (not efficient but works for MVP)
        // OR better: create a simple API endpoint for single product by ID.
        // Or assume productId is actually slug? The route says [id].

        // Let's implement a quick fetcher
        async function fetchProduct() {
            try {
                // Fetching all products to find one is bad practice but quick for demo
                // Ideally: GET /api/products/[id]
                // We have /api/products?query=...
                // Let's try to fetch /api/admin/landing-pages/product-details/[id] ? No.
                // Let's look at existing APIs. 
                // We have /app/api/products/route.js. We can add [id].
                // For now, let's mock fetch or use the one we just made for landing pages?
                // Let's assume we can fetch data. 

                // Temporary fix: Fetch from the landing page API if we knew the slug? No.
                // Let's just use the product list API and filter client side for now.
                const res = await fetch(`/api/products/${productId}`);
                if (!res.ok) throw new Error("Failed to fetch product");
                const data = await res.json();
                setProduct(data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        }
        fetchProduct();
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Create Order
            // Use existing /api/orders endpoint
            // Payload needs: items: [{productId, quantity: 1, price}], shippingAddress, paymentMethod
            const orderData = {
                items: [{
                    productId: product.id,
                    quantity: 1,
                    price: product.price, // Server should validate this!
                    name: product.name
                }],
                shippingAddress: {
                    name: form.name,
                    phone: form.phone,
                    street: form.address,
                    city: form.city,
                    country: "Bangladesh"
                },
                paymentMethod: form.paymentMethod,
                total: product.price // Simplified
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                const data = await res.json();
                // Redirect to success
                router.push(`/order-confirmation/${data.orderNumber}`);
                // We need to make sure this page exists or use a generic one
            } else {
                alert("Failed to place order. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Express Checkout</h1>
                    <p className="text-gray-500">Complete your purchase in seconds</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                        <h2 className="font-semibold mb-4 text-lg">Order Summary</h2>
                        <div className="flex gap-4 mb-4 pb-4 border-b">
                            <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                                {(product.images?.[0] || product.productImages?.[0]?.url) ? (
                                    <Image src={product.images?.[0] || product.productImages[0].url} alt={product.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                                <p className="text-gray-500 text-sm">Qty: 1</p>
                                <p className="font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2">
                            <span>Total</span>
                            <span>{formatCurrency(product.price)}</span>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h2 className="font-semibold mb-4 text-lg">Shipping Details</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Full Name</label>
                                <input
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input
                                    required
                                    type="tel"
                                    className="w-full p-2 border rounded-lg"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    rows="2"
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 border-t">
                                <h3 className="font-semibold mb-3">Payment Method</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-gray-50 hover:bg-white transition-colors">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="COD"
                                            checked={form.paymentMethod === 'COD'}
                                            onChange={() => setForm({ ...form, paymentMethod: 'COD' })}
                                        />
                                        <span>Cash on Delivery</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-gray-50 hover:bg-white transition-colors opacity-60">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="BKASH"
                                            disabled
                                        />
                                        <span>bKash (Coming Soon)</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-bold text-lg mt-6 shadow-lg shadow-primary/20 hover:opacity-90 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : <Lock className="w-4 h-4" />}
                                Place Order {formatCurrency(product.price)}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
