"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Input, Select } from "@/components/admin/ui/FormElements";
import { Trash, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VariantsPage() {
    const [variants, setVariants] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        productId: "", size: "", color: "", stock: 0, priceAdjustment: 0
    });

    const [filterProduct, setFilterProduct] = useState("");

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/products");
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
                // Flatten variants
                const allVariants = data.flatMap(p =>
                    (p.variants || []).map(v => ({
                        ...v,
                        productName: p.name,
                        productId: p.id,
                        priceAdjustment: v.priceAdjustment || 0
                    }))
                );
                allVariants.sort((a, b) => b.createdAt?.localeCompare(a.createdAt));
                setVariants(allVariants);
            }
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        if (!formData.productId) return toast.error("Product is required");
        setIsSaving(true);
        try {
            // To add a variant, we must update the specific product's variants array
            const targetProduct = products.find(p => p.id === formData.productId);
            if (!targetProduct) throw new Error("Product not found");

            const updatedVariants = [...(targetProduct.variants || []), {
                size: formData.size,
                color: formData.color,
                stock: formData.stock,
                priceAdjustment: formData.priceAdjustment,
                isActive: true
            }];

            const res = await fetch(`/api/admin/products/${formData.productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...targetProduct,
                    variants: updatedVariants
                })
            });

            if (res.ok) {
                toast.success("Variant added!");
                fetchData();
                setIsModalOpen(false);
                setFormData({ productId: "", size: "", color: "", stock: 0, priceAdjustment: 0 });
            } else {
                toast.error("Failed to add variant");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (variantId, productId) => {
        if (!confirm("Delete variant?")) return;
        try {
            const targetProduct = products.find(p => p.id === productId);
            if (!targetProduct) return;

            const updatedVariants = targetProduct.variants.filter(v => v.id !== variantId);

            const res = await fetch(`/api/admin/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...targetProduct,
                    variants: updatedVariants
                })
            });

            if (res.ok) {
                toast.success("Variant deleted");
                fetchData();
            } else {
                toast.error("Failed to delete variant");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const filteredVariants = filterProduct
        ? variants.filter(v => v.productId === filterProduct)
        : variants;

    const columns = [
        { header: "Product", accessor: "productName" },
        { header: "Size", accessor: "size" },
        { header: "Color", accessor: "color" },
        { header: "Stock", accessor: "stock" },
        { header: "Price Adj.", cell: (row) => row.priceAdjustment ? `+${row.priceAdjustment}` : '-' },
        {
            header: "Actions",
            cell: (row) => (
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id, row.productId)}><Trash className="w-4 h-4" /></Button>
            )
        }
    ];

    return (
        <AdminShell
            title="Variants"
            actions={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Variant</Button>}
        >
            <div className="mb-4">
                <Select
                    label="Filter by Product"
                    value={filterProduct}
                    onChange={e => setFilterProduct(e.target.value)}
                    options={[{ value: "", label: "All Products" }, ...products.map(p => ({ value: p.id, label: p.name }))]}
                    className="max-w-xs"
                />
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredVariants}
                    searchKey="size"
                />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">New Variant</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <Select
                                label="Product"
                                value={formData.productId}
                                onChange={e => setFormData({ ...formData, productId: e.target.value })}
                                options={[{ value: "", label: "Select Product" }, ...products.map(p => ({ value: p.id, label: p.name }))]}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Size" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
                                <Input label="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" label="Stock" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                                <Input type="number" label="Price Adjustment" value={formData.priceAdjustment} onChange={e => setFormData({ ...formData, priceAdjustment: parseInt(e.target.value) })} />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Variant"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
