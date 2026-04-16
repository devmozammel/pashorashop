"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Badge } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ReturnsPage() {
    const [returns, setReturns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReturns = async () => {
        try {
            const res = await fetch("/api/admin/returns");
            const data = await res.json();
            if (Array.isArray(data)) {
                setReturns(data);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to fetch returns");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/admin/returns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Return request ${status.toLowerCase()}`);
                fetchReturns();
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const columns = [
        { header: "Return ID", accessor: "id" },
        {
            header: "Order #",
            cell: (row) => row.order?.orderNumber ? (
                <Link href={`/admin/orders/${row.orderId}`} className="text-blue-600 hover:underline">
                    {row.order.orderNumber}
                </Link>
            ) : row.orderId
        },
        { header: "Reason", accessor: "reason" },
        { header: "Status", cell: (row) => <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'}>{row.status}</Badge> },
        {
            header: "Actions",
            cell: (row) => row.status === 'PENDING' && (
                <div className="flex gap-2">
                    <Button size="sm" variant="success" className="bg-green-600 text-white" onClick={() => updateStatus(row.id, 'APPROVED')}>Approve</Button>
                    <Button size="sm" variant="danger" className="bg-red-600 text-white" onClick={() => updateStatus(row.id, 'REJECTED')}>Reject</Button>
                </div>
            )
        }
    ];

    return (
        <AdminShell title="Returns Management">
            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable columns={columns} data={returns} searchKey="reason" />
            )}
        </AdminShell>
    );
}
