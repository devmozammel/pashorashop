"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusSelect({ orderId, currentStatus }) {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus);
    const [loading, setLoading] = useState(false);

    const handleChange = async (e) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        setLoading(true);

        try {
            const res = await fetch("/api/admin/orders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: orderId, status: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update status");

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <select
            value={status}
            onChange={handleChange}
            disabled={loading}
            className="p-2 border rounded-md text-sm font-medium bg-white shadow-sm"
        >
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURN_REQUESTED">Return Requested</option>
            <option value="RETURNED">Returned</option>
        </select>
    );
}
