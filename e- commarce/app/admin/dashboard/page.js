"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { DollarSign, ShoppingBag, Box, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Stats Card Component
function StatCard({ title, value, icon: Icon, color, trend }) {
    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
                {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, users: 0 });
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await fetch("/api/admin/stats");
                const data = await res.json();
                if (data.ok) {
                    setStats(data.data.stats);
                    setLowStockProducts(data.data.lowStockProducts);
                    setRecentOrders(data.data.recentOrders);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(amount);
    };

    return (
        <AdminShell title="Dashboard">
            {isLoading ? (
                <div className="flex justify-center flex-col items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading metrics...</p>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Revenue"
                            value={formatCurrency(stats.revenue)}
                            icon={DollarSign}
                            color="bg-green-500"
                        />
                        <StatCard
                            title="Total Orders"
                            value={stats.orders}
                            icon={ShoppingBag}
                            color="bg-blue-500"
                        />
                        <StatCard
                            title="Active Products"
                            value={stats.products}
                            icon={Box}
                            color="bg-purple-500"
                        />
                        <StatCard
                            title="Total Users"
                            value={stats.users}
                            icon={Users}
                            color="bg-orange-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Orders */}
                        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold">Recent Orders</h2>
                                <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">View All</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-gray-500 border-b">
                                        <tr>
                                            <th className="pb-2">Order #</th>
                                            <th className="pb-2">Customer</th>
                                            <th className="pb-2">Total</th>
                                            <th className="pb-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentOrders.map(order => (
                                            <tr key={order.id}>
                                                <td className="py-3 font-medium text-gray-900">
                                                    <Link href={`/admin/orders/${order.id}`} className="hover:underline text-blue-600">
                                                        {order.orderNumber}
                                                    </Link>
                                                </td>
                                                <td className="py-3">{order.customerName}</td>
                                                <td className="py-3 font-medium">{formatCurrency(order.total)}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {recentOrders.length === 0 && (
                                            <tr><td colSpan="4" className="py-4 text-center text-gray-500">No orders yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Low Stock Alert */}
                        <div className="bg-white rounded-xl border shadow-sm p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold">Low Stock Alert</h2>
                                <Link href="/admin/inventory" className="text-sm text-blue-600 hover:underline">Manage</Link>
                            </div>
                            <div className="space-y-4">
                                {lowStockProducts.map(product => {
                                    let imgArray = [];
                                    try {
                                        imgArray = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                                    } catch (e) { }

                                    return (
                                        <div key={product.id} className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                {imgArray && imgArray[0] && (
                                                    <img src={imgArray[0]} alt={product.name} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                                                <p className="text-xs text-red-500 font-bold">{product.stock} left</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {lowStockProducts.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">Inventory looks good! 🎉</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AdminShell>
    );
}
