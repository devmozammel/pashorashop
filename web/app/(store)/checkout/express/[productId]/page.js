"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2, Lock } from "lucide-react";
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

        const finalPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
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

    const finalPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
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
                                <label className="block text-sm font-semibold mb-1 text-gray-700">Shipping Area</label>
                                <select
                                    required
                                    className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 bg-white text-sm"
                                    value={form.shippingArea}
                                    onChange={e => setForm({ ...form, shippingArea: e.target.value })}
                                >
                                    <option value="inside">Inside Dhaka (৳{Number(settings.shipping_fee_inside) || 70})</option>
                                    <option value="outside">Outside Dhaka (৳{Number(settings.shipping_fee_outside) || 130})</option>
                                </select>
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
                                <h3 className="font-bold text-sm text-gray-900 mb-3">Payment Method</h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer bg-gray-50 hover:bg-white transition-all text-sm font-semibold">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={form.paymentMethod === 'COD'}
                                            onChange={() => setForm({ ...form, paymentMethod: 'COD' })}
                                            className="w-4 h-4 text-black focus:ring-black border-gray-300"
                                        />
                                        <span>Cash on Delivery (হাতে পেয়ে টাকা পরিশোধ)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer bg-gray-50 hover:bg-white transition-all text-sm font-semibold">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="ONLINE"
                                            checked={form.paymentMethod === 'ONLINE'}
                                            onChange={() => setForm({ ...form, paymentMethod: 'ONLINE' })}
                                            className="w-4 h-4 text-black focus:ring-black border-gray-300"
                                        />
                                        <span>Online Payment (bKash, Nagad, Rocket, Cards)</span>
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
