"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ShippingPage() {
    const [settings, setSettings] = useState({ deliveryFeeInside: 60, deliveryFeeOutside: 120 });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.ok) {
                    setSettings({
                        deliveryFeeInside: data.data.deliveryFeeInside ?? 60,
                        deliveryFeeOutside: data.data.deliveryFeeOutside ?? 120,
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
                <p className="text-sm text-gray-500">
                    These fees are applied at checkout based on the customer's delivery area.
                </p>
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
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </AdminShell>
    );
}
