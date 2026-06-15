"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ArrowLeft, Plus, Trash2, Loader2, Save, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AddProductModal from "@/components/admin/flash-sale/AddProductModal";
import { useRouter } from "next/navigation";

export default function FlashSaleDetailsPage({ params }) {
    const { id } = params;
    const router = useRouter();

    const [sale, setSale] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/flash-sale/${id}`);
            const data = await res.json();

            if (data.ok) {
                setSale(data.data);
            } else {
                toast.error(data.message);
                router.push("/admin/flash-sale");
            }
        } catch (error) {
            toast.error("Failed to load details");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleRemoveItem = async (itemId) => {
        if (!confirm("Remove this product from sale?")) return;
        try {
            const res = await fetch(`/api/admin/flash-sale/items/${itemId}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Item removed");
                fetchDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    const handleToggleItem = async (itemId, currentStatus) => {
        try {
            const res = await fetch(`/api/admin/flash-sale/items/${itemId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Item updated");
                fetchDetails();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to update item");
        }
    };

    const handleDeleteSale = async () => {
        if (!confirm("Are you sure you want to delete this ENTIRE flash sale?")) return;
        try {
            const res = await fetch(`/api/admin/flash-sale/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Flash Sale deleted");
                router.push("/admin/flash-sale");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to delete sale");
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Loading...">
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            </AdminShell>
        );
    }

    if (!sale) return null;

    return (
        <AdminShell
            title={sale.title}
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={handleDeleteSale}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition border border-red-200"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Sale
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            }
        >
            <div className="mb-6">
                <Link href="/admin/flash-sale" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Sales
                </Link>

                <div className="bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Starts At</span>
                        <span className="font-medium">{new Date(sale.startsAt).toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Ends At</span>
                        <span className="font-medium">{new Date(sale.endsAt).toLocaleString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${sale.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {sale.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500 text-xs uppercase tracking-wider font-semibold">Total Items</span>
                        <span className="font-medium">{sale.items.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Sale Items</h3>
                </div>

                {sale.items.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>No products in this sale yet.</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-blue-600 font-medium hover:underline mt-2"
                        >
                            Add products
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3 w-16">Image</th>
                                    <th className="px-6 py-3">Product Name</th>
                                    <th className="px-6 py-3 text-right">Regular Price</th>
                                    <th className="px-6 py-3 text-right">Sale Price</th>
                                    <th className="px-6 py-3 text-center">Discount</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sale.items.map((item) => {
                                    const discount = Math.round(((item.product.price - item.salePrice) / item.product.price) * 100);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden border">
                                                    {item.product.images && item.product.images[0] ? (
                                                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                {item.product.name}
                                                {item.product.stock <= 0 && (
                                                    <span className="ml-2 text-xs text-red-500 font-bold">(Out of Stock)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-500 line-through">
                                                ৳{item.product.price}
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-blue-600">
                                                ৳{item.salePrice}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                                    -{discount}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => handleToggleItem(item.id, item.isActive)}
                                                    className={`hover:opacity-80 transition ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}
                                                    title={item.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {item.isActive ? <CheckCircle className="w-5 h-5 mx-auto" /> : <XCircle className="w-5 h-5 mx-auto" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-gray-400 hover:text-red-600 transition"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="w-4 h-4 ml-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDetails}
                flashSaleId={id}
            />
        </AdminShell>
    );
}
