"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { couponSchema } from "@/lib/zod-schemas";

export default function CouponModal({ isOpen, onClose, onSuccess, initialData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "",
        maxUsage: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code,
                discountType: initialData.discountType,
                discountValue: initialData.discountValue,
                minOrderAmount: initialData.minOrderAmount ?? "",
                maxUsage: initialData.maxUsage ?? "",
                startsAt: initialData.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : "",
                endsAt: initialData.endsAt ? new Date(initialData.endsAt).toISOString().slice(0, 16) : "",
                isActive: initialData.isActive,
            });
        } else {
            setFormData({
                code: "",
                discountType: "PERCENT",
                discountValue: "",
                minOrderAmount: "",
                maxUsage: "",
                startsAt: "",
                endsAt: "",
                isActive: true,
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            // Prepare data for Zod validation/API
            const payload = {
                code: formData.code.toUpperCase(),
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue),
                minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
                maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
                startsAt: formData.startsAt || null,
                endsAt: formData.endsAt || null,
                isActive: formData.isActive,
            };

            // Client-side validation using Zod schema
            // We use safeParse to get all errors
            const result = couponSchema.safeParse(payload);

            if (!result.success) {
                const fieldErrors = {};
                result.error.errors.forEach(err => {
                    if (err.path[0]) fieldErrors[err.path[0]] = err.message;
                });
                setErrors(fieldErrors);
                setIsLoading(false);
                return;
            }

            const url = initialData
                ? `/api/admin/coupons/${initialData.id}`
                : `/api/admin/coupons`;

            const method = initialData ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.details) {
                    // Handle Zod errors from server
                    const fieldErrors = {};
                    data.details.forEach(err => {
                        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
                    });
                    setErrors(fieldErrors);
                } else {
                    toast.error(data.message || "Something went wrong");
                }
                setIsLoading(false);
                return;
            }

            toast.success(initialData ? "Coupon updated" : "Coupon created");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save coupon");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{initialData ? "Edit Coupon" : "Create Coupon"}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Coupon Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 uppercase"
                                placeholder="SUMMER25"
                                disabled={isLoading}
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Discount Type</label>
                            <select
                                name="discountType"
                                value={formData.discountType}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PERCENT">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Value</label>
                            <input
                                type="number"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                placeholder={formData.discountType === 'PERCENT' ? "1-100" : "Amount"}
                            />
                            {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Min Order Amount</label>
                            <input
                                type="number"
                                name="minOrderAmount"
                                value={formData.minOrderAmount}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                            />
                            {errors.minOrderAmount && <p className="text-red-500 text-xs mt-1">{errors.minOrderAmount}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Max Usages</label>
                            <input
                                type="number"
                                name="maxUsage"
                                value={formData.maxUsage}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                            />
                            {errors.maxUsage && <p className="text-red-500 text-xs mt-1">{errors.maxUsage}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="datetime-local"
                                name="startsAt"
                                value={formData.startsAt}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="datetime-local"
                                name="endsAt"
                                value={formData.endsAt}
                                onChange={handleChange}
                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">Active Status</label>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {initialData ? "Update Coupon" : "Create Coupon"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
