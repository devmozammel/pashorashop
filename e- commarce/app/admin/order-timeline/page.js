"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Clock } from "lucide-react";

export default function OrderTimelinePage() {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch("/api/admin/orders");
                const data = await res.json();
                if (data.orders) {
                    setOrders(data.orders);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            }
        }
        fetchOrders();
    }, []);

    return (
        <AdminShell title="Order Timeline">
            <div className="bg-white rounded-xl border shadow-sm p-6 max-w-3xl mx-auto">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {orders.slice(0, 10).map((order, idx) => (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <Clock className="w-5 h-5" />
                            </div>

                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-slate-900">Order #{order.id}</div>
                                    <time className="font-caveat font-medium text-emerald-500">{new Date(order.createdAt).toLocaleDateString()}</time>
                                </div>
                                <div className="text-slate-500">
                                    Customer {order.customerName} placed an order of {order.total} BDT. <span className="font-semibold text-emerald-600">Status: {order.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminShell>
    );
}
