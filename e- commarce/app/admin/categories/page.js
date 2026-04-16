"use client";

import { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/FormElements";
import { Plus, Loader2 } from "lucide-react";
import CategoryTree from "@/components/admin/categories/CategoryTree";
import CategoryForm from "@/components/admin/categories/CategoryForm";
import useSWR from 'swr';
import { toast } from "sonner";

const fetcher = url => fetch(url).then(r => r.json());

export default function CategoriesPage() {
    // Fetch categories
    const { data: categories, error, mutate, isLoading } = useSWR('/api/categories', fetcher);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const handleAdd = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        mutate(); // Refresh data
        toast.success(editingCategory ? "Category updated" : "Category created");
    };

    const handleToggleStatus = async (category) => {
        try {
            const res = await fetch(`/api/admin/categories/${category.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !category.isActive })
            });

            if (!res.ok) throw new Error("Failed to update status");

            mutate();
            toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'}`);
        } catch (err) {
            toast.error("Error updating status");
        }
    };

    return (
        <AdminShell
            title="Categories"
            actions={
                <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
            }
        >
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-red-500 p-4">Error loading categories</div>
            ) : (
                <CategoryTree
                    categories={categories}
                    onEdit={handleEdit}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                        <CategoryForm
                            initialData={editingCategory}
                            onClose={() => setIsModalOpen(false)}
                            onSuccess={handleSuccess}
                        />
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
