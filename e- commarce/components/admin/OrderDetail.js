/* path: components/admin/OrderDetail.js */
"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Truck, ShieldAlert, CheckCircle, Ban, XCircle, UserX } from "lucide-react";

export default function OrderDetail({ order }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Parse addresses if they are JSON strings (database quirk handling) or objects
    const shipping = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress || {};

    const billing = typeof order.billingAddress === 'string'
        ? JSON.parse(order.billingAddress)
        : order.billingAddress || {};

    const handleAction = async (action, payload = {}) => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')}?`)) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...payload })
            });

            if (!res.ok) throw new Error("Action failed");

            router.refresh(); // Refresh server data
        } catch (error) {
            alert("Error performing action: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: Order Details & Items */}
            <div className="lg:col-span-2 space-y-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                        <p className="text-sm text-gray-500">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${order.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                order.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                            {order.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                            {order.paymentStatus}
                        </span>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Items ({order.items.length})</h3>
                    </div>
                    <div className="divide-y">
                        {order.items.map((item) => (
                            <div key={item.id} className="p-4 flex gap-4 items-center">
                                <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                                    {item.product?.images?.[0] ? (
                                        <Image
                                            src={item.product?.images?.[0]}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                    <div className="text-sm text-gray-500">
                                        {item.metadata?.variantName && (
                                            <span>{item.metadata.variantName}: {item.metadata.variantValue}</span>
                                        )}
                                        <span className="mx-2">&bull;</span>
                                        SKU: {item.product?.sku || 'N/A'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">{formatPrice(item.unitPrice)} x {item.quantity}</p>
                                    <p className="font-bold text-gray-900">{formatPrice(item.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-gray-50 p-6 border-t space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium">{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span className="font-medium">{formatPrice(order.shippingCost)}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-200 text-base">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-gray-900 text-lg">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Customer, Addresses, Risk, Actions */}
            <div className="space-y-6">

                {/* Actions Card */}
                <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Actions</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {order.status === 'PENDING' && (
                            <Button
                                onClick={() => handleAction("MARK_CONFIRMED")}
                                disabled={isLoading}
                                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Confirmed
                            </Button>
                        )}
                        {order.status !== 'CANCELLED' && (
                            <Button
                                onClick={() => handleAction("CANCEL_ORDER")}
                                disabled={isLoading}
                                variant="destructive"
                                className="w-full justify-start"
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Cancel Order
                            </Button>
                        )}

                        <div className="h-px bg-gray-100 my-2" />

                        <Button
                            onClick={() => handleAction("BLOCK_PHONE", { phone: order.customerPhone })}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <Ban className="w-4 h-4 mr-2" /> Block Phone
                        </Button>
                        <Button
                            onClick={() => handleAction("BLOCK_IP", { ip: order.ipAddress })}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <UserX className="w-4 h-4 mr-2" /> Block IP
                        </Button>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Customer</h3>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="block text-gray-500 text-xs uppercase tracking-wide">Name</span>
                            <span className="font-medium">{order.customerName}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase tracking-wide">Email</span>
                            <span className="font-medium break-all">{order.customerEmail || "N/A"}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs uppercase tracking-wide">Phone</span>
                            <span className="font-medium">{order.customerPhone}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center">
                        <Truck className="w-4 h-4 mr-2" /> Shipping Address
                    </h3>
                    <div className="text-sm space-y-1">
                        <p>{shipping.street}</p>
                        <p>{shipping.city} {shipping.zip && `, ${shipping.zip}`}</p>
                        <p>{shipping.country}</p>
                    </div>
                </div>

                {/* Fraud / Risk Analysis (Conditional) */}
                {(order.riskScore || order.riskLevel) && (
                    <div className="bg-red-50 p-6 rounded-lg border border-red-100 shadow-sm">
                        <h3 className="font-semibold text-red-800 mb-4 border-b border-red-200 pb-2 flex items-center">
                            <ShieldAlert className="w-4 h-4 mr-2" /> High Risk Detected
                        </h3>
                        <div className="space-y-2 text-sm text-red-700">
                            <div className="flex justify-between">
                                <span>Risk Score:</span>
                                <span className="font-bold">{order.riskScore}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Risk Level:</span>
                                <span className="font-bold">{order.riskLevel}</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
