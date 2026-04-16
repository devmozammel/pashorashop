"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Plus, Zap, ArrowRight, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import FlashSaleModal from "@/components/admin/flash-sale/FlashSaleModal";
import { toast } from "sonner";

export default function AdminFlashSalePage() {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchSales = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/flash-sale");
            const data = await res.json();
            if (data.ok) {
                setSales(data.data);
            }
        } catch (error) {
            toast.error("Failed to load flash sales");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const getStatus = (sale) => {
        const now = new Date();
        const start = new Date(sale.startsAt);
        const end = new Date(sale.endsAt);

        if (!sale.isActive) return { label: "Inactive", color: "text-gray-500 bg-gray-100" };
        if (now < start) return { label: "Upcoming", color: "text-blue-600 bg-blue-100" };
        if (now > end) return { label: "Expired", color: "text-red-600 bg-red-100" };
        return { label: "Active", color: "text-green-600 bg-green-100 animate-pulse" };
    };

    return (
        <AdminShell
            title="Flash Sales"
            actions={
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Flash Sale
                </button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : sales.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <h3 className="text-lg font-medium">No sales found</h3>
                        <p>Create a flash sale to boost revenue.</p>
                    </div>
                ) : (
                    sales.map((sale) => {
                        const status = getStatus(sale);
                        return (
                            <div key={sale.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${status.color}`}>
                                        {status.label === 'Active' && <Zap className="w-3 h-3" />}
                                        {status.label}
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono">
                                        {sale._count?.items || sale.items?.length || 0} Items
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{sale.title}</h3>

                                <div className="space-y-1 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Start: {new Date(sale.startsAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>End: {new Date(sale.endsAt).toLocaleString()}</span>
                                    </div>
                                </div>

                                <Link
                                    href={`/admin/flash-sale/${sale.id}`}
                                    className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                                >
                                    Manage Items
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        );
                    })
                )}
            </div>

            <FlashSaleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchSales}
            />
        </AdminShell>
    );
}
