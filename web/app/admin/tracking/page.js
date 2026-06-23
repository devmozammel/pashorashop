"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TrackingPage() {
    const [config, setConfig] = useState({ facebookPixelId: "", facebookConversionToken: "", tiktokPixelId: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.ok) {
                    setConfig({
                        facebookPixelId: data.data.facebookPixelId || "",
                        facebookConversionToken: data.data.facebookConversionToken || "",
                        tiktokPixelId: data.data.tiktokPixelId || "",
                    });
                } else {
                    toast.error("Failed to load tracking settings");
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
                body: JSON.stringify(config),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Tracking configuration saved!");
            } else {
                toast.error(data.message || "Save failed");
            }
        } catch {
            toast.error("Error saving tracking config");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Tracking & Analytics">
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            </AdminShell>
        );
    }

    return (
        <AdminShell title="Tracking & Analytics">
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-6">
                <h3 className="font-bold text-lg">Facebook Pixel (Meta)</h3>
                <p className="text-sm text-gray-500">
                    Enter your Facebook Pixel ID to track visitors and conversions.
                </p>
                <Input
                    label="Pixel ID"
                    value={config.facebookPixelId}
                    onChange={e => setConfig({ ...config, facebookPixelId: e.target.value })}
                    placeholder="e.g. 1234567890123456"
                />
                <Input
                    label="Conversion API Token"
                    type="password"
                    value={config.facebookConversionToken}
                    onChange={e => setConfig({ ...config, facebookConversionToken: e.target.value })}
                    placeholder="Your server-side API token"
                />
                
                <hr className="border-t my-6" />
                
                <h3 className="font-bold text-lg">TikTok Pixel</h3>
                <p className="text-sm text-gray-500">
                    Enter your TikTok Pixel ID to track visitors and conversions.
                </p>
                <Input
                    label="TikTok Pixel ID"
                    value={config.tiktokPixelId}
                    onChange={e => setConfig({ ...config, tiktokPixelId: e.target.value })}
                    placeholder="e.g. CQS1234567890"
                />
                
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </AdminShell>
    );
}
