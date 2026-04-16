"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Plus, Edit, Trash2, Tag, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import CouponModal from "@/components/admin/coupons/CouponModal";

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/coupons");
            const data = await res.json();
            if (data.ok) {
                setCoupons(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load coupons");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleCreate = () => {
        setEditingCoupon(null);
        setIsModalOpen(true);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coupon? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.ok) {
                toast.success("Coupon deleted");
                fetchCoupons();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to delete coupon");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <AdminShell
            title="Coupons"
            actions={
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            }
        >
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <h3 className="text-lg font-medium">No coupons found</h3>
                        <p className="mb-4">Create your first coupon to get started.</p>
                        <button
                            onClick={handleCreate}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create New
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Code</th>
                                    <th className="px-6 py-3">Discount</th>
                                    <th className="px-6 py-3">Validity</th>
                                    <th className="px-6 py-3">Usage</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                                            {coupon.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {coupon.discountType === 'PERCENT' ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}
                                            </span>
                                            {coupon.minOrderAmount && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Min: ৳{coupon.minOrderAmount}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex flex-col text-xs">
                                                <span>Start: {formatDate(coupon.startsAt)}</span>
                                                <span>End: {formatDate(coupon.endsAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-900 font-medium">{coupon.usedCount}</span>
                                            <span className="text-gray-400"> / {coupon.maxUsage || "∞"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {coupon.isActive ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-500 text-xs font-bold">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="text-gray-500 hover:text-blue-600 mr-3"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-gray-500 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CouponModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCoupons}
                initialData={editingCoupon}
            />
        </AdminShell>
    );
}
