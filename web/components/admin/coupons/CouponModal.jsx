"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { couponSchema } from "@/lib/zod-schemas";
import { Input, Select } from "@/components/admin/ui/FormElements";

export default function CouponModal({ isOpen, onClose, onSuccess, initialData }) {
    const [isLoading, setIsLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "",
        maxUsage: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
        productId: "",
        userId: "",
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
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
                    productId: initialData.productId ?? "",
                    userId: initialData.userId ?? "",
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
                    productId: "",
                    userId: "",
                });
            }
            setErrors({});

            // Fetch products
            fetch("/api/admin/products")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setProducts(data);
                })
                .catch(err => console.error("Failed to load products", err));

            // Fetch users
            fetch("/api/admin/users")
                .then(res => res.json())
                .then(resData => {
                    if (resData.ok && Array.isArray(resData.data)) {
                        setUsers(resData.data);
                    }
                })
                .catch(err => console.error("Failed to load users", err));
        }
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
                productId: formData.productId || null,
                userId: formData.userId || null,
            };

            // Client-side validation using Zod schema
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

    const discountTypeOptions = [
        { value: "PERCENT", label: "Percentage (%)" },
        { value: "FIXED", label: "Fixed Amount" }
    ];

    const productOptions = [
        { value: "", label: "All Products" },
        ...products.map(p => ({ value: p.id, label: p.name }))
    ];

    const userOptions = [
        { value: "", label: "All Users" },
        ...users.map(u => ({
            value: u.id,
            label: `${u.name || "No Name"} (${u.email || u.phone || "No Contact"})`
        }))
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">{initialData ? "Edit Coupon" : "Create Coupon"}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" type="button">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input
                                label="Coupon Code"
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="uppercase"
                                placeholder="SUMMER25"
                                disabled={isLoading}
                                error={errors.code}
                            />
                        </div>

                        <div>
                            <Select
                                label="Discount Type"
                                name="discountType"
                                value={formData.discountType}
                                onChange={handleChange}
                                options={discountTypeOptions}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Input
                                label="Value"
                                type="number"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                placeholder={formData.discountType === 'PERCENT' ? "1-100" : "Amount"}
                                disabled={isLoading}
                                error={errors.discountValue}
                            />
                        </div>

                        <div>
                            <Input
                                label="Min Order Amount"
                                type="number"
                                name="minOrderAmount"
                                value={formData.minOrderAmount}
                                onChange={handleChange}
                                placeholder="Optional"
                                disabled={isLoading}
                                error={errors.minOrderAmount}
                            />
                        </div>

                        <div>
                            <Input
                                label="Max Usages"
                                type="number"
                                name="maxUsage"
                                value={formData.maxUsage}
                                onChange={handleChange}
                                placeholder="Optional"
                                disabled={isLoading}
                                error={errors.maxUsage}
                            />
                        </div>

                        <div className="col-span-2">
                            <Select
                                label="Applies To Product"
                                name="productId"
                                value={formData.productId}
                                onChange={handleChange}
                                options={productOptions}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="col-span-2">
                            <Select
                                label="Applies To User"
                                name="userId"
                                value={formData.userId}
                                onChange={handleChange}
                                options={userOptions}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Input
                                label="Start Date"
                                type="datetime-local"
                                name="startsAt"
                                value={formData.startsAt}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Input
                                label="End Date"
                                type="datetime-local"
                                name="endsAt"
                                value={formData.endsAt}
                                onChange={handleChange}
                                disabled={isLoading}
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
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active Status</label>
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
