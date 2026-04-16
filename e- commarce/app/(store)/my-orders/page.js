"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { requireUserClient } from "@/lib/userSession";
import { Loader2, Package, ShoppingBag, Eye } from "lucide-react";

export default function MyOrdersPage() {
    const { user, status } = requireUserClient();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            if (!user) return;

            // Try API
            try {
                const res = await fetch("/api/my-orders");
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                } else {
                    console.error("Failed to fetch orders");
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated") {
            fetchOrders();
        }
    }, [user, status]);

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    // Empty State
    if (!orders || orders.length === 0) {
        return (
            <div className="container py-20 px-4 max-w-4xl mx-auto text-center">
                <div className="bg-gray-50 rounded-2xl p-10 border border-dashed flex flex-col items-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold mb-2">No orders placed yet</h2>
                    <p className="text-muted-foreground mb-6">Looks like you haven't bought anything yet.</p>
                    <Link href="/" className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10 px-4 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>

            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-lg">#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</span>
                                    <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-4 md:text-right">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="font-bold text-lg">{formatPrice(order.total || 0)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {order.items?.length || 0} items
                            </p>
                            <Link
                                href={`/order/${order.id}`}
                                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                            >
                                <Eye className="w-4 h-4" />
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
