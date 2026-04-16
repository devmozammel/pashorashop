/* path: components/admin/OrderList.js */
"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils"; // Assuming you have this helper
import { Button } from "@/components/ui/Button"; // Assuming existing UI button

export default function OrderList({ orders }) {
    if (!orders || orders.length === 0) {
        return <div className="p-8 text-center text-gray-500">No orders found.</div>;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return "bg-yellow-100 text-yellow-800";
            case "CONFIRMED": return "bg-blue-100 text-blue-800";
            case "SHIPPED": return "bg-purple-100 text-purple-800";
            case "DELIVERED": return "bg-green-100 text-green-800";
            case "CANCELLED": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-700">Order #</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Customer</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Status</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Total</th>
                            <th className="px-6 py-3 font-medium text-gray-700">Date</th>
                            <th className="px-6 py-3 font-medium text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {order.orderNumber}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900">{order.customerName || "Guest"}</span>
                                        <span className="text-xs text-gray-500">{order.customerEmail || order.customerPhone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium">
                                    {formatPrice(order.total)}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/admin/orders/${order.id}`}>
                                        <Button size="sm" variant="outline">View</Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
