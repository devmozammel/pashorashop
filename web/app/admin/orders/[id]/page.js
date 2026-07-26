"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ArrowLeft, Package, User, MapPin, Truck, CreditCard, Clock, MessageSquare, Loader2, Save } from "lucide-react";
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
                toast.success(`Order booked with Steadfast Courier! Tracking: ${data.trackingCode || ""}`);
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
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
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

    return (
        <AdminShell title={`Order #${order.orderNumber}`}>
            <div className="mb-6">
                <Link href="/admin/orders" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Orders
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Center: Details */}
                    <div className="lg:col-span-2 space-y-6">

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
                                                        {item.product.images && item.product.images[0] ? (
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
                                    Customer
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <p><span className="text-gray-500 block text-xs">Name</span> {order.customerName}</p>
                                    <p><span className="text-gray-500 block text-xs">Phone</span> {order.phone}</p>
                                    <p><span className="text-gray-500 block text-xs">Email</span> {order.user?.email || "Guest Checkout"}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    Shipping Address
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <p>{order.address}</p>
                                    <p>{order.city}</p>
                                    <p className="mt-2 text-xs text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">
                                        {order.deliveryArea || "Area not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & History */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Order Status</h3>
                            <div className="mb-4">
                                <span className={`inline-block w-full text-center py-2 rounded-lg font-bold ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {statusOptions.map(s => (
                                    <button
                                        key={s}
                                        disabled={statusLoading || order.status === s}
                                        onClick={() => handleStatusUpdate(s)}
                                        className={`px-3 py-2 text-xs rounded border transition ${order.status === s
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

                        {/* Courier Dispatch Card */}
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-500" />
                                Courier & Dispatch
                            </h3>

                            {order.trackingNumber ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Courier:</span>
                                        <span className="font-semibold text-gray-800">{order.courierName || "Unspecified"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Tracking Code:</span>
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {order.trackingNumber}
                                        </span>
                                    </div>
                                    {order.courierName?.toLowerCase() === "steadfast" && (
                                        <a
                                            href={`https://steadfast.com.bd/t/${order.trackingNumber}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full inline-block text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-2 rounded font-bold transition"
                                        >
                                            Track on Steadfast
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500">
                                        Book this order directly to Steadfast Courier. The status will automatically update to SHIPPED.{" "}
                                        <Link href="/admin/shipping" className="text-blue-600 font-semibold underline hover:text-blue-800">
                                            Shipping Settings
                                        </Link>
                                    </p>
                                    <button
                                        onClick={handleSteadfastDispatch}
                                        disabled={dispatchLoading || order.status === "CANCELLED"}
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-xs py-2.5 rounded font-bold hover:bg-green-700 disabled:opacity-50 transition"
                                    >
                                        {dispatchLoading ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="w-3.5 h-3.5" /> Send to Steadfast Courier
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                Timeline
                            </h3>

                            <div className="max-h-60 overflow-y-auto space-y-4 mb-4 pr-1">
                                {order.history.map(item => (
                                    <div key={item.id} className="relative pl-4 border-l-2 border-gray-100 pb-2 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-300"></div>
                                        <p className="text-xs text-gray-500 mb-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                                        <p className="text-sm font-medium text-gray-800">{item.status}</p>
                                        {item.note && <p className="text-xs text-gray-600 mt-1 italic">"{item.note}"</p>}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddNote} className="pt-4 border-t">
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add a note..."
                                    className="w-full text-sm p-2 border rounded mb-2"
                                />
                                <button
                                    type="submit"
                                    disabled={noteLoading || !note.trim()}
                                    className="w-full bg-gray-900 text-white text-xs py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Add Note
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
