"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/FormElements";
import { Loader2, Image as ImageIcon, Tag, CheckCircle2, Link as LinkIcon } from "lucide-react";

export default function CategoryForm({ initialData, parentOptions, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        sortOrder: 0,
        isActive: true,
        showInMegaMenu: true,
        showOnHomepage: false,
        showInTopbar: false,
        image: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                slug: initialData.slug || "",
                parentId: initialData.parentId || "",
                sortOrder: initialData.sortOrder || 0,
                isActive: initialData.isActive ?? true,
                showInMegaMenu: initialData.showInMegaMenu ?? true,
                showOnHomepage: initialData.showOnHomepage ?? false,
                showInTopbar: initialData.showInTopbar ?? false,
                image: initialData.image || ""
            });
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = initialData
                ? `/api/admin/categories/${initialData.id}`
                : "/api/admin/categories";

            const method = initialData ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save category");
            }

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Header Area */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                        {initialData ? "Edit Category" : "New Category"}
                    </h2>
                    <p className="text-sm text-gray-500">Configure category details and display rules.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start gap-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">

                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name <span className="text-red-500">*</span></label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value, slug: !initialData ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : formData.slug })}
                            placeholder="e.g. Men's Clothing"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <LinkIcon className="w-3.5 h-3.5 text-gray-400" /> Slug
                            </label>
                            <input
                                required
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="mens-clothing"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sort Order</label>
                            <input
                                type="number"
                                value={formData.sortOrder}
                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Image Section */}
                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" /> Category Banner URL
                    </label>
                    <input
                        value={formData.image || ""}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-sm"
                    />
                    {formData.image && (
                        <div className="mt-3 relative w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex items-center justify-center group">
                            <img src={formData.image} alt="Preview" className="max-w-full max-h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
                        </div>
                    )}
                </div>

                {/* Switches / Display Rules */}
                <div className="pt-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Display Rules & Status</h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">

                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                <CheckCircle2 className={`w-4 h-4 ${formData.isActive ? 'text-green-500' : 'text-gray-300'}`} />
                                Active
                            </div>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Mega Menu</span>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" checked={formData.showInMegaMenu} onChange={e => setFormData({ ...formData, showInMegaMenu: e.target.checked })} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Homepage</span>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" checked={formData.showOnHomepage} onChange={e => setFormData({ ...formData, showOnHomepage: e.target.checked })} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all group">
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Topbar</span>
                            <div className="relative inline-flex items-center">
                                <input type="checkbox" checked={formData.showInTopbar} onChange={e => setFormData({ ...formData, showInTopbar: e.target.checked })} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                            </div>
                        </label>

                    </div>
                </div>

            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {loading ? 'Saving...' : 'Save Category'}
                </button>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e5e7eb;
                    border-radius: 20px;
                }
            `}</style>
        </form>
    );
}
