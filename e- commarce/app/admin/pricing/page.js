"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Save, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PricingPage() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingChanges, setPendingChanges] = useState({}); // { [id]: { price: 100, salePrice: 90 } }
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/pricing");
            const data = await res.json();
            if (data.ok) {
                setProducts(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (id, field, value) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value === "" ? "" : Number(value)
            }
        }));
    };

    const getDisplayValue = (product, field) => {
        if (pendingChanges[product.id] && pendingChanges[product.id][field] !== undefined) {
            return pendingChanges[product.id][field];
        }
        return product[field] ?? "";
    };

    const handleSave = async () => {
        const updateCount = Object.keys(pendingChanges).length;
        if (updateCount === 0) return;

        setIsSaving(true);
        try {
            // Prepare payload using current pending changes merged with existing data where needed, 
            // but actually API expects array of { id, price, salePrice }
            // We need to make sure we send valid numbers.

            const updates = Object.entries(pendingChanges).map(([id, changes]) => {
                const original = products.find(p => p.id === id);
                return {
                    id,
                    price: changes.price !== undefined ? changes.price : original.price,
                    salePrice: changes.salePrice !== undefined ? changes.salePrice : original.salePrice
                };
            });

            const res = await fetch("/api/admin/pricing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            });

            const data = await res.json();

            if (data.ok) {
                toast.success(`Updated ${updateCount} products`);
                setPendingChanges({});
                fetchProducts();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasChanges = Object.keys(pendingChanges).length > 0;

    return (
        <AdminShell
            title="Pricing Manager"
            actions={
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${hasChanges
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes ({Object.keys(pendingChanges).length})
                </button>
            }
        >
            <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[calc(100vh-14rem)]">
                <div className="p-4 border-b">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by product name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left relative">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 w-16">Image</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3 w-32">Price (৳)</th>
                                    <th className="px-6 py-3 w-32">Sale Price (৳)</th>
                                    <th className="px-6 py-3 w-24">Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredProducts.map(product => {
                                    const currentPrice = getDisplayValue(product, 'price');
                                    const currentSale = getDisplayValue(product, 'salePrice');
                                    const isChanged = pendingChanges[product.id] !== undefined;
                                    const displaySale = currentSale || currentPrice;
                                    const discount = currentSale ? Math.round(((currentPrice - currentSale) / currentPrice) * 100) : 0;

                                    return (
                                        <tr key={product.id} className={`hover:bg-gray-50 transition ${isChanged ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden border">
                                                    {product.images && product.images[0] ? (
                                                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="font-medium text-gray-900">{product.name}</div>
                                                <div className="text-xs text-gray-500">{product.category?.name || "Uncategorized"}</div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    value={currentPrice}
                                                    onChange={(e) => handleChange(product.id, 'price', e.target.value)}
                                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-right ${pendingChanges[product.id]?.price ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    value={currentSale}
                                                    onChange={(e) => handleChange(product.id, 'salePrice', e.target.value)}
                                                    placeholder="-"
                                                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 text-right ${pendingChanges[product.id]?.salePrice ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                                                    min="0"
                                                />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                {discount > 0 ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                        -{discount}%
                                                    </span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminShell>
    );
}
