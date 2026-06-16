"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Loader2, Trash2, Phone, MessageSquare, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";

export default function AbandonedCartsPage() {
    const [checkouts, setCheckouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCheckouts = async () => {
        try {
            const res = await fetch("/api/admin/abandoned-checkouts");
            const data = await res.json();
            if (res.ok && data.ok) {
                setCheckouts(data.data);
            } else {
                toast.error(data.message || "Failed to load abandoned checkouts");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while fetching abandoned checkouts");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckouts();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this abandoned checkout?")) return;
        try {
            const res = await fetch(`/api/admin/abandoned-checkouts?id=${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok && data.ok) {
                toast.success("Abandoned checkout deleted");
                setCheckouts(prev => prev.filter(c => c.id !== id));
            } else {
                toast.error(data.message || "Delete failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting abandoned checkout");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);
    };

    const getWhatsAppLink = (phoneInput, nameInput) => {
        let cleanPhone = phoneInput.replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "88" + cleanPhone;
        } else if (cleanPhone.startsWith("1") && cleanPhone.length === 10) {
            cleanPhone = "880" + cleanPhone;
        }
        const message = encodeURIComponent(`হাই ${nameInput}! আপনি authenticbazar.shop এ কিছু প্রোডাক্ট অর্ডার করার চেষ্টা করছিলেন কিন্তু অর্ডারটি সম্পূর্ণ করেননি। আপনার কোনো সাহায্য লাগবে কি? অর্ডারটি সম্পূর্ণ করতে চাইলে আমাদের জানাতে পারেন। ধন্যবাদ!`);
        return `https://wa.me/${cleanPhone}?text=${message}`;
    };

    const columns = [
        {
            header: "Customer Details",
            cell: (row) => (
                <div className="space-y-1">
                    <p className="font-bold text-gray-900">{row.name}</p>
                    <p className="text-sm text-gray-500 font-mono">{row.phone}</p>
                    {row.address && (
                        <p className="text-xs text-gray-500 max-w-xs truncate" title={`${row.address}${row.city ? ', ' + row.city : ''}`}>
                            {row.address}{row.city ? `, ${row.city}` : ''}
                        </p>
                    )}
                </div>
            )
        },
        {
            header: "Cart Items",
            cell: (row) => {
                let items = [];
                try {
                    items = typeof row.items === "string" ? JSON.parse(row.items) : row.items;
                } catch (e) {
                    items = [];
                }
                return (
                    <div className="space-y-1">
                        {items && Array.isArray(items) ? (
                            items.map((item, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                    <span className="font-semibold text-gray-800">{item.name}</span>
                                    <span>({item.quantity}x)</span>
                                    <span className="text-gray-400 font-mono">৳{item.price}</span>
                                </div>
                            ))
                        ) : (
                            <span className="text-xs text-red-500">No items</span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Total",
            cell: (row) => <span className="font-semibold text-gray-900">{formatCurrency(row.total)}</span>
        },
        {
            header: "Last Activity",
            cell: (row) => <span className="text-sm text-gray-500">{formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true })}</span>
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <a
                        href={`tel:${row.phone}`}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                        title="Call Customer"
                    >
                        <Phone className="w-4 h-4" />
                    </a>
                    <a
                        href={getWhatsAppLink(row.phone, row.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        title="Contact on WhatsApp"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"
                        title="Delete Entry"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminShell title="Abandoned Carts Recovery">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Abandoned Checkouts</h2>
                        <p className="text-sm text-gray-500">View checkouts that customers initiated but did not complete. Reach out to them to recover conversions.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center flex-col items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                        <p className="text-gray-500 text-sm">Loading checkouts...</p>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={checkouts}
                        searchKey="name"
                    />
                )}
            </div>
        </AdminShell>
    );
}
