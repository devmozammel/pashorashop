"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Input, Badge } from "@/components/admin/ui/FormElements";
import { Plus, Trash, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BannersPage() {
    const [banners, setBanners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ text: "", link: "", isActive: true, startAt: "", endAt: "" });

    const fetchBanners = async () => {
        try {
            const res = await fetch("/api/admin/banners");
            if (!res.ok) throw new Error("Failed to load banners");
            const data = await res.json();
            setBanners(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleSave = async () => {
        if (!formData.text.trim()) {
            toast.error("Banner text is required");
            return;
        }
        setIsSaving(true);
        try {
            const method = editingId ? "PATCH" : "POST";
            const payload = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch("/api/admin/banners", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save banner");
            }
            toast.success(editingId ? "Banner updated" : "Banner created");
            setIsModalOpen(false);
            setEditingId(null);
            setFormData({ text: "", link: "", isActive: true, startAt: "", endAt: "" });
            fetchBanners();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (banner) => {
        setEditingId(banner.id);
        setFormData({
            text: banner.text,
            link: banner.link || "",
            isActive: banner.isActive,
            startAt: banner.startAt ? new Date(banner.startAt).toISOString().split('T')[0] : "",
            endAt: banner.endAt ? new Date(banner.endAt).toISOString().split('T')[0] : ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this banner?")) return;
        try {
            const res = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete banner");
            toast.success("Banner deleted");
            setBanners(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            toast.error(err.message);
        }
    };

    const columns = [
        { header: "Text", accessor: "text" },
        { header: "Link", cell: (row) => row.link || <span className="text-gray-400">-</span> },
        {
            header: "Status",
            cell: (row) => <Badge variant={row.isActive ? "success" : "default"}>{row.isActive ? "Active" : "Inactive"}</Badge>
        },
        {
            header: "Start",
            cell: (row) => row.startAt ? new Date(row.startAt).toLocaleDateString() : <span className="text-gray-400">-</span>
        },
        {
            header: "End",
            cell: (row) => row.endAt ? new Date(row.endAt).toLocaleDateString() : <span className="text-gray-400">-</span>
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
                        Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id)}>
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <AdminShell
            title="Banners"
            actions={
                <Button onClick={() => {
                    setEditingId(null);
                    setFormData({ text: "", link: "", isActive: true, startAt: "", endAt: "" });
                    setIsModalOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Banner
                </Button>
            }
        >
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable columns={columns} data={banners} searchKey="text" />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
                        <h2 className="text-xl font-bold">{editingId ? "Edit Banner" : "New Announcement Banner"}</h2>
                        <Input
                            label="Announcement Text"
                            value={formData.text}
                            onChange={e => setFormData({ ...formData, text: e.target.value })}
                            placeholder="e.g. Free shipping on orders over ৳999!"
                        />
                        <Input
                            label="Link (Optional)"
                            value={formData.link}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://..."
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" label="Start Date" value={formData.startAt} onChange={e => setFormData({ ...formData, startAt: e.target.value })} />
                            <Input type="date" label="End Date" value={formData.endAt} onChange={e => setFormData({ ...formData, endAt: e.target.value })} />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            <span className="text-sm font-medium">Active</span>
                        </label>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => {
                                setIsModalOpen(false);
                                setEditingId(null);
                            }}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Banner"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
