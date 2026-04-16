"use client";

import CategoriesPage from "../page";

export default function NewCategoryPage() {
    // Since our main Category page has a "New Category" modal built-in, 
    // we can redirect or just render the main page with the modal open if we passed a prop.
    // For simplicity in this scaffold, we will just redirect to the list which has the "Add" button
    // OR, better, duplicate the logic from EditCategoryPage but for new.

    // Let's implement the standalone form for consistency with "Edit"

    const { useState } = require("react");
    const AdminShell = require("@/components/admin/AdminShell").default;
    const { Button, Input } = require("@/components/admin/ui/FormElements");
    const { useRouter } = require("next/navigation");
    const { ArrowLeft, Save } = require("lucide-react");
    const { toast } = require("sonner");

    const router = useRouter();
    const [formData, setFormData] = useState({ name: "", slug: "", sortOrder: 0, isActive: true, showInMegaMenu: true });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                toast?.success("Category created successfully!");
                router.push('/admin/categories');
            } else {
                toast?.error(data.error || "Failed to create category");
            }
        } catch (error) {
            toast?.error("An error occurred while saving");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminShell
            title="New Category"
            actions={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                    <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Create Category</Button>
                </div>
            }
        >
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-6">
                <Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} />
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
