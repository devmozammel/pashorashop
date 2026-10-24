"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ShippingPage() {
    const [settings, setSettings] = useState({
        deliveryFeeInside: 70,
        deliveryFeeOutside: 130,
        steadfastApiKey: "",
        steadfastSecretKey: ""
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.ok) {
                    setSettings({
                        deliveryFeeInside: data.data.deliveryFeeInside ?? 70,
                        deliveryFeeOutside: data.data.deliveryFeeOutside ?? 130,
                        steadfastApiKey: data.data.steadfastApiKey ?? "",
                        steadfastSecretKey: data.data.steadfastSecretKey ?? "",
                    });
                } else {
                    toast.error("Failed to load shipping settings");
                }
            } catch {
                toast.error("Error loading settings");
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
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Shipping settings saved!");
                setSettings({
                    deliveryFeeInside: data.data.deliveryFeeInside,
                    deliveryFeeOutside: data.data.deliveryFeeOutside,
                    steadfastApiKey: data.data.steadfastApiKey ?? "",
                    steadfastSecretKey: data.data.steadfastSecretKey ?? "",
                });
            } else {
                toast.error(data.message || "Save failed");
            }
        } catch {
            toast.error("Error saving settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Shipping Configuration">
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            </AdminShell>
        );
    }

    return (
        <AdminShell title="Shipping Configuration">
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-6">
                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Delivery Fees</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        These fees are applied at checkout based on the customer's delivery area.
                    </p>
                    <div className="space-y-4">
                        <Input
                            label="Inside Dhaka Fee (BDT)"
                            type="number"
                            min="0"
                            value={settings.deliveryFeeInside}
                            onChange={e => setSettings({ ...settings, deliveryFeeInside: Number(e.target.value) })}
                        />
                        <Input
                            label="Outside Dhaka Fee (BDT)"
                            type="number"
                            min="0"
                            value={settings.deliveryFeeOutside}
                            onChange={e => setSettings({ ...settings, deliveryFeeOutside: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Steadfast Courier Integration</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Configure your Steadfast credentials to allow booking orders directly from order details.
                    </p>
                    <div className="space-y-4">
                        <Input
                            label="API Key"
                            type="text"
                            placeholder="e.g. ggstmv0g9qbyplpueeyptlre4w6b..."
                            value={settings.steadfastApiKey}
                            onChange={e => setSettings({ ...settings, steadfastApiKey: e.target.value })}
                        />
                        <Input
                            label="Secret Key"
                            type="password"
                            placeholder="e.g. ca6bc3ltmy68nybeaw96mup"
                            value={settings.steadfastSecretKey}
                            onChange={e => setSettings({ ...settings, steadfastSecretKey: e.target.value })}
                        />
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h5 className="text-xs font-bold text-emerald-900">Steadfast অটোমেটিক ডেলিভারি ও ক্যানসেল ট্র্যাকিং (Webhook URL)</h5>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed mb-2.5">
                            Steadfast মার্চেন্ট পোর্টালে (Settings &gt; Webhook / Callback URL) নিচের লিংকটি সেট করে দিলে, পার্সেল ডেলিভারি (Delivered) বা ক্যানসেল (Cancelled) হওয়া মাত্র সাথে সাথে স্বয়ংক্রিয়ভাবে আপনার ওয়েবসাইটের অর্ডার স্ট্যাটাস ও পেমেন্ট আপডেট হয়ে যাবে:
                        </p>
                        <div className="flex items-center gap-2">
                            <code className="text-xs bg-white px-3 py-2 rounded-lg border border-emerald-300 font-mono text-emerald-950 flex-1 select-all font-semibold">
                                https://www.pashorashop.com/api/webhooks/steadfast
                            </code>
                        </div>
                    </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </AdminShell>
    );
}
