"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";

export default function InvoicePage({ params }) {
    const [order, setOrder] = useState(null);
    const [settings, setSettings] = useState({ siteName: "Authentic Bazar", address: "Dhaka, Bangladesh", supportEmail: "support@authenticbazar.shop" });

    useEffect(() => {
        if (params.id) {
            async function fetchOrder() {
                try {
                    const [orderRes, settingsRes] = await Promise.all([
                        fetch(`/api/admin/orders/${params.id}`),
                        fetch(`/api/admin/settings`)
                    ]);

                    if (orderRes.ok) {
                        const data = await orderRes.json();
                        setOrder(data.data); // Fixed access from data.data
                    }
                    if (settingsRes.ok) {
                        const data = await settingsRes.json();
                        if (data.ok) setSettings(data.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch invoice data", error);
                }
            }
            fetchOrder();
        }
    }, [params]);

    if (!order) return <div className="p-8">Loading Invoice...</div>;

    const shipping = order.shippingCost || 0;
    const total = (order.subtotal || 0) + shipping;

    const address = typeof order.shippingAddress === 'string' 
        ? JSON.parse(order.shippingAddress) 
        : order.shippingAddress || {};

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            <div className="max-w-3xl mx-auto border p-8 print:border-0 print:w-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tighter">INVOICE</h1>
                        <p className="text-gray-500 mt-1 font-mono">#{order.orderNumber || order.id}</p>
                    </div>
                    <div className="text-right">
                        <div className="font-black text-2xl uppercase italic">{settings.siteName}</div>
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <p>{settings.address}</p>
                            <p>{settings.supportEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Delivery Details</h3>
                        <div className="text-gray-900 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <p className="font-bold text-lg">{order.customerName}</p>
                            <p className="font-medium text-blue-600">{order.customerPhone}</p>
                            <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                                <p>{address.street}</p>
                                <p>{address.city}{address.zip ? `, ${address.zip}` : ''}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <div className="space-y-1.5 text-right w-full">
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-500 font-medium">Date:</span>
                                <span className="font-bold">{new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-500 font-medium">Payment:</span>
                                <span className="font-black text-emerald-600 uppercase italic">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-500 font-medium">Status:</span>
                                <span className="font-black text-blue-600 uppercase italic">{order.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="rounded-xl border border-gray-100 overflow-hidden mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-left border-b">
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Item Description</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Qty</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Unit Price</th>
                                <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {order.items?.map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50/10">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{item.name || item.product?.name}</div>
                                        {item.metadata?.variantName && (
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{item.metadata.variantName}: {item.metadata.variantValue}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center font-bold text-gray-600">{item.quantity}</td>
                                    <td className="p-4 text-right font-medium">{formatPrice(item.unitPrice)}</td>
                                    <td className="p-4 text-right font-black text-gray-900">{formatPrice(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="flex justify-end p-2">
                    <div className="w-72 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="font-bold">{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Delivery Fee</span>
                            <span className="font-bold">{formatPrice(shipping)}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-200 pt-3 mt-1 underline-offset-4">
                            <span className="font-black text-gray-900 uppercase italic tracking-tighter">Grand Total</span>
                            <span className="font-black text-2xl text-gray-900">{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-8 border-t border-dashed text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Thank you for your business</p>
                    <p className="text-[10px] text-gray-400">This is a computer generated invoice and does not require a physical signature.</p>
                </div>

                {/* Print Button */}
                <div className="mt-8 text-center print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 shadow-xl shadow-gray-100 transition-all active:scale-95"
                    >
                        Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}
