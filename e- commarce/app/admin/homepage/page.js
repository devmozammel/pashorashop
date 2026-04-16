"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/FormElements";
import { Loader2, Layout, Image as ImageIcon, Sparkles, ShoppingBag, Save, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ui/ImageUpload";
import { cn } from "@/lib/utils";

export default function HomepageSettingsPage() {
    const [config, setConfig] = useState({
        heroTitle: "",
        heroSubtitle: "",
        heroButtonText: "",
        heroButtonLink: "",
        heroImageUrl: "",
        heroProductTitle: "",
        heroProductPrice: "",
        heroProductImage: "",
        heroProductLink: "",
        heroTheme: "light", // light, dark
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/admin/homepage");
                const result = await res.json();
                if (result.ok && result.data) {
                    setConfig(result.data);
                }
            } catch (error) {
                toast.error("Failed to load homepage config");
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/homepage", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            const result = await res.json();
            if (result.ok) {
                toast.success("হোমপেজ সেটিংস সফলভাবে সেভ হয়েছে!");
            } else {
                toast.error(result.message || "Save failed");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Homepage Customization">
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                    <p className="text-gray-500 font-medium">Loading your settings...</p>
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell title="Homepage Customization">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
                
                {/* Header Actions */}
                <div className="flex justify-between items-end border-b pb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">Customization Center</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage your Hero Section and Featured Content live.</p>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: Text & Branding */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Hero Text Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50/50 border-b flex items-center gap-2">
                                <Layout className="w-5 h-5 text-blue-500" />
                                <h3 className="font-bold text-gray-800">Hero Section Details</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Catchy Hero Title (Use \n for new line)</label>
                                    <textarea 
                                        value={config.heroTitle || ""} 
                                        onChange={e => setConfig({...config, heroTitle: e.target.value})}
                                        placeholder="e.g. NEW SUMMER \n COLLECTION"
                                        className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-xl font-black min-h-[100px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Hero Subtitle</label>
                                    <input 
                                        value={config.heroSubtitle || ""} 
                                        onChange={e => setConfig({...config, heroSubtitle: e.target.value})}
                                        placeholder="Add a compelling description..."
                                        className="w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Button Text</label>
                                        <input 
                                            value={config.heroButtonText || ""} 
                                            onChange={e => setConfig({...config, heroButtonText: e.target.value})}
                                            placeholder="e.g. Shop Now"
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Button Link</label>
                                        <input 
                                            value={config.heroButtonLink || ""} 
                                            onChange={e => setConfig({...config, heroButtonLink: e.target.value})}
                                            placeholder="e.g. /shop"
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Product Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50/50 border-b flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-orange-500" />
                                <h3 className="font-bold text-gray-800">Floating Product Promo</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
                                            <input 
                                                value={config.heroProductTitle || ""} 
                                                onChange={e => setConfig({...config, heroProductTitle: e.target.value})}
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price Label</label>
                                            <input 
                                                value={config.heroProductPrice || ""} 
                                                onChange={e => setConfig({...config, heroProductPrice: e.target.value})}
                                                placeholder="e.g. ৳1,200"
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Click Link (URL)</label>
                                            <input 
                                                value={config.heroProductLink || ""} 
                                                onChange={e => setConfig({...config, heroProductLink: e.target.value})}
                                                placeholder="e.g. /shop or /product/slug"
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Promo Product Image</label>
                                        <ImageUpload 
                                            onUploadComplete={url => setConfig({...config, heroProductImage: url})}
                                            value={[config.heroProductImage]}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Visuals Header */}
                    <div className="space-y-8">
                        
                        {/* Main Hero Image */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-emerald-500" />
                                <h3 className="font-bold text-gray-800">Main Hero Image</h3>
                            </div>
                            <div className="p-5 space-y-6">
                                <ImageUpload 
                                    onUploadComplete={url => setConfig({...config, heroImageUrl: url})}
                                    value={[config.heroImageUrl]}
                                />
                                {config.heroImageUrl && (
                                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden border bg-gray-50 flex items-center justify-center">
                                        <img src={config.heroImageUrl} className="w-full h-full object-cover" alt="Preview" />
                                        <button 
                                            onClick={() => setConfig({...config, heroImageUrl: ""})}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Homepage Sections */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b flex items-center gap-2">
                                <Layout className="w-5 h-5 text-indigo-500" />
                                <h3 className="font-bold text-gray-800">Section Visibility</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                {[
                                    { key: 'showFeatured', label: 'Featured Products', color: 'bg-amber-500' },
                                    { key: 'showNewArrivals', label: 'New Arrivals', color: 'bg-purple-600' },
                                    { key: 'showTopSelling', label: 'Top Selling', color: 'bg-emerald-500' },
                                    { key: 'showFlashSale', label: 'Flash Sale Timer', color: 'bg-red-500' }
                                ].map((section) => (
                                    <label key={section.key} className="flex items-center justify-between cursor-pointer group py-1">
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{section.label}</span>
                                        <div className="relative inline-flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={config[section.key]} 
                                                onChange={e => setConfig({...config, [section.key]: e.target.checked})}
                                                className="sr-only peer" 
                                            />
                                            <div className={cn(
                                                "w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
                                                `peer-checked:${section.color}`
                                            )}></div>
                                        </div>
                                    </label>
                                ))}
                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                                    Toggle which sections appear on the main storefront landing page.
                                </p>
                            </div>
                        </div>

                        {/* Theme Settings */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50/50 border-b flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <h3 className="font-bold text-gray-800">Visual Theme</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Section Theme</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setConfig({...config, heroTheme: 'light'})}
                                        className={cn(
                                            "py-3 rounded-xl border-2 font-bold text-sm transition-all",
                                            config.heroTheme === 'light' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        Light Mode
                                    </button>
                                    <button 
                                        onClick={() => setConfig({...config, heroTheme: 'dark'})}
                                        className={cn(
                                            "py-3 rounded-xl border-2 font-bold text-sm transition-all bg-gray-900",
                                            config.heroTheme === 'dark' ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:bg-gray-800"
                                        )}
                                    >
                                        Dark Mode
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
