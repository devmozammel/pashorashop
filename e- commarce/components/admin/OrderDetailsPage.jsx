"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Select, Badge } from "@/components/admin/ui/FormElements";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OrderDetailsPage({ params }) {
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrder = async () => {
        if (!params?.id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${params.id}`);
            const json = await res.json();
            if (json.ok) {
                setOrder(json.data);
            } else {
                toast.error(json.message || "Failed to load order");
            }
        } catch (error) {
            toast.error("An error occurred while loading order");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [params]);

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!order) return <div className="p-8 text-center">Order not found</div>;

    const handleStatusChange = async (newStatus) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const json = await res.json();
            if (json.ok) {
                setOrder(prev => ({ ...prev, status: newStatus }));
                toast.success(`Order status updated to ${newStatus}`);
            } else {
                toast.error(json.message || "Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <AdminShell
            title={`Order #${order.id}`}
            actions={<Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Order Items</h3>
                        <div className="space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-gray-900">{item.product?.name || "Deleted Product"}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity || item.qty}</p>
                                    </div>
                                    <p className="font-bold">{formatPrice(item.price * item.qty)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-xl">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-lg">Customer</h3>
                        <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-600">{order.phone}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Delivery Area</p>
                            <p className="text-sm font-medium">{order.deliveryArea}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-lg">Status</h3>
                        <Select
                            value={order.status}
                            onChange={e => handleStatusChange(e.target.value)}
                            disabled={isUpdating}
                            options={[
                                { value: "PENDING", label: "Pending" },
                                { value: "CONFIRMED", label: "Confirmed" },
                                { value: "SHIPPED", label: "Shipped" },
                                { value: "DELIVERED", label: "Delivered" },
                                { value: "CANCELLED", label: "Cancelled" }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
