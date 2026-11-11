"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { InboxSubNav } from "@/components/admin/inbox/InboxShared";
import { toast } from "sonner";
import { Save, Loader2, Copy, KeyRound, Truck, Bot, Globe, Eye, EyeOff } from "lucide-react";

function SecretInput({ id, label, value, onChange, placeholder = "" }) {
    const [visible, setVisible] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="text-xs font-semibold text-gray-700">
                {label}
            </label>
            <div className="relative mt-1">
                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={onChange}
                    className="w-full text-sm border border-gray-200 rounded-lg pl-3 pr-9 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                    className="absolute right-2 top-1.5 p-1 rounded text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    {visible ? (
                        <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                </button>
            </div>
        </div>
    );
}

export default function InboxSettingsPage() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/inbox/settings")
            .then((r) => r.json())
            .then((data) => {
                if (data.ok) {
                    setSettings(data.data);
                } else {
                    toast.error(data.message || "শুধুমাত্র Super Admin API keys দেখতে পারবেন");
                }
            })
            .catch(() => toast.error("সেটিংস লোড করা যায়নি"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/inbox/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.ok) {
                setSettings(data.data);
                toast.success("সব API Credentials নিরাপদভাবে (AES-256) সেভ হয়েছে!");
            } else {
                toast.error(data.message || "সেভ করা যায়নি");
            }
        } catch {
            toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
        } finally {
            setSaving(false);
        }
    };

    const copyText = (txt) => {
        navigator.clipboard.writeText(txt);
        toast.success("কপি করা হয়েছে!");
    };

    const origin = typeof window !== "undefined" ? window.location.origin : "https://pashorashop.com";
    const metaWebhookUrl = `${origin}/api/webhooks/meta`;
    const tiktokWebhookUrl = `${origin}/api/webhooks/tiktok`;

    return (
        <AdminShell title="Inbox API Integrations">
            <InboxSubNav />

            {loading ? (
                <div role="status" aria-live="polite" className="py-20 text-center bg-white rounded-xl border border-gray-200">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" aria-hidden="true" />
                    <p className="text-xs text-gray-500">লোড হচ্ছে…</p>
                </div>
            ) : !settings ? (
                <div role="alert" className="p-8 bg-white rounded-xl border border-rose-200 text-center text-rose-700 font-semibold">
                    শুধুমাত্র ADMIN ইউজার API Credentials দেখতে ও পরিবর্তন করতে পারবেন।
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Webhook URLs Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                        <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-2 text-balance">
                            <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Meta ও TikTok Webhook URLs (Developer Dashboard-এ বসান)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-700">Meta (FB / IG / WhatsApp) Webhook:</p>
                                    <code className="text-emerald-700 block truncate" translate="no">
                                        {metaWebhookUrl}
                                    </code>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Copy Meta Webhook URL"
                                    onClick={() => copyText(metaWebhookUrl)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-700">TikTok Lead / Ad Webhook (with x-webhook-secret):</p>
                                    <code className="text-emerald-700 block truncate" translate="no">
                                        {tiktokWebhookUrl}
                                    </code>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Copy TikTok Webhook URL"
                                    onClick={() => copyText(tiktokWebhookUrl)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gemini AI */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                <Bot className="w-4 h-4 text-violet-600 shrink-0" aria-hidden="true" />
                                Gemini AI কো-পাইলট
                            </h2>
                            <SecretInput
                                id="gemini-api-key"
                                label="Gemini API Key"
                                placeholder="AIzaSy…"
                                value={settings.geminiApiKey}
                                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                            />
                            <div>
                                <label htmlFor="gemini-model" className="text-xs font-semibold text-gray-700">
                                    Gemini Model
                                </label>
                                <select
                                    id="gemini-model"
                                    value={settings.geminiModel || "gemini-2.5-flash"}
                                    onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 bg-white text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Ultra Low Cost)</option>
                                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                                </select>
                            </div>
                            <SecretInput
                                id="tiktok-webhook-secret"
                                label="TikTok Webhook Secret (x-webhook-secret)"
                                placeholder="pashora_tiktok_verify_2026…"
                                value={settings.tiktokWebhookSecret}
                                onChange={(e) => setSettings({ ...settings, tiktokWebhookSecret: e.target.value })}
                            />
                        </div>

                        {/* Meta (FB, IG, WhatsApp) */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                                Meta (Facebook Page, Instagram & WhatsApp Cloud API)
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="meta-verify-token" className="text-xs font-semibold text-gray-700">
                                        Webhook Verify Token
                                    </label>
                                    <input
                                        id="meta-verify-token"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.metaVerifyToken || ""}
                                        onChange={(e) => setSettings({ ...settings, metaVerifyToken: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SecretInput
                                    id="meta-app-secret"
                                    label="Meta App Secret"
                                    value={settings.metaAppSecret}
                                    onChange={(e) => setSettings({ ...settings, metaAppSecret: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="fb-page-id" className="text-xs font-semibold text-gray-700">
                                        FB Page ID
                                    </label>
                                    <input
                                        id="fb-page-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.fbPageId || ""}
                                        onChange={(e) => setSettings({ ...settings, fbPageId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="ig-account-id" className="text-xs font-semibold text-gray-700">
                                        IG Business Account ID
                                    </label>
                                    <input
                                        id="ig-account-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.igAccountId || ""}
                                        onChange={(e) => setSettings({ ...settings, igAccountId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <SecretInput
                                id="fb-page-token"
                                label="FB Page / IG Access Token"
                                value={settings.fbPageAccessToken}
                                onChange={(e) => setSettings({ ...settings, fbPageAccessToken: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="wa-phone-id" className="text-xs font-semibold text-gray-700">
                                        WhatsApp Phone Number ID
                                    </label>
                                    <input
                                        id="wa-phone-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.waPhoneNumberId || ""}
                                        onChange={(e) => setSettings({ ...settings, waPhoneNumberId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SecretInput
                                    id="wa-access-token"
                                    label="WhatsApp Cloud Token"
                                    value={settings.waAccessToken}
                                    onChange={(e) => setSettings({ ...settings, waAccessToken: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Pathao Courier */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                <Truck className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                                Pathao Courier API (Steadfast আগে থেকেই Shipping-এ সেট করা আছে)
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="pathao-client-id" className="text-xs font-semibold text-gray-700">
                                        Client ID
                                    </label>
                                    <input
                                        id="pathao-client-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.pathaoClientId || ""}
                                        onChange={(e) => setSettings({ ...settings, pathaoClientId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SecretInput
                                    id="pathao-client-secret"
                                    label="Client Secret"
                                    value={settings.pathaoClientSecret}
                                    onChange={(e) => setSettings({ ...settings, pathaoClientSecret: e.target.value })}
                                />
                                <div>
                                    <label htmlFor="pathao-username" className="text-xs font-semibold text-gray-700">
                                        Merchant Email/Username
                                    </label>
                                    <input
                                        id="pathao-username"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.pathaoUsername || ""}
                                        onChange={(e) => setSettings({ ...settings, pathaoUsername: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SecretInput
                                    id="pathao-password"
                                    label="Merchant Password"
                                    value={settings.pathaoPassword}
                                    onChange={(e) => setSettings({ ...settings, pathaoPassword: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label htmlFor="pathao-store-id" className="text-xs font-semibold text-gray-700">
                                        Pathao Store ID
                                    </label>
                                    <input
                                        id="pathao-store-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.pathaoStoreId || ""}
                                        onChange={(e) => setSettings({ ...settings, pathaoStoreId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <label htmlFor="pathao-sandbox" className="flex items-center gap-2 text-xs font-semibold text-gray-700 pt-5 cursor-pointer select-none">
                                    <input
                                        id="pathao-sandbox"
                                        type="checkbox"
                                        checked={Boolean(settings.pathaoSandbox)}
                                        onChange={(e) => setSettings({ ...settings, pathaoSandbox: e.target.checked })}
                                        className="rounded text-emerald-600 focus-visible:ring-emerald-500"
                                    />
                                    Sandbox Mode
                                </label>
                            </div>
                        </div>

                        {/* RedX Courier */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                <Truck className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
                                RedX Courier API
                            </h2>
                            <SecretInput
                                id="redx-api-token"
                                label="RedX API Access Token"
                                value={settings.redxApiToken}
                                onChange={(e) => setSettings({ ...settings, redxApiToken: e.target.value })}
                            />
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label htmlFor="redx-store-id" className="text-xs font-semibold text-gray-700">
                                        Pickup Store ID (Optional)
                                    </label>
                                    <input
                                        id="redx-store-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={settings.redxStoreId || ""}
                                        onChange={(e) => setSettings({ ...settings, redxStoreId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <label htmlFor="redx-sandbox" className="flex items-center gap-2 text-xs font-semibold text-gray-700 pt-5 cursor-pointer select-none">
                                    <input
                                        id="redx-sandbox"
                                        type="checkbox"
                                        checked={Boolean(settings.redxSandbox)}
                                        onChange={(e) => setSettings({ ...settings, redxSandbox: e.target.checked })}
                                        className="rounded text-emerald-600 focus-visible:ring-emerald-500"
                                    />
                                    Sandbox Mode
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-sm disabled:opacity-50 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Save className="w-4 h-4" aria-hidden="true" />
                            )}
                            <span>{saving ? "সেভ হচ্ছে…" : "সব সেটিংস সেভ করুন"}</span>
                        </button>
                    </div>
                </form>
            )}
        </AdminShell>
    );
}
