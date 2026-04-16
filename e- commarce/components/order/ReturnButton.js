"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReturnButton({ orderId }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReturn = async () => {
        const reason = prompt("Please enter a reason for return:");
        if (!reason) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/return`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason })
            });

            if (res.ok) {
                alert("Return request submitted successfully.");
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to submit return request");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleReturn}
            disabled={loading}
            className="text-sm font-medium text-red-600 hover:text-red-700 underline disabled:opacity-50"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Return"}
        </button>
    );
}
