"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditLandingPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        heroTitle: "",
        heroDescription: "",
        heroImage: "",
        heroButtonText: "",
        heroButtonLink: "",
        isActive: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // In a real app, you'd fetch specific ID. For now, we might just have one home page
            // Or fetch all and find the one matching ID
            // Ideally: /api/admin/landing-pages/${params.id}
            const res = await fetch(`/api/admin/landing-pages/${params.id}`);
            // Note: Reuse existing API or create specific GET by ID if missing.
            // If the API returns a list, find the item. 
            // If the API returns the item, use it.
            // Let's assume the user has a route for getting a single LP or we use the list one.

            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setFormData({
                title: data.title || "",
                slug: data.slug || "",
                heroTitle: data.heroTitle || "",
                heroDescription: data.heroDescription || "",
                heroImage: data.heroImage || "",
                heroButtonText: data.heroButtonText || "",
                heroButtonLink: data.heroButtonLink || "",
                isActive: data.isActive ?? true,
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/landing-pages/${params.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to save");
            router.refresh();
            router.push("/admin/landing-pages");
        } catch (error) {
            alert("Error saving landing page");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/landing-pages">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Landing Page</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4 max-w-2xl">
                <Input label="Internal Title" name="title" value={formData.title} onChange={handleChange} required />
                <Input label="Slug" name="slug" value={formData.slug} onChange={handleChange} required disabled={formData.slug === 'home'} />

                <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Hero Section</h3>
                    <div className="space-y-4">
                        <Input label="Hero Title" name="heroTitle" value={formData.heroTitle} onChange={handleChange} />
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Hero Description</label>
                            <textarea
                                name="heroDescription"
                                value={formData.heroDescription}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                rows={3}
                            />
                        </div>
                        <Input label="Hero Image URL" name="heroImage" value={formData.heroImage} onChange={handleChange} placeholder="/hero-bg.jpg" />

                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Button Text" name="heroButtonText" value={formData.heroButtonText} onChange={handleChange} placeholder="Shop Now" />
                            <Input label="Button Link" name="heroButtonLink" value={formData.heroButtonLink} onChange={handleChange} placeholder="/category/men" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
