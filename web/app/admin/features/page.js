"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui/FormElements";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FeaturesPage() {
    const [toggles, setToggles] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchToggles();
    }, []);

    const fetchToggles = async () => {
        try {
            const res = await fetch("/api/admin/features");
            const data = await res.json();
            if (data.ok) {
                setToggles(data.data);
            }
        } catch (error) {
            toast.error("Failed to load toggles");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/features", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toggles)
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Features updated! Please refresh the page to see changes in the sidebar.");
            } else {
                toast.error(data.message || "Failed to update features");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminShell title="Feature Toggles">
            <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-4">
                <p className="text-gray-500 mb-6 text-sm">
                    Toggle experimental or incomplete features on or off. Turning a feature off will hide it from the sidebar navigation.
                </p>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {Object.keys(toggles).map(key => (
                            <label key={key} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <input
                                    type="checkbox"
                                    checked={toggles[key]}
                                    onChange={e => setToggles({ ...toggles, [key]: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </label>
                        ))}

                        <div className="pt-4 flex items-center gap-3">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Toggles"}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </AdminShell>
    );
}
