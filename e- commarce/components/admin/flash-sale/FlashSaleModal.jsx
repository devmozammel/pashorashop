"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { flashSaleSchema } from "@/lib/zod-schemas";

export default function FlashSaleModal({ isOpen, onClose, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        startsAt: "",
        endsAt: "",
        isActive: true,
    });
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const payload = {
                title: formData.title,
                startsAt: formData.startsAt,
                endsAt: formData.endsAt,
                isActive: formData.isActive,
            };

            const result = flashSaleSchema.safeParse(payload);
            if (!result.success) {
                const fieldErrors = {};
                result.error.errors.forEach(err => {
                    if (err.path[0]) fieldErrors[err.path[0]] = err.message;
                });
                setErrors(fieldErrors);
                setIsLoading(false);
                return;
            }

            const res = await fetch("/api/admin/flash-sale", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to create flash sale");
                setIsLoading(false);
                return;
            }

            toast.success("Flash Sale Created");
            setFormData({
                title: "",
                startsAt: "",
                endsAt: "",
                isActive: true,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">New Flash Sale</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Spring Sale"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
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
                        {errors.startsAt && <p className="text-red-500 text-xs mt-1">{errors.startsAt}</p>}
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
                        {errors.endsAt && <p className="text-red-500 text-xs mt-1">{errors.endsAt}</p>}
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="fsActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label htmlFor="fsActive" className="text-sm font-medium">Active</label>
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
                            Create Flash Sale
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
