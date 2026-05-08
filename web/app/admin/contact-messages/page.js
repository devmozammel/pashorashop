"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/FormElements";
import { Loader2, Trash2, MailOpen, CornerUpLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ContactMessagesPage() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMessages = async () => {
        try {
            const res = await fetch("/api/admin/contact-messages");
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
            } else {
                toast.error(data.error || "Failed to load messages");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/admin/contact-messages/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                toast.success(`Message marked as ${status}`);
                setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
            } else {
                const data = await res.json();
                toast.error(data.error || "Update failed");
            }
        } catch (e) {
            toast.error("Error updating message");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await fetch(`/api/admin/contact-messages/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Message deleted");
                setMessages(prev => prev.filter(m => m.id !== id));
            } else {
                const data = await res.json();
                toast.error(data.error || "Delete failed");
            }
        } catch (e) {
            toast.error("Error deleting message");
        }
    };

    const columns = [
        {
            header: "Sender",
            cell: (row) => (
                <div>
                    <p className="font-semibold text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500">{row.email}</p>
                </div>
            )
        },
        {
            header: "Message",
            cell: (row) => (
                <div className="max-w-xs md:max-w-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-2" title={row.message}>{row.message}</p>
                    <span className="text-xs text-gray-400 mt-1 block">
                        {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
                    </span>
                </div>
            )
        },
        {
            header: "Status",
            cell: (row) => {
                const variants = {
                    NEW: "warning",
                    READ: "secondary",
                    REPLIED: "success"
                };
                return <Badge variant={variants[row.status] || "secondary"}>{row.status}</Badge>;
            }
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.status === "NEW" && (
                        <button onClick={() => handleUpdateStatus(row.id, "READ")} className="p-1 hover:bg-blue-100 text-blue-600 rounded" title="Mark as Read">
                            <MailOpen className="w-5 h-5" />
                        </button>
                    )}
                    {row.status !== "REPLIED" && (
                        <button onClick={() => handleUpdateStatus(row.id, "REPLIED")} className="p-1 hover:bg-green-100 text-green-600 rounded" title="Mark as Replied">
                            <CornerUpLeft className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => handleDelete(row.id)} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Delete Message">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminShell title="Contact Messages">
            {isLoading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            No contact messages found.
                        </div>
                    ) : (
                        <DataTable columns={columns} data={messages} searchKey="email" />
                    )}
                </div>
            )}
        </AdminShell>
    );
}
