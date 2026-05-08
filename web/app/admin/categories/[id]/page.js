"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditCategoryPage({ params }) {
    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", slug: "", sortOrder: 0, isActive: true, showInMegaMenu: true });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchCategory = async () => {
            if (!params.id) return;
            try {
                const res = await fetch("/api/admin/categories");
                const data = await res.json();
                const category = data.find(c => c.id === params.id);
                if (category) {
                    setFormData({
                        name: category.name || "",
                        slug: category.slug || "",
                        sortOrder: category.sortOrder || 0,
                        isActive: category.isActive ?? true,
                        showInMegaMenu: category.showInMegaMenu ?? true
                    });
                } else {
                    toast?.error("Category not found");
                }
            } catch (err) {
                toast?.error("Error loading category");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategory();
    }, [params.id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/categories/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                toast?.success("Category updated successfully!");
                router.push('/admin/categories');
            } else {
                toast?.error(data.error || "Update failed");
            }
        } catch (error) {
            toast?.error("Error saving category");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminShell
            title="Edit Category"
            actions={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>
            }
        >
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-6">
                <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <Input label="Slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />

                <Input type="number" label="Sort Order" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} />

                <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} /> Active
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={formData.showInMegaMenu} onChange={e => setFormData({ ...formData, showInMegaMenu: e.target.checked })} /> Show in MegaMenu
                    </label>
                </div>
            </div>
        </AdminShell>
    );
}
