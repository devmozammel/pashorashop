"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, Trash, X, Zap, UploadCloud, Image as ImageIcon, Box, Tag, Layers, DollarSign, Video, Globe } from "lucide-react";
import { sanitizeImageUrls } from "@/lib/productImages";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import RichTextEditor from "@/components/admin/ui/RichTextEditor";

export default function ProductForm({ initialData, categories }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        price: 0,
        salePrice: null,
        stock: 0,
        affiliateCommissionRate: 0,
        categoryId: "",
        subcategoryGroupId: "",
        subcategoryItemId: "",
        isActive: true,
        isFeatured: false,
        isNewArrival: false,
        paymentMethods: "BOTH",
        images: [],
        variants: [],
        isPreOrder: false,
        expectedDeliveryText: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        videoUrl: ""
    });

    const [imageUrlInput, setImageUrlInput] = useState("");
    const [bulkSizes, setBulkSizes] = useState("");
    const [bulkColors, setBulkColors] = useState("");
    const [groups, setGroups] = useState([]);
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                price: Number(initialData.price),
                salePrice: initialData.salePrice ? Number(initialData.salePrice) : null,
                costPrice: Number(initialData.costPrice || 0),
                stock: Number(initialData.stock || 0),
                affiliateCommissionRate: Number(initialData.affiliateCommissionRate || 0),
                affiliateCommissionType: initialData.affiliateCommissionType || "PERCENT",
                metaTitle: initialData?.metaTitle || "",
                metaDescription: initialData?.metaDescription || "",
                metaKeywords: initialData?.metaKeywords || "",
                videoUrl: initialData?.videoUrl || "",
                categoryId: initialData.categoryId || "",
                subcategoryGroupId: initialData.subcategoryGroupId || "",
                subcategoryItemId: initialData.subcategoryItemId || "",
                paymentMethods: initialData.paymentMethods || "BOTH",
                isPreOrder: initialData.isPreOrder || false,
                expectedDeliveryText: initialData.expectedDeliveryText || "",
                images: sanitizeImageUrls(initialData.productImages?.map(i => i.url) || initialData.images || []),
                variants: (initialData.variants || []).map(v => ({
                    id: v.id,
                    size: v.size || "",
                    color: v.color || "",
                    stock: Number(v.stock || 0),
                    priceAdjustment: Number(v.priceAdjustment || 0),
                    isActive: v.isActive !== false,
                    isNewArrival: initialData.isNewArrival ?? false,
                    sku: v.sku || ""
                }))
            });

            if (initialData.categoryId) fetchGroups(initialData.categoryId);
            if (initialData.subcategoryGroupId) fetchItems(initialData.subcategoryGroupId);
        }
    }, [initialData]);

    useEffect(() => {
        if (formData.categoryId) {
            fetchGroups(formData.categoryId);
        } else {
            setGroups([]);
            setItems([]);
        }
    }, [formData.categoryId]);

    useEffect(() => {
        if (formData.subcategoryGroupId) {
            fetchItems(formData.subcategoryGroupId);
        } else {
            setItems([]);
        }
    }, [formData.subcategoryGroupId]);

    const fetchGroups = async (catId) => {
        try {
            const res = await fetch(`/api/admin/subcategory-groups?categoryId=${catId}`);
            if (res.ok) setGroups(await res.json());
            else setGroups([]);
        } catch (e) {
            setGroups([]);
        }
    };

    const fetchItems = async (groupId) => {
        try {
            const res = await fetch(`/api/admin/subcategory-items?groupId=${groupId}`);
            if (res.ok) setItems(await res.json());
            else setItems([]);
        } catch (e) {
            setItems([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: type === "checkbox" ? checked : value };
            if (name === "categoryId") {
                newData.subcategoryGroupId = "";
                newData.subcategoryItemId = "";
                setItems([]);
            }
            if (name === "subcategoryGroupId") {
                newData.subcategoryItemId = "";
            }
            return newData;
        });
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value === "" ? 0 : parseInt(value)
        }));
    };

    const addImage = () => {
        const trimmed = imageUrlInput?.trim();
        if (!trimmed) return;
        setFormData(prev => ({ ...prev, images: [...prev.images, trimmed] }));
        setImageUrlInput("");
    };

    const removeImage = (index) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { size: "", color: "", stock: 0, priceAdjustment: 0, isActive: true, sku: "" }]
        }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
    };

    const updateVariant = (index, field, value) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index] = {
                ...newVariants[index],
                [field]: (field === "stock" || field === "priceAdjustment")
                    ? (value === "" ? 0 : Number(value)) : value
            };
            return { ...prev, variants: newVariants };
        });
    };

    const generateCombinations = () => {
        const sizes = bulkSizes.split(",").map(s => s.trim()).filter(Boolean);
        const colors = bulkColors.split(",").map(c => c.trim()).filter(Boolean);

        if (!sizes.length && !colors.length) {
            alert("Enter at least sizes or colors.");
            return;
        }

        const newVariants = [];
        const existingKeys = new Set(formData.variants.map(v => `${(v.size || "").toLowerCase()}|${(v.color || "").toLowerCase()}`));

        const addIfNotExist = (s, c) => {
            const key = `${s.toLowerCase()}|${c.toLowerCase()}`;
            if (!existingKeys.has(key)) {
                newVariants.push({ size: s, color: c, stock: 0, priceAdjustment: 0, isActive: true, sku: "" });
                existingKeys.add(key);
            }
        };

        if (sizes.length && !colors.length) sizes.forEach(s => addIfNotExist(s, ""));
        else if (!sizes.length && colors.length) colors.forEach(c => addIfNotExist("", c));
        else sizes.forEach(s => colors.forEach(c => addIfNotExist(s, c)));

        if (!newVariants.length) {
            alert("All combinations exist.");
            return;
        }
        setFormData(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }));
        setBulkSizes("");
        setBulkColors("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        for (let i = 0; i < formData.variants.length; i++) {
            const v = formData.variants[i];
            if (!v.size?.trim() && !v.color?.trim()) {
                setError(`Variant #${i + 1}: Size or Color is required.`);
                setLoading(false);
                return;
            }
        }

        const seen = new Set();
        for (let i = 0; i < formData.variants.length; i++) {
            const v = formData.variants[i];
            const key = `${(v.size || "").trim().toLowerCase()}|${(v.color || "").trim().toLowerCase()}`;
            if (seen.has(key)) {
                setError(`Duplicate variant found: ${v.size || "-"} / ${v.color || "-"}.`);
                setLoading(false);
                return;
            }
            seen.add(key);
        }

        try {
            const isEdit = !!initialData?.id;
            const url = isEdit ? `/api/admin/products/${initialData.id}` : "/api/admin/products";
            const method = isEdit ? "PUT" : "POST";

            const payload = {
                ...formData,
                id: initialData?.id,
                price: Number(formData.price),
                salePrice: formData.salePrice ? Number(formData.salePrice) : null,
                stock: Number(formData.stock),
                affiliateCommissionRate: Number(formData.affiliateCommissionRate || 0),
                images: sanitizeImageUrls(formData.images),
                variants: formData.variants.map(v => ({
                    ...(v.id ? { id: v.id } : {}),
                    size: (v.size || "").trim(),
                    color: (v.color || "").trim(),
                    stock: Number(v.stock || 0),
                    priceAdjustment: Number(v.priceAdjustment || 0),
                    isActive: v.isActive !== false,
                    sku: (v.sku || "").trim()
                }))
            };

            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json()).error || "Failed to save product");

            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto pb-20">
            {/* Header Sticky Actions */}
            <div className="sticky top-0 z-20 flex justify-between items-center bg-gray-50/95 backdrop-blur py-4 mb-8 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{initialData?.id ? "Edit Product" : "Create Product"}</h1>
                    <p className="text-sm text-gray-500 mt-1">Fill in the details below to publish your product.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()} className="h-10 px-5 rounded-full border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="h-10 px-6 rounded-full bg-blue-600 hover:bg-blue-700 shadow-sm text-white font-medium transition-all">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {initialData?.id ? "Save Changes" : "Publish Product"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start">
                    <div className="text-red-700 text-sm font-medium">{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Basic Info Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Box className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-semibold text-gray-800">General Information</h3>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Name <span className="text-red-500">*</span></label>
                                <input
                                    required name="name" value={formData.name} onChange={handleChange}
                                    placeholder="Enter complete product name"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description (Rich Text)</label>
                                <RichTextEditor
                                    value={formData.description || ""}
                                    onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                    placeholder="Describe the product details, materials, and benefits..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media / Images Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-semibold text-gray-800">Media Gallery</h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Upload New Images</label>
                                <ImageUpload 
                                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, images: [...prev.images, url] }))}
                                    value={formData.images}
                                />
                            </div>

                            <div className="relative flex items-center mb-6">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest">OR Paste URL</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            <div className="flex gap-3 mb-6">
                                <div className="relative flex-1">
                                    <input
                                        value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)}
                                        placeholder="Paste image URL here (https://...)"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                    />
                                    <ImageIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                </div>
                                <Button type="button" onClick={addImage} className="rounded-xl px-6 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none shadow-none font-semibold">
                                    Add
                                </Button>
                            </div>

                            {formData.images.length === 0 ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                    <ImageIcon className="w-12 h-12 mb-3 text-gray-300" />
                                    <p className="text-sm font-medium">No images added yet</p>
                                    <p className="text-xs mt-1">Add URLs above to display product images</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formData.images.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50">
                                            <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button" onClick={() => removeImage(idx)}
                                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {idx === 0 && <span className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Main</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variants Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-violet-500" />
                                <h3 className="text-lg font-semibold text-gray-800">Variants & Options</h3>
                            </div>
                            <Button type="button" size="sm" onClick={addVariant} className="rounded-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm font-medium text-xs px-4 h-8">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Row
                            </Button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Bulk Generator */}
                            <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-5">
                                <div className="flex items-center gap-2 text-sm font-semibold text-violet-800 mb-4">
                                    <Zap className="w-4 h-4 text-violet-600" /> Auto-generate Combinations
                                </div>
                                <div className="flex flex-col md:flex-row gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-violet-700 mb-1.5 block uppercase tracking-wider">Sizes</label>
                                        <input
                                            value={bulkSizes} onChange={(e) => setBulkSizes(e.target.value)}
                                            placeholder="S, M, L, XL"
                                            className="w-full px-3 py-2 bg-white border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-semibold text-violet-700 mb-1.5 block uppercase tracking-wider">Colors</label>
                                        <input
                                            value={bulkColors} onChange={(e) => setBulkColors(e.target.value)}
                                            placeholder="Red, Blue, Green"
                                            className="w-full px-3 py-2 bg-white border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-200 outline-none text-sm"
                                        />
                                    </div>
                                    <Button type="button" onClick={generateCombinations} className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg h-[38px] px-5 shadow-sm font-medium">
                                        Generate
                                    </Button>
                                </div>
                            </div>

                            {/* Variants Table */}
                            {formData.variants.length > 0 ? (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Size</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Color</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Stock</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-28">Price +/-</th>
                                                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-16">Stat</th>
                                                <th className="px-4 py-3 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formData.variants.map((v, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-2">
                                                        <input value={v.size || ""} onChange={(e) => updateVariant(idx, "size", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Size" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input value={v.color || ""} onChange={(e) => updateVariant(idx, "color", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Color" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, "stock", e.target.value)} min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
                                                    </td>
                                                    <td className="p-2">
                                                        <input type="number" value={v.priceAdjustment} onChange={(e) => updateVariant(idx, "priceAdjustment", e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none" />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <input type="checkbox" checked={v.isActive !== false} onChange={(e) => updateVariant(idx, "isActive", e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <button type="button" onClick={() => removeVariant(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm">No variants added. Start generating above.</div>
                            )}
                        </div>
                    </div>

                    {/* SEO & Media Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Video className="w-5 h-5 text-red-500" />
                            <h3 className="font-bold text-gray-800 text-sm">Media (Video)</h3>
                        </div>
                        <div className="p-5">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Product Video URL</label>
                            <input 
                                name="videoUrl" 
                                value={formData.videoUrl || ""} 
                                onChange={handleChange} 
                                placeholder="YouTube link"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-xs"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            <h3 className="font-bold text-gray-800 text-sm">SEO Settings</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Meta Title</label>
                                <input 
                                    name="metaTitle" 
                                    value={formData.metaTitle || ""} 
                                    onChange={handleChange} 
                                    placeholder="Search engine title"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Meta Description</label>
                                <textarea 
                                    name="metaDescription" 
                                    value={formData.metaDescription || ""} 
                                    onChange={handleChange} 
                                    rows={3}
                                    placeholder="Search engine description"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Meta Keywords</label>
                                <input 
                                    name="metaKeywords" 
                                    value={formData.metaKeywords || ""} 
                                    onChange={handleChange} 
                                    placeholder="Search engine keywords (comma-separated)"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Organization & Status */}
                <div className="space-y-8">

                    {/* Organization Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-semibold text-gray-800">Organization</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Category</label>
                                <select name="categoryId" value={formData.categoryId || ""} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm transition-all appearance-none cursor-pointer">
                                    <option value="">Select Category...</option>
                                    {categories?.map(c => <option key={c.id} value={c.id}>{c.pathName || c.name}</option>)}
                                </select>
                            </div>

                            <div className={`transition-opacity duration-300 ${!formData.categoryId ? 'opacity-50 pointer-events-none' : ''}`}>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Sub Group</label>
                                <select name="subcategoryGroupId" value={formData.subcategoryGroupId || ""} onChange={handleChange} disabled={!formData.categoryId || groups.length === 0} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm transition-all appearance-none cursor-pointer">
                                    <option value="">Select Group...</option>
                                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </div>

                            <div className={`transition-opacity duration-300 ${!formData.subcategoryGroupId ? 'opacity-50 pointer-events-none' : ''}`}>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Sub Item</label>
                                <select name="subcategoryItemId" value={formData.subcategoryItemId || ""} onChange={handleChange} disabled={!formData.subcategoryGroupId || items.length === 0} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm transition-all appearance-none cursor-pointer">
                                    <option value="">Select Item...</option>
                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Slug</label>
                                <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Auto-generates if empty" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 outline-none focus:bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Config Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            <h3 className="font-semibold text-gray-800">Pricing & Inventory</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex justify-between">
                                    Regular Price <span className="text-red-500 text-lg leading-3">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-medium">৳</span>
                                    <input type="number" required name="price" value={formData.price} onChange={handleNumberChange} className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-500 outline-none text-sm transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Sale Price</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 font-medium">৳</span>
                                    <input type="number" name="salePrice" value={formData.salePrice || ""} onChange={(e) => setFormData(p => ({ ...p, salePrice: e.target.value === "" ? null : parseInt(e.target.value) }))} className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-100 focus:border-amber-500 outline-none text-sm transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 font-black text-emerald-600">Cost Price (Buying)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400 font-medium font-black text-emerald-600">৳</span>
                                        <input type="number" name="costPrice" value={formData.costPrice} onChange={handleNumberChange} className="w-full pl-8 pr-3 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm transition-all font-bold text-emerald-700" placeholder="আপনি কত দিয়ে কিনলেন?" />
                                    </div>
                                </div>
                                <div className="flex flex-col justify-end pb-1 px-1">
                                    <p className="text-[10px] text-gray-400 font-medium italic">Profit: {(formData.salePrice || formData.price) - formData.costPrice}৳</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Stock</label>
                                    <input type="number" required name="stock" value={formData.stock} onChange={handleNumberChange} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-400 outline-none text-sm font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5" title="Affiliate Commission">Comm. Amount</label>
                                    <div className="flex gap-2">
                                        <input type="number" name="affiliateCommissionRate" value={formData.affiliateCommissionRate} onChange={handleNumberChange} min="0" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-400 outline-none text-sm font-medium" />
                                        <select 
                                            name="affiliateCommissionType" 
                                            value={formData.affiliateCommissionType} 
                                            onChange={(e) => setFormData(p => ({ ...p, affiliateCommissionType: e.target.value }))}
                                            className="px-2 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                        >
                                            <option value="PERCENT">%</option>
                                            <option value="FIXED">৳</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800">Publish Status</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Make Active</span>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Featured Product</span>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </div>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-gray-100">
                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">New Arrival</span>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" name="isNewArrival" checked={formData.isNewArrival} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-2 leading-tight uppercase font-bold tracking-wider">
                                Featured/New Arrival status helps prioritize products in store sections.
                            </p>

                            <div className="pt-4 border-t border-gray-100 mt-4">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Allowed Payment Methods</label>
                                <select
                                    name="paymentMethods"
                                    value={formData.paymentMethods}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none text-sm transition-all appearance-none cursor-pointer"
                                >
                                    <option value="BOTH">Both COD & Online Payment</option>
                                    <option value="COD">Cash on Delivery (COD) Only</option>
                                    <option value="ONLINE">Online Payment Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pre-Order Config Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            <h3 className="font-semibold text-gray-800">Pre-Order Config</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Is Pre-Order?</span>
                                    <span className="text-[10px] text-gray-400">Requires ৳100 advance payment</span>
                                </div>
                                <div className="relative inline-flex items-center">
                                    <input type="checkbox" name="isPreOrder" checked={formData.isPreOrder} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </div>
                            </label>

                            {formData.isPreOrder && (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Expected Delivery Text</label>
                                    <input 
                                        name="expectedDeliveryText" 
                                        value={formData.expectedDeliveryText || ""} 
                                        onChange={handleChange} 
                                        placeholder="e.g. Delivery by 25th May"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all text-xs"
                                    />
                                    <p className="text-[9px] text-gray-400 mt-2 italic">
                                        Note: Users must pay ৳100 in advance for pre-orders. If they don't accept delivery, the amount will be refunded.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </form>
    );
}