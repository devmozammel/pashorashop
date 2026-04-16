"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Loader2, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";

export default function BlacklistPage() {
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [ip, setIp] = useState("");
    const [phone, setPhone] = useState("");
    const [reason, setReason] = useState("");

    const fetchEntries = async () => {
        try {
            const res = await fetch("/api/admin/blacklist");
            const data = await res.json();
            if (res.ok) {
                setEntries(data);
            } else {
                toast.error(data.error || "Failed to load blacklist");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!ip.trim() && !phone.trim()) {
            toast.error("You must provide either an IP or a Phone number");
            return;
        }

        setIsAdding(true);
        try {
            const res = await fetch("/api/admin/blacklist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip, phone, reason })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("Added to blacklist successfully");
                setIp("");
                setPhone("");
                setReason("");
                fetchEntries();
            } else {
                toast.error(data.error || "Failed to add to blacklist");
            }
        } catch (error) {
            toast.error("Error adding to blacklist");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to remove this entry from the blacklist?")) return;
        try {
            const res = await fetch(`/api/admin/blacklist?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Entry removed from blacklist");
                setEntries(prev => prev.filter(e => e.id !== id));
            } else {
                const data = await res.json();
                toast.error(data.error || "Delete failed");
            }
        } catch (e) {
            toast.error("Error removing entry");
        }
    };

    const columns = [
        {
            header: "Target",
            cell: (row) => (
                <div>
                    {row.ip && <p className="font-mono text-sm text-gray-900">IP: {row.ip}</p>}
                    {row.phone && <p className="font-mono text-sm text-gray-900">Phone: {row.phone}</p>}
                </div>
            )
        },
        {
            header: "Reason",
            cell: (row) => <span className="text-gray-600 text-sm whitespace-pre-wrap">{row.reason || "No reason provided"}</span>
        },
        {
            header: "Blocked By",
            accessor: "blockedBy"
        },
        {
            header: "Date",
            cell: (row) => <span className="text-sm text-gray-500">{formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}</span>
        },
        {
            header: "Actions",
            cell: (row) => (
                <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Remove from blacklist">
                    <Trash2 className="w-5 h-5" />
                </button>
            )
        }
    ];

    return (
        <AdminShell title="Blacklist Management">

            <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-500" />
                    Block a new IP or Phone
                </h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-1">IP Address</label>
                        <input
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="e.g. 192.168.1.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="e.g. 017xxxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2.5 border rounded-lg"
                            placeholder="e.g. Spam orders"
                        />
                    </div>
                    <Button type="submit" disabled={isAdding} className="h-[46px]">
                        {isAdding ? "Adding..." : "Block"}
                    </Button>
                </form>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {entries.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            The blacklist is currently empty.
                        </div>
                    ) : (
                        <DataTable columns={columns} data={entries} searchKey="ip" />
                    )}
                </div>
            )}
        </AdminShell>
    );
}
