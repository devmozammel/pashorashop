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
    const [productsList, setProductsList] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        heroTitle: "",
        heroDescription: "",
        heroImageUrl: "",
        heroBtn: "",
        heroLink: "",
        ctaText: "",
        countdownEnd: "",
        discountCode: "",
        showTestimonials: false,
        productId: "",
        isActive: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [lpRes, productsRes] = await Promise.all([
                fetch(`/api/admin/landing-pages/${params.id}`),
                fetch("/api/admin/products")
            ]);

            if (lpRes.ok) {
                const data = await lpRes.json();
                
                // Format date to local string suitable for datetime-local input (YYYY-MM-DDTHH:MM)
                let formattedDate = "";
                if (data.countdownEnd) {
                    const d = new Date(data.countdownEnd);
                    const pad = (num) => String(num).padStart(2, '0');
                    formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                }

                setFormData({
                    title: data.title || "",
                    slug: data.slug || "",
                    heroTitle: data.heroTitle || "",
                    heroDescription: data.heroDescription || "",
                    heroImageUrl: data.heroImageUrl || "",
                    heroBtn: data.heroBtn || "",
                    heroLink: data.heroLink || "",
                    ctaText: data.ctaText || "অর্ডার করুন এখনই",
                    countdownEnd: formattedDate,
                    discountCode: data.discountCode || "",
                    showTestimonials: data.showTestimonials ?? false,
                    productId: data.products?.[0]?.productId || "",
                    isActive: data.isActive ?? true,
                });
            }

            if (productsRes.ok) {
                const productsData = await productsRes.json();
                setProductsList(Array.isArray(productsData) ? productsData : []);
            }
        } catch (error) {
            console.error("Error loading landing page data:", error);
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

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/landing-pages">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Landing Page</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
                
                {/* Basic Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Internal Title" name="title" value={formData.title} onChange={handleChange} required />
                        <Input label="Slug" name="slug" value={formData.slug} onChange={handleChange} required disabled={formData.slug === 'home'} />
                    </div>
                </div>

                {/* Product Association */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2">Associated Product</h3>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Linked Product (Runs checkout for this product)</label>
                        <select
                            name="productId"
                            value={formData.productId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                            required
                        >
                            <option value="">-- Select a Product --</option>
                            {productsList.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                    {prod.name} (৳{prod.price})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2">Hero Section</h3>
                    <Input label="Hero Title" name="heroTitle" value={formData.heroTitle} onChange={handleChange} />
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Hero Description</label>
                        <textarea
                            name="heroDescription"
                            value={formData.heroDescription}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            rows={3}
                        />
                    </div>
                    
                    <Input label="Hero Image URL (Leave blank to use primary product image)" name="heroImageUrl" value={formData.heroImageUrl} onChange={handleChange} placeholder="/hero-bg.jpg" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Hero Button Text" name="heroBtn" value={formData.heroBtn} onChange={handleChange} placeholder="অর্ডার করুন এখনই" />
                        <Input label="Hero Button Link (Default is express checkout)" name="heroLink" value={formData.heroLink} onChange={handleChange} placeholder="" />
                        <Input label="CTA Button Text" name="ctaText" value={formData.ctaText} onChange={handleChange} placeholder="Buy Now / অর্ডার করুন এখনই" />
                    </div>
                </div>

                {/* Promotion & Features */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold border-b pb-2">Promotion & Offers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Countdown End Time (Leave blank to hide timer)</label>
                            <input
                                type="datetime-local"
                                name="countdownEnd"
                                value={formData.countdownEnd}
                                onChange={handleChange}
                                className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            />
                        </div>
                        <Input label="Discount Coupon Code" name="discountCode" value={formData.discountCode} onChange={handleChange} placeholder="e.g. SAVE10" />
                    </div>

                    <div className="flex gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showTestimonials"
                                name="showTestimonials"
                                checked={formData.showTestimonials}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="showTestimonials" className="text-sm font-medium">Show Customer Testimonials</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium">Page Active</label>
                        </div>
                    </div>
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
