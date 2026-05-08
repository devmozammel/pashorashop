"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Use useParams instead of props for client component
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { requireUserClient } from "@/lib/userSession";
import { ArrowLeft, Package, MapPin, CreditCard, Loader2, AlertCircle, CornerDownLeft, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const { user, status } = requireUserClient();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Return Request State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnReason, setReturnReason] = useState("");
    const [returnNotes, setReturnNotes] = useState("");
    const [isReturning, setIsReturning] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            if (!user || !id) return;

            // Real User API
            try {
                const res = await fetch(`/api/my-orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrder(data);
                } else {
                    const err = await res.json();
                    setError(err.error || "Failed to fetch order");
                }
            } catch (err) {
                console.error("Error fetching order:", err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated") {
            fetchOrder();
        }
    }, [user, status, id]);

    const handleRequestReturn = async (e) => {
        e.preventDefault();
        if (!returnReason) {
            toast.error("Please select a reason for the return");
            return;
        }

        setIsReturning(true);
        try {
            const res = await fetch("/api/user/returns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    reason: returnReason,
                    notes: returnNotes
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Return request submitted successfully");
                setIsReturnModalOpen(false);
                // Optionally update local order state to show a return is pending
                // If you had a returnStatus field on the order, you'd update it here
            } else {
                toast.error(data.error || "Failed to submit return request");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsReturning(false);
        }
    };

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
    }

    if (error || !order) {
        return (
            <div className="container py-20 px-4 text-center">
                <div className="bg-red-50 rounded-lg p-10 border border-red-100 inline-block">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Order Not Found</h2>
                    <p className="text-red-700 mb-6">{error || "We couldn't locate this order."}</p>
                    <Link href="/my-orders" className="text-sm font-medium text-red-700 hover:text-red-800 underline">
                        Back to My Orders
                    </Link>
                </div>
            </div>
        );
    }

    // Safe address access
    const address = order.shippingAddress || {};

    return (
        <div className="container py-10 px-4 max-w-3xl mx-auto">
            <Link href="/my-orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Orders
            </Link>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">Order #{order.orderNumber || order.id?.slice(0, 8).toUpperCase()}</h1>
                        <p className="text-sm text-muted-foreground mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center self-start md:self-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status}
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-white border-b flex justify-between items-center">
                    <div>
                        {/* You could check order.returns array if it was included in the API response */}
                    </div>
                    {order.status === "DELIVERED" && (
                        <Button onClick={() => setIsReturnModalOpen(true)} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 gap-2">
                            <CornerDownLeft className="w-4 h-4" /> Request Return
                        </Button>
                    )}
                </div>

                <div className="p-6 space-y-8">
                    {/* Items */}
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-500" /> Items
                        </h3>
                        <div className="space-y-4">
                            {order.items?.map(item => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        {item.variantId && <p className="text-xs text-muted-foreground">Variant: {item.variantId}</p>}
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
                                    </div>
                                    <p className="font-bold">{formatPrice(item.total)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Shipping */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-500" /> Shipping Address
                            </h3>
                            <address className="not-italic text-sm text-gray-600 leading-relaxed">
                                <span className="font-medium text-gray-900">{address.name}</span><br />
                                {address.phone}<br />
                                {address.street}<br />
                                {address.city}, {address.area}
                            </address>
                        </div>

                        {/* Summary */}
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-500" /> Payment & Total
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Delivery Fee</span>
                                    <span>{formatPrice(order.deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 mt-2">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-lg">{formatPrice(order.total)}</span>
                                </div>
                                <div className="pt-2 text-xs text-muted-foreground">
                                    Method: {order.paymentMethod} ({order.paymentStatus})
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Request Modal */}
            {isReturnModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <CornerDownLeft className="w-5 h-5 text-red-500" />
                                Request a Return
                            </h3>
                            <button onClick={() => setIsReturnModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestReturn} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return *</label>
                                <select
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    <option value="DEFECTIVE">Product is defective / damaged</option>
                                    <option value="WRONG_ITEM">Received the wrong item</option>
                                    <option value="NOT_AS_DESCRIBED">Item not as described</option>
                                    <option value="CHANGED_MIND">Changed my mind</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                                <textarea
                                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    rows="3"
                                    placeholder="Please provide any extra details..."
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isReturning} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                                    {isReturning ? "Submitting..." : "Submit Return Request"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
