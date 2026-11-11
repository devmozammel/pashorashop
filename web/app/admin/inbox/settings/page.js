"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import {
    InboxSubNav,
    MessengerLogo,
    FacebookCommentLogo,
    WhatsAppLogo,
} from "@/components/admin/inbox/InboxShared";
import { toast } from "sonner";
import {
    Save,
    Loader2,
    Copy,
    Truck,
    Globe,
    Eye,
    EyeOff,
    ExternalLink,
    Activity,
    CheckCircle2,
    AlertTriangle,
    RefreshCw,
    Database,
    Trash2,
} from "lucide-react";

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
    const [diag, setDiag] = useState(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [retentionInfo, setRetentionInfo] = useState(null);
    const [cleaningUp, setCleaningUp] = useState(false);

    const runDiagnostics = async () => {
        setDiagLoading(true);
        try {
            const res = await fetch("/api/admin/inbox/diagnostics");
            const json = await res.json();
            if (json.ok) {
                setDiag(json.data);
                toast.success("কানেকশন ও ডাটাবেস চেক সম্পন্ন হয়েছে!");
            } else {
                toast.error(json.message || "ডায়াগনস্টিকস চালানো যায়নি");
            }
        } catch {
            toast.error("সার্ভারে কানেক্ট করা যায়নি");
        } finally {
            setDiagLoading(false);
        }
    };

    const handleManualCleanup = async () => {
        setCleaningUp(true);
        try {
            const res = await fetch("/api/admin/inbox/cleanup", { method: "POST" });
            const json = await res.json();
            if (json.ok) {
                setRetentionInfo({ retentionDays: json.retentionDays, stats: json.stats });
                toast.success(
                    `ক্লিনআপ সম্পন্ন! ${json.stats?.deletedMessages || 0}টি পুরনো মেসেজ ও ${
                        json.stats?.deletedMediaFiles || 0
                    }টি মিডিয়া ফাইল রিমুভ হয়েছে।`
                );
            } else {
                toast.error(json.message || "ক্লিনআপ করা যায়নি");
            }
        } catch {
            toast.error("সার্ভারে কানেক্ট করা যায়নি");
        } finally {
            setCleaningUp(false);
        }
    };

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

        fetch("/api/admin/inbox/cleanup")
            .then((r) => r.json())
            .then((data) => {
                if (data.ok) {
                    setRetentionInfo({ retentionDays: data.retentionDays, stats: data.stats });
                }
            })
            .catch(() => {});
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
                                <span className="inline-flex items-center gap-1 shrink-0">
                                    <MessengerLogo className="w-4 h-4" />
                                    <FacebookCommentLogo className="w-4 h-4" />
                                </span>
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
                                    <WhatsAppLogo className="w-5 h-5" />
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

            {!loading && settings && (
                <section className="max-w-4xl mt-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                <span>লাইভ কানেকশন ও ওয়েবহুক ডায়াগনস্টিকস</span>
                            </h2>
                            <p className="text-xs text-gray-500">
                                আপনার ডাটাবেস টেবিল, Facebook Page টোকেন, অ্যাপ সাবস্ক্রিপশন এবং সর্বশেষ ওয়েবহুক হিট যাচাই করুন।
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={runDiagnostics}
                            disabled={diagLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                        >
                            {diagLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{diagLoading ? "চেক করা হচ্ছে…" : "কানেকশন ও ডাটাবেস চেক করুন"}</span>
                        </button>
                    </div>

                    {diag && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* Database */}
                            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <Database className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                                        ডাটাবেস (Inbox Tables)
                                    </span>
                                    {diag.database?.ok ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> OK
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Error
                                        </span>
                                    )}
                                </div>
                                {diag.database?.ok ? (
                                    <p className="text-xs text-gray-600 tabular-nums">
                                        Conversations: <strong>{diag.database.conversations}</strong> · Messages:{" "}
                                        <strong>{diag.database.messages}</strong>
                                    </p>
                                ) : (
                                    <p className="text-xs text-rose-700">{diag.database?.error}</p>
                                )}
                            </div>

                            {/* Last Webhook */}
                            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                                        সর্বশেষ Meta Webhook হিট
                                    </span>
                                    {diag.lastWebhook ? (
                                        <span
                                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                                diag.lastWebhook.status === "OK"
                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                                    : "text-rose-700 bg-rose-50 border-rose-200"
                                            }`}
                                        >
                                            {diag.lastWebhook.status}
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-gray-500">No hit yet</span>
                                    )}
                                </div>
                                {diag.lastWebhook ? (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                        <p className="truncate">
                                            {diag.lastWebhook.summary || diag.lastWebhook.error || diag.lastWebhook.objectType}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {new Date(diag.lastWebhook.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        এখনো কোনো লাইভ ওয়েবহুক মেসেজ সার্ভারে আসেনি।
                                    </p>
                                )}
                            </div>

                            {/* Facebook Page & Webhook Subscription */}
                            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <MessengerLogo className="w-3.5 h-3.5" />
                                        Facebook Page ও App Subscription
                                    </span>
                                    {diag.meta?.facebook?.ok ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Connected
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Check
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-700">{diag.meta?.facebook?.message}</p>
                                {diag.meta?.facebook?.ok && (
                                    <p className="text-[11px] text-gray-600">
                                        Webhook Subscribed:{" "}
                                        <strong>
                                            {diag.meta.facebook.appSubscribed
                                                ? `হ্যাঁ (${(diag.meta.facebook.subscribedFields || []).join(", ") || "active"})`
                                                : "না — Meta Dashboard থেকে Page-টি App-এ Subscribe করুন"}
                                        </strong>
                                    </p>
                                )}
                            </div>

                            {/* WhatsApp Cloud API */}
                            <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <WhatsAppLogo className="w-3.5 h-3.5" />
                                        WhatsApp Cloud API
                                    </span>
                                    {diag.meta?.whatsapp?.ok ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Connected
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold text-gray-500">Not configured</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600">{diag.meta?.whatsapp?.message}</p>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {!loading && settings && (
                <section className="max-w-4xl mt-6 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                                <span>অটো-ক্লিনআপ (১ মাসের ডেটা রিটেনশন)</span>
                            </h2>
                            <p className="text-xs text-gray-500">
                                সার্ভার হালকা রাখতে{" "}
                                <strong>{retentionInfo?.retentionDays || 30} দিনের</strong> পুরনো চ্যাট মেসেজ, ইমেজ ও ভয়েস ফাইল অটোমেটিক রিমুভ হয়ে যাবে (কাস্টমারের অর্ডার তথ্য সংরক্ষিত থাকবে)।
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleManualCleanup}
                            disabled={cleaningUp}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 disabled:opacity-50 touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                        >
                            {cleaningUp ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{cleaningUp ? "ক্লিন হচ্ছে…" : "এখনই ৩০+ দিনের ডেটা ক্লিন করুন"}</span>
                        </button>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 text-xs text-gray-600 flex flex-wrap items-center justify-between gap-2">
                        {retentionInfo?.stats ? (
                            <>
                                <span>
                                    সর্বশেষ অটো-ক্লিনআপ:{" "}
                                    <strong>
                                        {new Date(retentionInfo.stats.lastRunAt).toLocaleString()}
                                    </strong>
                                </span>
                                <span className="tabular-nums">
                                    রিমুভ হয়েছে: <strong>{retentionInfo.stats.deletedMessages || 0}</strong> মেসেজ ·{" "}
                                    <strong>{retentionInfo.stats.deletedMediaFiles || 0}</strong> মিডিয়া ·{" "}
                                    <strong>{retentionInfo.stats.deletedConversations || 0}</strong> পুরনো থ্রেড
                                </span>
                            </>
                        ) : (
                            <span>
                                অটো-ক্লিনআপ সক্রিয় আছে — ৩০ দিনের পুরনো ডাম্প হওয়া ডেটা স্বয়ংক্রিয়ভাবে পরিষ্কার হবে।
                            </span>
                        )}
                    </div>
                </section>
            )}
        </AdminShell>
    );
}
