"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { 
    ArrowLeft, Package, User, MapPin, Truck, CreditCard, Clock, 
    MessageSquare, Loader2, Save, RefreshCw, ExternalLink, ShieldAlert, 
    ShieldCheck, Star, AlertTriangle, Ban, CheckCircle 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

const statusOptions = [
    "PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"
];

export default function OrderDetailsPage({ params }) {
    const { id } = params;
    const router = useRouter();

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [note, setNote] = useState("");
    const [noteLoading, setNoteLoading] = useState(false);
    const [dispatchLoading, setDispatchLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [blacklistLoading, setBlacklistLoading] = useState(false);
    const [fraudCheckLoading, setFraudCheckLoading] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`);
            const data = await res.json();
            if (data.ok) {
                setOrder(data.data);
            } else {
                toast.error(data.message);
                router.push("/admin/orders");
            }
        } catch (error) {
            toast.error("Failed to load order");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSteadfastDispatch = async () => {
        if (!confirm("Are you sure you want to book/dispatch this order with Steadfast Courier?")) return;
        setDispatchLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}/steadfast`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || `Order booked with Steadfast! Tracking: ${data.trackingCode || ""}`);
                fetchOrder();
            } else {
                if (data.message && (data.message.includes("Shipping settings") || data.message.includes("not configured"))) {
                    toast.error(data.message, {
                        action: {
                            label: "Configure",
                            onClick: () => router.push("/admin/shipping")
                        }
                    });
                } else {
                    toast.error(data.message || "Failed to book with Steadfast");
                }
            }
        } catch (error) {
            toast.error("An error occurred during dispatch");
        } finally {
            setDispatchLoading(false);
        }
    };

    const handleSteadfastSync = async () => {
        setSyncLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}/steadfast/sync`, {
                method: "POST"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message || "Status synced with Steadfast!");
                fetchOrder();
            } else {
                toast.error(data.message || "Failed to sync status");
            }
        } catch (error) {
            toast.error("Network error during status sync");
        } finally {
            setSyncLoading(false);
        }
    };

    
    const handleRefreshSteadfastFraud = async () => {
        if (!order?.phone) return;
        setFraudCheckLoading(true);
        try {
            const res = await fetch(`/api/admin/steadfast/fraud-check?phone=${encodeURIComponent(order.phone)}`);
            const data = await res.json();
            if (data.ok) {
                toast.success("Steadfast লাইভ ফ্রড ডেটা আপডেট হয়েছে");
                setOrder(prev => ({ ...prev, steadfastFraud: data }));
            } else {
                toast.error(data.message || "Steadfast থেকে ডেটা পাওয়া যায়নি");
            }
        } catch {
            toast.error("Steadfast চেক করতে সমস্যা হয়েছে");
        } finally {
            setFraudCheckLoading(false);
        }
    };

    const handleToggleBlacklist = async () => {
        if (!order?.phone) return;
        const isCurrentlyBlocked = order.customerScore?.isBlacklisted;
        const confirmMsg = isCurrentlyBlocked
            ? `Remove ${order.phone} from the Blacklist?`
            : `Add ${order.phone} to Blacklist? This will flag future orders as fraud.`;

        if (!confirm(confirmMsg)) return;

        setBlacklistLoading(true);
        try {
            const res = await fetch("/api/admin/blacklist/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: order.phone,
                    reason: `Marked from Order #${order.orderNumber}`
                })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(data.message);
                fetchOrder();
            } else {
                toast.error(data.message || "Blacklist action failed");
            }
        } catch {
            toast.error("Network error during blacklist action");
        } finally {
            setBlacklistLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!confirm(`Change order status to ${newStatus}?`)) return;
        setStatusLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success(`Status updated to ${newStatus}`);
                fetchOrder();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        setNoteLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${id}/timeline`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ note }),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Note added");
                setNote("");
                fetchOrder();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to add note");
        } finally {
            setNoteLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PACKED': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Loading...">
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </AdminShell>
        );
    }

    if (!order) return null;

    const score = order.customerScore;

    return (
        <AdminShell title={`Order #${order.orderNumber}`}>
            <div className="mb-6">
                <Link href="/admin/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4 text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Orders
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Center: Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Customer Fraud & Trust Assessment Card */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-gray-800">কাস্টমার ভেরিফিকেশন ও ট্রাস্ট রেটিং (Fraud Detection)</h3>
                                </div>
                                {score && (
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <Star
                                                key={s}
                                                className={`w-4 h-4 ${
                                                    s <= (score.stars || 0)
                                                        ? "text-amber-400 fill-amber-400"
                                                        : "text-gray-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                {score ? (
                                    <div className="space-y-4">
                                        {/* Status Alert Banner */}
                                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                                            score.isBlacklisted
                                                ? "bg-red-50 border-red-200 text-red-900"
                                                : score.riskLevel === "HIGH_RISK"
                                                ? "bg-amber-50 border-amber-200 text-amber-900"
                                                : score.riskLevel === "VIP" || score.riskLevel === "TRUSTED"
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                                                : "bg-blue-50 border-blue-200 text-blue-900"
                                        }`}>
                                            {score.isBlacklisted || score.riskLevel === "HIGH_RISK" ? (
                                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h4 className="font-bold text-sm">{score.badgeText}</h4>
                                                    <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-white/80 border">
                                                        {score.phone}
                                                    </span>
                                                </div>
                                                <p className="text-xs mt-1 leading-relaxed opacity-90">
                                                    {score.recommendation}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-gray-50 rounded-lg p-3 border">
                                                <span className="text-xs text-gray-500 block">মোট অর্ডার</span>
                                                <span className="text-lg font-bold text-gray-900">{score.totalOrders}টি</span>
                                            </div>
                                            <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-100">
                                                <span className="text-xs text-emerald-700 block">সফল ডেলিভারি</span>
                                                <span className="text-lg font-bold text-emerald-800">{score.deliveredOrders}টি</span>
                                            </div>
                                            <div className="bg-red-50/60 rounded-lg p-3 border border-red-100">
                                                <span className="text-xs text-red-700 block">বাতিল / রিটার্ন</span>
                                                <span className="text-lg font-bold text-red-800">{score.cancelledOrders}টি</span>
                                            </div>
                                            <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-100">
                                                <span className="text-xs text-blue-700 block">সফল ডেলিভারি হার</span>
                                                <span className="text-lg font-bold text-blue-800">{score.successRate}%</span>
                                            </div>
                                        </div>

                                        {/* Quick Blacklist Action */}
                                        <div className="pt-2 flex justify-end">
                                            <button
                                                onClick={handleToggleBlacklist}
                                                disabled={blacklistLoading}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                                                    score.isBlacklisted
                                                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                                                        : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                                }`}
                                            >
                                                {blacklistLoading ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Ban className="w-3.5 h-3.5" />
                                                )}
                                                {score.isBlacklisted ? "কাস্টমার আনব্লক করুন (Remove from Blacklist)" : "কাস্টমার ব্লক করুন (Add to Blacklist)"}
                                            </button>
                                        </div>

                                        {/* Steadfast Courier Live Fraud & Delivery Ratio Section */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                                                        ST
                                                    </span>
                                                    <div>
                                                        <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                                                            Steadfast কুরিয়ার লাইভ হিস্টোরি ও ফ্রড চেক
                                                            <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                                অফিসিয়াল API
                                                            </span>
                                                        </h5>
                                                        <p className="text-[11px] text-gray-500">
                                                            পুরো বাংলাদেশে Steadfast দিয়ে এই নম্বরের মোট ডেলিভারি ও রিটার্ন রেকর্ড
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleRefreshSteadfastFraud}
                                                    disabled={fraudCheckLoading}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-200"
                                                    title="Steadfast API থেকে লাইভ ডেটা রিফ্রেশ করুন"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${fraudCheckLoading ? "animate-spin" : ""}`} />
                                                    {fraudCheckLoading ? "চেক হচ্ছে..." : "লাইভ চেক"}
                                                </button>
                                            </div>

                                            {order.steadfastFraud?.ok ? (
                                                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                        <div className="bg-white p-2.5 rounded-lg border shadow-xs">
                                                            <span className="text-[11px] text-gray-500 block">Steadfast ডেলিভারি রেট</span>
                                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                                <span className={`text-lg font-black ${
                                                                    (order.steadfastFraud.deliveryRatio ?? 0) >= 80 ? "text-emerald-600" :
                                                                    (order.steadfastFraud.deliveryRatio ?? 0) >= 50 ? "text-amber-600" : "text-rose-600"
                                                                }`}>
                                                                    {order.steadfastFraud.deliveryRatio !== null ? `${order.steadfastFraud.deliveryRatio}%` : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-2.5 rounded-lg border shadow-xs">
                                                            <span className="text-[11px] text-gray-500 block">Steadfast রিটার্ন রেট</span>
                                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                                <span className={`text-lg font-black ${
                                                                    (order.steadfastFraud.returnRatio ?? 0) > 40 ? "text-rose-600" :
                                                                    (order.steadfastFraud.returnRatio ?? 0) > 15 ? "text-amber-600" : "text-emerald-600"
                                                                }`}>
                                                                    {order.steadfastFraud.returnRatio !== null ? `${order.steadfastFraud.returnRatio}%` : "0%"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-2.5 rounded-lg border shadow-xs">
                                                            <span className="text-[11px] text-gray-500 block">অন্যান্য মার্চেন্ট রিপোর্ট</span>
                                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                                <span className={`text-lg font-black ${
                                                                    order.steadfastFraud.totalReports > 0 ? "text-rose-600" : "text-emerald-600"
                                                                }`}>
                                                                    {order.steadfastFraud.totalReports}টি
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white p-2.5 rounded-lg border shadow-xs">
                                                            <span className="text-[11px] text-gray-500 block">মোট কুরিয়ার পার্সেল</span>
                                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                                <span className="text-lg font-black text-gray-800">
                                                                    {order.steadfastFraud.volumeRange || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delivery Progress Bar */}
                                                    {order.steadfastFraud.deliveryRatio !== null && (
                                                        <div>
                                                            <div className="flex justify-between text-[11px] font-medium text-gray-600 mb-1">
                                                                <span>সাকসেস ডেলিভারি: {order.steadfastFraud.deliveryRatio}%</span>
                                                                <span>ক্যানসেল/রিটার্ন: {order.steadfastFraud.returnRatio}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                                                                <div 
                                                                    className="bg-emerald-500 h-full transition-all duration-500" 
                                                                    style={{ width: `${order.steadfastFraud.deliveryRatio}%` }}
                                                                />
                                                                <div 
                                                                    className="bg-rose-500 h-full transition-all duration-500" 
                                                                    style={{ width: `${order.steadfastFraud.returnRatio}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Fraud categories breakdown if any */}
                                                    {order.steadfastFraud.totalReports > 0 && Object.keys(order.steadfastFraud.fraudCategories || {}).length > 0 && (
                                                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                                                            <span className="font-bold block mb-1">রিপোর্টের কারণসমূহ (মার্চেন্টদের অভিযোগ):</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {Object.entries(order.steadfastFraud.fraudCategories).map(([key, count]) => (
                                                                    <span key={key} className="px-2 py-0.5 bg-white border border-rose-200 rounded text-[11px] font-medium">
                                                                        {key.replace(/_/g, " ")}: {count} বার
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-500 flex items-center justify-between">
                                                    <span>Steadfast API থেকে কুরিয়ার হিস্টোরি ডেটা সরাসরি দেখা যাবে।</span>
                                                    <button
                                                        onClick={handleRefreshSteadfastFraud}
                                                        disabled={fraudCheckLoading}
                                                        className="text-indigo-600 hover:underline font-semibold"
                                                    >
                                                        এখনই চেক করুন
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">কোনো হিস্টোরি ডেটা লোড করা যায়নি।</p>
                                )}
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <h3 className="font-bold text-gray-800">Order Items</h3>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b">
                                        <tr>
                                            <th className="px-6 py-3">Product</th>
                                            <th className="px-6 py-3 text-right">Unit Price</th>
                                            <th className="px-6 py-3 text-center">Qty</th>
                                            <th className="px-6 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {order.items.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded border overflow-hidden flex-shrink-0">
                                                        {item.product?.images && item.product.images[0] ? (
                                                            <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        {item.variantId && <p className="text-xs text-gray-500">Variant: {item.variantId}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">{formatPrice(item.unitPrice)}</td>
                                                <td className="px-6 py-4 text-center">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right font-medium">{formatPrice(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t font-medium">
                                        <tr>
                                            <td colSpan="3" className="px-6 py-3 text-right">Subtotal</td>
                                            <td className="px-6 py-3 text-right">{formatPrice(order.subtotal)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="px-6 py-3 text-right text-red-600">Discount {order.couponCode && `(${order.couponCode})`}</td>
                                            <td className="px-6 py-3 text-right text-red-600">-{formatPrice(order.discount)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="px-6 py-3 text-right">Delivery Fee</td>
                                            <td className="px-6 py-3 text-right">{formatPrice(order.deliveryFee)}</td>
                                        </tr>
                                        <tr className="text-base border-t border-gray-200">
                                            <td colSpan="3" className="px-6 py-4 text-right font-bold">Total</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600">{formatPrice(order.total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Customer & Shipping Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-500" />
                                    Customer Info
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <p><span className="text-gray-500 block text-xs">Name</span> {order.customerName}</p>
                                    <p><span className="text-gray-500 block text-xs">Phone</span> <span className="font-mono">{order.phone}</span></p>
                                    <p><span className="text-gray-500 block text-xs">Email</span> {order.user?.email || "Guest Checkout"}</p>
                                    {order.customerNote && (
                                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                                            <span className="font-bold block mb-1">Customer Note:</span>
                                            {order.customerNote}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    Shipping Address
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium text-gray-900">{order.address}</p>
                                    {order.city && <p className="text-gray-600">{order.city}</p>}
                                    <p className="mt-2 text-xs text-gray-600 bg-gray-100 inline-block px-2.5 py-1 rounded font-medium">
                                        Area: {order.deliveryArea || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions, Steadfast & History */}
                    <div className="space-y-6">
                        {/* Order Status Card */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Order Status</h3>
                            <div className="mb-4">
                                <span className={`inline-block w-full text-center py-2.5 rounded-lg font-bold border ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {statusOptions.map(s => (
                                    <button
                                        key={s}
                                        disabled={statusLoading || order.status === s}
                                        onClick={() => handleStatusUpdate(s)}
                                        className={`px-3 py-2 text-xs rounded border transition font-medium ${order.status === s
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent"
                                            : "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 bg-white"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <button
                                    onClick={async () => {
                                        if (!confirm(`Mark this order as ${order.isAbnormal ? "NORMAL" : "ABNORMAL"}?`)) return;
                                        try {
                                            const res = await fetch(`/api/admin/orders/${order.id}/abnormal`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ isAbnormal: !order.isAbnormal }),
                                            });
                                            const data = await res.json();
                                            if (data.ok) {
                                                toast.success(order.isAbnormal ? "Marked as Normal" : "Marked as Abnormal");
                                                fetchOrder();
                                            }
                                        } catch (e) {
                                            toast.error("Action failed");
                                        }
                                    }}
                                    className={`w-full py-2 rounded-lg text-xs font-bold border transition ${order.isAbnormal
                                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                        : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                        }`}
                                >
                                    {order.isAbnormal ? "Move to Regular Orders" : "Mark as Abnormal Order"}
                                </button>
                            </div>
                        </div>

                        {/* Steadfast Courier Dispatch & Tracking Card */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    Steadfast Courier
                                </h3>
                                {order.trackingNumber && (
                                    <button
                                        onClick={handleSteadfastSync}
                                        disabled={syncLoading}
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold disabled:opacity-50"
                                        title="Sync Live Status from Steadfast"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                                        Sync Status
                                    </button>
                                )}
                            </div>

                            {order.trackingNumber ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Courier Provider:</span>
                                            <span className="font-bold text-gray-900">{order.courierName || "Steadfast"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-600">Tracking Code:</span>
                                            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                                                {order.trackingNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={`https://steadfast.com.bd/t/${order.trackingNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2.5 rounded-lg font-bold transition shadow-sm"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Track on Steadfast
                                        </a>
                                        <button
                                            onClick={handleSteadfastSync}
                                            disabled={syncLoading}
                                            className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                            title="Sync status"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        এই অর্ডারটি ১-ক্লিকে সরাসরি Steadfast Courier-এ বুক করুন। বুকিং সফল হলে অর্ডার স্ট্যাটাস স্বয়ংক্রিয়ভাবে <strong>SHIPPED</strong> হয়ে যাবে এবং ট্র্যাকিং কোড জেনারেট হবে।
                                    </p>
                                    <button
                                        onClick={handleSteadfastDispatch}
                                        disabled={dispatchLoading || order.status === "CANCELLED"}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                                    >
                                        {dispatchLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" /> Steadfast-এ বুকিং হচ্ছে...
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="w-4 h-4" /> Send to Steadfast Courier
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Order Timeline Card */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                Order Timeline
                            </h3>

                            <div className="max-h-60 overflow-y-auto space-y-4 mb-4 pr-1">
                                {order.history.map(item => (
                                    <div key={item.id} className="relative pl-4 border-l-2 border-gray-100 pb-2 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                                        <p className="text-[11px] text-gray-500 mb-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                                        <p className="text-xs font-bold text-gray-800">{item.status}</p>
                                        {item.note && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed bg-gray-50 p-1.5 rounded">"{item.note}"</p>}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddNote} className="pt-4 border-t">
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="অর্ডারে কোনো নোট যোগ করুন..."
                                    className="w-full text-xs p-2.5 border rounded-lg mb-2 focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    type="submit"
                                    disabled={noteLoading || !note.trim()}
                                    className="w-full bg-gray-900 text-white text-xs py-2 rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                                >
                                    {noteLoading ? "Saving..." : "Add Note"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
