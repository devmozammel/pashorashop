"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { InboxSubNav } from "@/components/admin/inbox/InboxShared";
import { toast } from "sonner";
import { Save, Loader2, Copy, KeyRound, Truck, Globe, Eye, EyeOff, PhoneCall, ExternalLink } from "lucide-react";

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
                toast.success("Facebook ও WhatsApp API Credentials নিরাপদভাবে (AES-256) সেভ হয়েছে!");
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

    return (
        <AdminShell title="Facebook & WhatsApp API">
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
                    {/* Unified Meta Webhook URL Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
                        <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-2 text-balance">
                            <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Meta Webhook URL (Facebook Page + WhatsApp উভয়ের জন্য একই URL)
                        </h2>
                        <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-700">Callback URL:</p>
                                <code className="text-xs text-emerald-700 block truncate" translate="no">
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
                        <p className="text-xs text-emerald-800 text-pretty">
                            Meta Developer Dashboard (developers.facebook.com) → আপনার App-এ Facebook Messenger ও WhatsApp দুইটি প্রোডাক্টের Webhook-এ উপরের একই URL ও নিচের Verify Token বসাবেন।
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Facebook Page / Messenger */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                <KeyRound className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                                Facebook Page (Messenger ও Post Comments)
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <div>
                                <label htmlFor="fb-page-id" className="text-xs font-semibold text-gray-700">
                                    Facebook Page ID
                                </label>
                                <input
                                    id="fb-page-id"
                                    type="text"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="e.g. 102938475610293"
                                    value={settings.fbPageId || ""}
                                    onChange={(e) => setSettings({ ...settings, fbPageId: e.target.value })}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <SecretInput
                                id="fb-page-token"
                                label="Facebook Page Access Token"
                                placeholder="EAA..."
                                value={settings.fbPageAccessToken}
                                onChange={(e) => setSettings({ ...settings, fbPageAccessToken: e.target.value })}
                            />
                        </div>

                        {/* WhatsApp Cloud API + Steadfast Card */}
                        <div className="space-y-6">
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                    WhatsApp Cloud API (Official Meta Free Tier)
                                </h2>
                                <div>
                                    <label htmlFor="wa-phone-id" className="text-xs font-semibold text-gray-700">
                                        WhatsApp Phone Number ID
                                    </label>
                                    <input
                                        id="wa-phone-id"
                                        type="text"
                                        autoComplete="off"
                                        spellCheck={false}
                                        placeholder="e.g. 482910384729104"
                                        value={settings.waPhoneNumberId || ""}
                                        onChange={(e) => setSettings({ ...settings, waPhoneNumberId: e.target.value })}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SecretInput
                                    id="wa-access-token"
                                    label="WhatsApp Permanent Access Token"
                                    placeholder="EAA..."
                                    value={settings.waAccessToken}
                                    onChange={(e) => setSettings({ ...settings, waAccessToken: e.target.value })}
                                />
                            </div>

                            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                                        Steadfast Courier ও Fraud Check সংযুক্ত আছে
                                    </h3>
                                    <p className="text-xs text-blue-800 text-pretty">
                                        ইনবক্স থেকে ১-ক্লিক অর্ডার বুকিং ও ফ্রড চেক সরাসরি আপনার মূল Shipping Settings-এর Steadfast API Key ব্যবহার করে।
                                    </p>
                                </div>
                                <Link
                                    href="/admin/settings"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <span>Steadfast Settings</span>
                                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                                </Link>
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
