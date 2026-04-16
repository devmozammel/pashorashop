"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import AdminShell from "@/components/admin/AdminShell";
import { Loader2 } from "lucide-react";

export default function ProductFormPage() {
    const params = useParams();
    const router = useRouter();
    const isEditMode = !!params.id;

    const [product, setProduct] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Categories (Flat)
                const catRes = await fetch('/api/categories');
                if (catRes.ok) {
                    const catText = await catRes.text();
                    if (catText) {
                        const catData = JSON.parse(catText);
                        const categoriesWithPaths = buildCategoryPaths(catData);
                        setCategories(categoriesWithPaths);
                    }
                }

                // 2. Fetch Product if Edit Mode
                if (isEditMode) {
                    const prodRes = await fetch(`/api/admin/products/${params.id}`);

                    if (prodRes.status === 401 || prodRes.status === 403) {
                        setError("Unauthorized — you must be logged in as Admin to edit products.");
                        return;
                    }

                    if (prodRes.status === 404) {
                        setError("Product not found. It may have been deleted.");
                        return;
                    }

                    if (!prodRes.ok) {
                        setError(`Failed to load product (status ${prodRes.status})`);
                        return;
                    }

                    const prodText = await prodRes.text();
                    if (!prodText) {
                        setError("Empty response from server");
                        return;
                    }

                    const prodData = JSON.parse(prodText);
                    setProduct(prodData);
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError(err.message || "Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isEditMode, params.id]);

    if (loading) {
        return (
            <AdminShell title={isEditMode ? "Edit Product" : "New Product"}>
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminShell>
        );
    }

    if (error) {
        return (
            <AdminShell title="Error">
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center">
                    <p className="font-medium text-lg mb-2">{error}</p>
                    <button
                        onClick={() => router.push('/admin/products')}
                        className="text-sm underline hover:no-underline mt-2"
                    >
                        ← Back to Products
                    </button>
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell title={isEditMode ? "Edit Product" : "New Product"}>
            <ProductForm initialData={product} categories={categories} />
        </AdminShell>
    );
}

// Helper to build "Parent > Child > Grandchild" strings
function buildCategoryPaths(categories) {
    const map = new Map(categories.map(c => [c.id, c]));

    return categories.map(cat => {
        let path = [cat.name];
        let current = cat;
        while (current.parentId && map.has(current.parentId)) {
            current = map.get(current.parentId);
            path.unshift(current.name);
        }
        return {
            ...cat,
            pathName: path.join(" > ")
        };
    }).sort((a, b) => a.pathName.localeCompare(b.pathName));
}
