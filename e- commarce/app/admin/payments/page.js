"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button, Input } from "@/components/admin/ui/FormElements";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsPage() {
    const [config, setConfig] = useState({ sslcommerzStoreId: "", sslcommerzStorePassword: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                const data = await res.json();
                if (data.ok) {
                    setConfig({
                        sslcommerzStoreId: data.data.sslcommerzStoreId || "",
                        sslcommerzStorePassword: data.data.sslcommerzStorePassword || "",
                    });
                } else {
                    toast.error("Failed to load payment settings");
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
                toast.success("Payment configuration saved!");
            } else {
                toast.error(data.message || "Save failed");
            }
        } catch {
            toast.error("Error saving payment config");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminShell title="Payments Configuration">
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
            </AdminShell>
        );
    }

    return (
        <AdminShell title="Payments Configuration">
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                    <div>
                        <h3 className="font-bold text-lg">SSLCommerz</h3>
                        <p className="text-sm text-gray-500">Configure your SSLCommerz payment gateway credentials.</p>
                    </div>
                </div>
                <Input
                    label="Store ID"
                    value={config.sslcommerzStoreId}
                    onChange={e => setConfig({ ...config, sslcommerzStoreId: e.target.value })}
                    placeholder="Your SSLCommerz Store ID"
                />
                <Input
                    label="Store Password"
                    type="password"
                    value={config.sslcommerzStorePassword}
                    onChange={e => setConfig({ ...config, sslcommerzStorePassword: e.target.value })}
                    placeholder="Your SSLCommerz Store Password"
                />
                <p className="text-xs text-gray-400">
                    ⚠️ These credentials are stored securely in your database and never exposed to the frontend.
                </p>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </AdminShell>
    );
}
