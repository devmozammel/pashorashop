"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

export default function SettingsHub() {
    const [activeTab, setActiveTab] = useState("general");
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const tabs = [
        { id: "general", label: "General Store" },
        { id: "ui", label: "UI & Home" },
        { id: "shop", label: "Shop & Products" },
        { id: "checkout", label: "Checkout & Payment" },
        { id: "orders", label: "Orders & Tracking" },
    ];

    // Fetch settings on load
    useEffect(() => {
        fetch("/api/settings")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load settings");
                return res.json();
            })
            .then((data) => {
                // Ensure all groups exist
                tabs.forEach(tab => {
                    if (!data[tab.id]) data[tab.id] = [];
                });
                setSettings(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
                setMessage("Error loading settings");
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        try {
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error("Failed to save");

            setMessage("Settings saved successfully!");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            console.error(err);
            setMessage("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (group, key, value) => {
        setSettings((prev) => {
            const groupSettings = prev[group] || [];
            const index = groupSettings.findIndex((s) => s.key === key);

            let newGroupSettings = [...groupSettings];
            if (index >= 0) {
                newGroupSettings[index] = { ...newGroupSettings[index], value };
            } else {
                // Should not happen if seeded, but handle dynamic addition if needed
                newGroupSettings.push({ key, value, group, type: "text" });
            }

            return { ...prev, [group]: newGroupSettings };
        });
    };

    const handleToggle = (group, key, currentVal) => {
        // Determine the new value: if it was "true" string or boolean true, toggle to false
        const boolVal = String(currentVal) === "true";
        handleChange(group, key, String(!boolVal));
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Settings Hub</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.includes("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                    {message}
                </div>
            )}

            <div className="flex space-x-1 border-b overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                {settings[activeTab]?.length === 0 && (
                    <p className="text-muted-foreground italic">No settings found for this section.</p>
                )}

                {settings[activeTab]?.map((setting) => (
                    <div key={setting.key} className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor={setting.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {setting.key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                            </label>
                            {setting.type === "boolean" && (
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={String(setting.value) === "true"}
                                    onClick={() => handleToggle(activeTab, setting.key, setting.value)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${String(setting.value) === "true" ? "bg-primary" : "bg-input"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${String(setting.value) === "true" ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            )}
                        </div>

                        {(setting.type === "text" || setting.type === "json") && (
                            <input
                                id={setting.key}
                                type="text"
                                value={setting.value}
                                onChange={(e) => handleChange(activeTab, setting.key, e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        )}
                        {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
