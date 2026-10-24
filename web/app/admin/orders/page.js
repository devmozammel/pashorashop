"use client";

import { useState, useEffect, Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { 
    Search, Loader2, Eye, Truck, Package, CheckCircle, XCircle, Clock, 
    ChevronLeft, ChevronRight, Plus, RefreshCw, Wallet, ShieldAlert, 
    ShieldCheck, Star, ExternalLink, Send, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
    PACKED: "bg-purple-100 text-purple-800 border-purple-200",
    SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

function CustomerTrustBadge({ score, isAbnormal }) {
    if (isAbnormal) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-200">
                <ShieldAlert className="w-3 h-3 text-red-600" />
                সন্দেহজনক অর্ডার
            </span>
        );
    }

    if (!score) return null;

    if (score.isBlacklisted) {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-red-600 text-white animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                🚫 ব্লকলিস্টেড
            </span>
        );
    }

    if (score.riskLevel === "HIGH_RISK") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-800 border border-red-300" title={`বাতিল: ${score.cancelledOrders}টি, ক্যানসেল রেট: ${score.cancelRate}%`}>
                <AlertTriangle className="w-3 h-3 text-red-600" />
                ⚠️ হাই রিস্ক ({score.cancelRate}% বাতিল)
            </span>
        );
    }

    if (score.riskLevel === "MODERATE_RISK") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-300" title={`সফল: ${score.deliveredOrders}, বাতিল: ${score.cancelledOrders}`}>
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                সতর্কতা ({score.cancelRate}% বাতিল)
            </span>
        );
    }

    if (score.riskLevel === "VIP") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title={`${score.deliveredOrders}টি সফল ডেলিভারি`}>
                <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                VIP ক্রেতা ({score.deliveredOrders}টি সফল)
            </span>
        );
    }

    if (score.riskLevel === "TRUSTED") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 border border-green-200" title={`${score.deliveredOrders}টি সফল ডেলিভারি`}>
                <ShieldCheck className="w-3 h-3 text-green-600" />
                বিশ্বস্ত ({score.deliveredOrders} সফল)
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            নতুন ক্রেতা
        </span>
    );
}

function AdminOrdersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    // Steadfast state
    const [balance, setBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [isSyncingAll, setIsSyncingAll] = useState(false);
    const [rowLoading, setRowLoading] = useState({}); // { [orderId]: 'dispatching' | 'syncing' }

    // Multi-select for bulk dispatch
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [isBulkDispatching, setIsBulkDispatching] = useState(false);

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

    useEffect(() => {
        fetchSteadfastBalance();
    }, []);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams({ status, search, page, limit: 20 });
            const res = await fetch(`/api/admin/orders?${query}`);
            const data = await res.json();
            if (data.ok) {
                setOrders(data.data);
                setPagination(data.pagination);
                setSelectedOrderIds([]);
            }
        } catch (error) {
            toast.error("Failed to load orders");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSteadfastBalance = async () => {
        setBalanceLoading(true);
        try {
            const res = await fetch("/api/admin/steadfast/balance");
            const data = await res.json();
            if (data.ok) {
                setBalance(data.currentBalance);
            }
        } catch {
            // Silently fail or keep previous
        } finally {
            setBalanceLoading(false);
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

    // Single order dispatch to Steadfast
    const handleDispatchSingle = async (orderId, orderNumber) => {
        if (!confirm(`Book Order #${orderNumber} to Steadfast Courier?`)) return;
        setRowLoading(prev => ({ ...prev, [orderId]: 'dispatching' }));
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/steadfast`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || `Booked! Tracking: ${data.trackingCode}`);
                fetchOrders();
                fetchSteadfastBalance();
            } else {
                toast.error(data.message || "Failed to book with Steadfast");
            }
        } catch (err) {
            toast.error("Network error during dispatch");
        } finally {
            setRowLoading(prev => ({ ...prev, [orderId]: null }));
        }
    };

    // Single order sync from Steadfast
    const handleSyncSingle = async (orderId) => {
        setRowLoading(prev => ({ ...prev, [orderId]: 'syncing' }));
        try {
            const res = await fetch(`/api/admin/orders/${orderId}/steadfast/sync`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || "Status synced with Steadfast");
                fetchOrders();
                fetchSteadfastBalance();
            } else {
                toast.error(data.message || "Sync failed");
            }
        } catch {
            toast.error("Network error during status sync");
        } finally {
            setRowLoading(prev => ({ ...prev, [orderId]: null }));
        }
    };

    // Sync all active shipped orders with Steadfast
    const handleSyncAllOrders = async () => {
        setIsSyncingAll(true);
        try {
            const res = await fetch("/api/admin/orders/steadfast/sync-all", {
                method: "POST"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || "Steadfast sync completed!");
                fetchOrders();
                fetchSteadfastBalance();
            } else {
                toast.error(data.message || "Sync all failed");
            }
        } catch {
            toast.error("Failed to connect to Steadfast sync service");
        } finally {
            setIsSyncingAll(false);
        }
    };

    // Bulk dispatch selected orders
    const handleBulkDispatch = async () => {
        if (selectedOrderIds.length === 0) return;
        if (!confirm(`Dispatch all ${selectedOrderIds.length} selected orders to Steadfast Courier?`)) return;

        setIsBulkDispatching(true);
        try {
            const res = await fetch("/api/admin/orders/steadfast/bulk-dispatch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderIds: selectedOrderIds })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || `Dispatched ${data.successful?.length || 0} orders!`);
                setSelectedOrderIds([]);
                fetchOrders();
                fetchSteadfastBalance();
            } else {
                toast.error(data.message || "Bulk dispatch failed");
            }
        } catch {
            toast.error("Error during bulk dispatch");
        } finally {
            setIsBulkDispatching(false);
        }
    };

    // Checkbox toggles
    const handleToggleSelectAll = () => {
        if (selectedOrderIds.length === orders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(orders.map(o => o.id));
        }
    };

    const handleToggleSelectRow = (id) => {
        setSelectedOrderIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <AdminShell title="Orders">
            {/* Steadfast Top Widget & Control Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Steadfast COD Balance Card */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-blue-200" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-200 font-medium">Steadfast COD ব্যালেন্স</p>
                            <h4 className="text-xl font-bold">
                                {balance !== null ? `৳${balance.toLocaleString()}` : "..."}
                            </h4>
                        </div>
                    </div>
                    <button
                        onClick={fetchSteadfastBalance}
                        disabled={balanceLoading}
                        title="রিলোড ব্যালেন্স"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-white ${balanceLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {/* Auto Status Sync Card */}
                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-gray-800">Steadfast লাইভ ট্র্যাকিং</h5>
                            <p className="text-xs text-gray-500">সব শিপমেন্টের স্ট্যাটাস অটো সিঙ্ক</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSyncAllOrders}
                        disabled={isSyncingAll}
                        className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? "animate-spin" : ""}`} />
                        {isSyncingAll ? "সিঙ্ক হচ্ছে..." : "Sync All Status"}
                    </button>
                </div>

                {/* Bulk Courier Dispatch Action */}
                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Send className="w-5 h-5" />
                        </div>
                        <div>
                            <h5 className="text-sm font-bold text-gray-800">বাল্ক কুরিয়ার বুকিং</h5>
                            <p className="text-xs text-gray-500">
                                {selectedOrderIds.length > 0 
                                    ? `${selectedOrderIds.length}টি অর্ডার সিলেক্ট করা হয়েছে`
                                    : "চেকবক্স দিয়ে একাধিক অর্ডার বুক করুন"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleBulkDispatch}
                        disabled={selectedOrderIds.length === 0 || isBulkDispatching}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isBulkDispatching ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> বুকিং হচ্ছে...
                            </>
                        ) : (
                            <>
                                <Truck className="w-3.5 h-3.5" /> Send {selectedOrderIds.length > 0 ? `(${selectedOrderIds.length})` : ""}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border flex flex-col min-h-[600px]">
                {/* Filters */}
                <div className="p-4 border-b space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {["ALL", "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "ABNORMAL"].map(s => (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${status === s
                                    ? "bg-gray-900 text-white shadow-sm"
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
                                className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/orders/create"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 whitespace-nowrap shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Create Manual Order
                            </Link>
                        </div>
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
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b text-xs">
                                <tr>
                                    <th className="px-4 py-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                                            onChange={handleToggleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3">Order #</th>
                                    <th className="px-6 py-3">Customer & Trust Score</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Steadfast Courier</th>
                                    <th className="px-4 py-3">Payment</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {orders.map(order => {
                                    const isRowSelected = selectedOrderIds.includes(order.id);
                                    const isDispatched = Boolean(order.trackingNumber);
                                    const isLoadingRow = rowLoading[order.id];

                                    return (
                                        <tr key={order.id} className={`hover:bg-gray-50 transition ${isRowSelected ? "bg-blue-50/40" : ""}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isRowSelected}
                                                    onChange={() => handleToggleSelectRow(order.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-blue-600">
                                                <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                                    {order.orderNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-semibold text-gray-900">{order.customerName}</div>
                                                <div className="text-xs text-gray-500 font-mono mb-1">{order.phone}</div>
                                                <CustomerTrustBadge score={order.customerScore} isAbnormal={order.isAbnormal} />
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusColors[order.status] || "bg-gray-100"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {isDispatched ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                                {order.trackingNumber}
                                                            </span>
                                                            <a
                                                                href={`https://steadfast.com.bd/t/${order.trackingNumber}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-400 hover:text-blue-600"
                                                                title="Track on Steadfast"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                            <button
                                                                onClick={() => handleSyncSingle(order.id)}
                                                                disabled={Boolean(isLoadingRow)}
                                                                className="text-gray-400 hover:text-green-600 transition p-0.5"
                                                                title="Sync Status from Steadfast"
                                                            >
                                                                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRow === 'syncing' ? 'animate-spin text-green-600' : ''}`} />
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500">Steadfast Courier</p>
                                                    </div>
                                                ) : (
                                                    order.status !== "CANCELLED" && (
                                                        <button
                                                            onClick={() => handleDispatchSingle(order.id, order.orderNumber)}
                                                            disabled={Boolean(isLoadingRow)}
                                                            className="inline-flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded text-xs font-semibold transition"
                                                        >
                                                            {isLoadingRow === 'dispatching' ? (
                                                                <>
                                                                    <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Truck className="w-3 h-3" /> Steadfast-এ পাঠান
                                                                </>
                                                            )}
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs font-bold">{order.paymentMethod}</div>
                                                <span className={`text-xs ${order.paymentStatus === "PAID" ? "text-green-600 font-semibold" : "text-orange-500"}`}>
                                                    {order.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                ৳{order.total}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition text-xs font-medium shadow-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
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
