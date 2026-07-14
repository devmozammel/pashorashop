"use client";

import { useState, useEffect, Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Search, Loader2, Eye, Truck, Package, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PACKED: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

function AdminOrdersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    // Params
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");

    const updatePage = (p) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", p);
        router.push(`${pathname}?${params.toString()}`);
    };

    useEffect(() => {
        fetchOrders();
    }, [status, search, page]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({ status, search, page, limit: 20 });
            const res = await fetch(`/api/admin/orders?${query}`);
            const data = await res.json();
            if (data.ok) {
                setOrders(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleStatusChange = (newStatus) => {
        const params = new URLSearchParams(searchParams);
        params.set("status", newStatus);
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <AdminShell title="Orders">
            <div className="bg-white rounded-xl shadow-sm border flex flex-col min-h-[600px]">
                {/* Filters */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {["ALL", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "ABNORMAL"].map(s => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${status === s
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {s === "ABNORMAL" ? "Abnormal" : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search order number, name, or phone..."
                                defaultValue={search}
                                onBlur={handleSearch}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Link
                            href="/admin/orders/create"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Create Manual Order
                        </Link>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            No orders found.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Order #</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Payment</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-3 font-medium text-blue-600">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-gray-900">{order.customerName}</div>
                                            <div className="text-xs text-gray-500">{order._count.items} items</div>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[order.status] || "bg-gray-100"}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-xs font-bold">{order.paymentMethod}</div>
                                            <span className={`text-xs ${order.paymentStatus === "PAID" ? "text-green-600" : "text-orange-500"}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-medium">
                                            ৳{order.total}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-50 transition text-xs font-medium"
                                            >
                                                <Eye className="w-3 h-3" />
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="p-4 border-t flex justify-center items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => updatePage(page - 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-100 transition bg-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => updatePage(p)}
                                    className={`w-10 h-10 rounded-xl text-sm font-medium transition ${p === page ? "bg-red-600 text-white shadow" : "border border-gray-200 hover:bg-gray-100 text-gray-600 bg-white"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={page >= pagination.pages}
                            onClick={() => updatePage(page + 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-100 transition bg-white"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500 hover:animate-pulse">Loading orders...</div>}>
            <AdminOrdersContent />
        </Suspense>
    );
}
