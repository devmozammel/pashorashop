"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Badge } from "@/components/admin/ui/FormElements";
import { Edit, Trash, Plus, Copy, Loader2, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/products');
            if (!res.ok) throw new Error('Failed to fetch products');
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Delete this product?")) return;
        try {
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert("Error deleting product: " + err.message);
        }
    };

    const duplicateProduct = async (product) => {
        try {
            const res = await fetch('/api/admin/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${product.name} (Copy)`,
                    description: product.description,
                    price: product.price,
                    salePrice: product.salePrice,
                    stock: product.stock,
                    categoryId: product.categoryId,
                    isActive: false, // Duplicate starts as draft
                    isFeatured: false,
                    images: product.images || [],
                })
            });
            if (!res.ok) throw new Error('Duplicate failed');
            fetchProducts(); // Refresh list
        } catch (err) {
            alert("Error duplicating product: " + err.message);
        }
    };

    const columns = [
        {
            header: "Product",
            cell: (row) => {
                const imgUrl = row.productImages?.[0]?.url || row.images?.[0];
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                            {imgUrl && <img src={imgUrl} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <div>
                            <p className="font-medium">{row.name}</p>
                            <p className="text-xs text-gray-500">{row.slug}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Category",
            cell: (row) => row.category?.name || '-'
        },
        {
            header: "Price",
            cell: (row) => (
                <div>
                    {row.salePrice ? (
                        <>
                            <span className="text-red-600 font-bold">{formatPrice(row.salePrice)}</span>
                            <br />
                            <span className="text-xs line-through text-gray-400">{formatPrice(row.price)}</span>
                        </>
                    ) : formatPrice(row.price)}
                </div>
            )
        },
        { header: "Stock", accessor: "stock" },
        { header: "Status", cell: (row) => <Badge variant={row.isActive ? 'success' : 'default'}>{row.isActive ? 'Active' : 'Draft'}</Badge> },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" title="Add Review" onClick={() => router.push(`/admin/reviews?productId=${row.id}`)} className="text-blue-600 hover:text-blue-800"><MessageSquare className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/products/${row.id}/edit`)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicateProduct(row)}><Copy className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id)}><Trash className="w-4 h-4" /></Button>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <AdminShell title="Products">
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminShell>
        );
    }

    if (error) {
        return (
            <AdminShell title="Products">
                <div className="text-red-500 p-4">Error: {error}</div>
            </AdminShell>
        );
    }

    return (
        <AdminShell
            title="Products"
            actions={<Button onClick={() => router.push('/admin/products/new')}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>}
        >
            <DataTable
                columns={columns}
                data={products}
                searchKey="name"
            />
        </AdminShell>
    );
}
