"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Badge } from "@/components/admin/ui/FormElements";
import { Star, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReviews = async () => {
        try {
            const res = await fetch("/api/admin/reviews");
            const data = await res.json();
            if (Array.isArray(data)) {
                setReviews(data);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to fetch reviews");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const toggleApprove = async (id, currentVal) => {
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isApproved: !currentVal })
            });
            if (res.ok) {
                toast.success("Review status updated");
                fetchReviews();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete review?")) return;
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Review deleted");
                fetchReviews();
            } else {
                toast.error("Failed to delete review");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const columns = [
        { header: "Product", cell: (row) => row.product?.name || "Unknown Product" },
        { header: "User", cell: (row) => row.user?.name || "Anonymous" },
        {
            header: "Rating",
            cell: (row) => (
                <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < row.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                </div>
            )
        },
        { header: "Comment", accessor: "comment" },
        { header: "Status", cell: (row) => <Badge variant={row.isApproved ? 'success' : 'warning'}>{row.isApproved ? 'Approved' : 'Pending'}</Badge> },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toggleApprove(row.id, row.isApproved)}>
                        {row.isApproved ? "Hide" : "Approve"}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id)}>
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AdminShell title="Reviews Moderation">
            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable columns={columns} data={reviews} searchKey="comment" />
            )}
        </AdminShell>
    );
}
