"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: "", currencySymbol: "", supportEmail: "", whatsapp: "", address: "",
        deliveryFeeInside: 60, deliveryFeeOutside: 120,
        facebookPixelId: "", facebookConversionToken: "",
        maintenanceMode: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.ok) {
                    setSettings(data.data);
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Settings saved successfully!");
                setSettings(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminShell title="Store Settings">
            {isLoading ? (
                <div className="flex justify-center flex-col items-center py-20 bg-white rounded-xl shadow-sm border">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading settings...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Store Information</h3>
                        <Input label="Site Name" value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Currency Symbol" value={settings.currencySymbol} onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })} />
                            <Input label="WhatsApp Number" value={settings.whatsapp || ''} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="e.g. 01XXXXXXXXX" />
                        </div>
                        <Input label="Support Email" value={settings.supportEmail} onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} />
                        <Input label="Office Address" value={settings.address || ''} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                    </div>

                    {/* Shipping & Meta */}
                    <div className="space-y-8">
                        {/* Shipping */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-900 border-b pb-2">Shipping Rates</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Inside Dhaka (BDT)" type="number" value={settings.deliveryFeeInside} onChange={e => setSettings({ ...settings, deliveryFeeInside: e.target.value })} />
                                <Input label="Outside Dhaka (BDT)" type="number" value={settings.deliveryFeeOutside} onChange={e => setSettings({ ...settings, deliveryFeeOutside: e.target.value })} />
                            </div>
                        </div>

                        {/* Marketing */}
                        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
                            <h3 className="font-bold text-gray-900 border-b pb-2">Marketing & Analytics</h3>
                            <Input label="Facebook Pixel ID" value={settings.facebookPixelId || ''} onChange={e => setSettings({ ...settings, facebookPixelId: e.target.value })} />
                            <Input label="Conversion API Token" value={settings.facebookConversionToken || ''} onChange={e => setSettings({ ...settings, facebookConversionToken: e.target.value })} />
                        </div>

                        {/* Maintenance Mode */}
                        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">Maintenance Mode</h3>
                                    <p className="text-sm text-gray-500">Enable this to lock the site for visitors during updates.</p>
                                </div>
                                <div 
                                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                    className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-200 ${settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${settings.maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            {settings.maintenanceMode && (
                                <p className="text-xs text-red-600 font-medium">⚠️ Visitors will see the maintenance screen. Only Admins can access the site.</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2 pt-2 flex items-center justify-end gap-3">
                        <Button onClick={handleSave} disabled={isSaving} className="px-10 h-12 text-base">
                            {isSaving ? "Saving..." : "Save All Settings"}
                        </Button>
                        {isSaving && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
