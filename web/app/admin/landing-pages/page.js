"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Plus, Trash, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LandingPages() {
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ title: "", slug: "", heroTitle: "" });

    const fetchPages = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/landing-pages");
            const data = await res.json();
            setPages(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Failed to load landing pages");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleSave = async () => {
        if (!formData.title || !formData.slug) return toast.error("Title and slug are required");
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/landing-pages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success("Landing page created!");
                fetchPages();
                setIsModalOpen(false);
                setFormData({ title: "", slug: "", heroTitle: "" });
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to create page");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete landing page?")) return;
        try {
            const res = await fetch(`/api/admin/landing-pages/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Page deleted");
                fetchPages();
            } else {
                toast.error("Failed to delete page");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const columns = [
        { header: "Title", accessor: "title" },
        { header: "Slug", accessor: "slug" },
        {
            header: "Preview",
            cell: (row) => (
                <a href={`/lp/${row.slug}`} target="_blank" className="text-blue-600 flex items-center gap-1 hover:underline">
                    View <ExternalLink className="w-3 h-3" />
                </a>
            )
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Link href={`/admin/landing-pages/${row.id}`} className="inline-flex items-center justify-center bg-black hover:bg-black/90 text-white text-xs font-bold px-3 py-1.5 rounded transition-all">
                        Edit
                    </Link>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(row.id)}><Trash className="w-4 h-4" /></Button>
                </div>
            )
        }
    ];

    return (
        <AdminShell
            title="Landing Pages"
            actions={<Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> New LP</Button>}
        >
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <DataTable columns={columns} data={pages} searchKey="title" />
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
                        <h2 className="text-xl font-bold">New Landing Page</h2>
                        <Input label="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} />
                        <Input label="Slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                        <Input label="Hero Title" value={formData.heroTitle} onChange={e => setFormData({ ...formData, heroTitle: e.target.value })} />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
