"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Plus, Edit, Trash2, Loader2, Layers, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SubcategoryGroupsPage() {
    const [groups, setGroups] = useState([]);
    const [categories, setCategories] = useState([]); // Parent categories for dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        categoryId: "",
        sortOrder: 0,
        isActive: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [groupRes, catRes] = await Promise.all([
                fetch("/api/admin/subcategory-groups"),
                fetch("/api/admin/categories")
            ]);

            const groupData = await groupRes.json();
            const catData = await catRes.json();

            if (Array.isArray(groupData)) setGroups(groupData);
            if (Array.isArray(catData)) setCategories(catData);

        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ name: "", slug: "", categoryId: "", sortOrder: 0, isActive: true });
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            slug: item.slug,
            categoryId: item.categoryId,
            sortOrder: item.sortOrder,
            isActive: item.isActive
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(`/api/admin/subcategory-groups/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Deleted");
                fetchData();
            } else {
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingItem
                ? `/api/admin/subcategory-groups/${editingItem.id}`
                : "/api/admin/subcategory-groups";

            const method = editingItem ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(editingItem ? "Updated" : "Created");
                setIsModalOpen(false);
                fetchData();
            } else {
                toast.error(data.error || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredItems = groups.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminShell
            title="Subcategory Groups"
            actions={
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    New Group
                </button>
            }
        >
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No groups found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Name</th>
                                    <th className="px-6 py-3">Parent Category</th>
                                    <th className="px-6 py-3">Slug</th>
                                    <th className="px-6 py-3">Products</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-3 text-blue-600">{item.category?.name || "-"}</td>
                                        <td className="px-6 py-3 font-mono text-xs text-gray-500">{item.slug}</td>
                                        <td className="px-6 py-3">{item._count?.products || 0}</td>
                                        <td className="px-6 py-3">
                                            {item.isActive ? (
                                                <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                                                    <CheckCircle className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-500 text-xs font-bold">
                                                    <XCircle className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button onClick={() => handleEdit(item)} className="text-gray-500 hover:text-blue-600 mr-2">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="text-gray-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-bold">{editingItem ? "Edit Group" : "New Group"}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name / Title</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Slug (Optional)</label>
                                <input
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Auto-generated if empty"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Category</label>
                                <select
                                    required
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Sort Order</label>
                                <input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2">
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
