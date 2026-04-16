"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";

export default function InvoicePage({ params }) {
    const [order, setOrder] = useState(null);

    useEffect(() => {
        if (params.id) {
            async function fetchOrder() {
                try {
                    const res = await fetch(`/api/admin/orders/${params.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setOrder(data.order);
                    }
                } catch (error) {
                    console.error("Failed to fetch order", error);
                }
            }
            fetchOrder();
        }
    }, [params]);

    if (!order) return <div className="p-8">Loading Invoice...</div>;

    // Use order data or defaults
    const subtotal = order.total || 0;
    const shipping = order.deliveryFee || 0;
    const total = subtotal + shipping;

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            <div className="max-w-3xl mx-auto border p-8 print:border-0 print:w-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                        <p className="text-gray-500 mt-1">Order #{order.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xl">Fashion House</div>
                        <div className="text-sm text-gray-600">
                            123 Fashion Street<br />
                            Dhaka, Bangladesh<br />
                            support@fashionhouse.com
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Bill To</h3>
                        <div className="text-gray-900">
                            <p className="font-bold">{order.customerName}</p>
                            <p>{order.phone}</p>
                            <p>Delivery Area: {order.deliveryArea}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="mb-2">
                            <span className="text-gray-500 font-medium mr-4">Date:</span>
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mb-2">
                            <span className="text-gray-500 font-medium mr-4">Status:</span>
                            <span className="uppercase">{order.status}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 font-medium mr-4">Payment:</span>
                            <span className="uppercase">{order.paymentMethod}</span>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-3 font-semibold">Item</th>
                            <th className="p-3 font-semibold text-right">Quantity</th>
                            <th className="p-3 font-semibold text-right">Price</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items?.map((item, i) => (
                            <tr key={i} className="border-b">
                                <td className="p-3">
                                    <div className="font-medium">{item.product?.name || item.productId}</div>
                                </td>
                                <td className="p-3 text-right">{item.quantity}</td>
                                <td className="p-3 text-right">{formatPrice(item.price)}</td>
                                <td className="p-3 text-right">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span className="font-medium">{formatPrice(shipping)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2 text-lg font-bold">
                            <span>Total:</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
                    <p>Thank you for shopping with Fashion House!</p>
                </div>

                {/* Print Button */}
                <div className="mt-8 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
                    >
                        Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
