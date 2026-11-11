"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { InboxSubNav } from "@/components/admin/inbox/InboxShared";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, MessageSquareReply, Loader2 } from "lucide-react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function InboxAutomationsPage() {
    const { data: res, mutate, isLoading } = useSWR("/api/admin/inbox/automations", fetcher);
    const rules = res?.data?.rules || [];
    const products = res?.data?.products || [];

    const [form, setForm] = useState({
        name: "",
        channel: "FB_COMMENT",
        postId: "",
        keywords: "price, order, দাম, অর্ডার, dam",
        productId: "",
        publicReplyTemplate: "আপনার ইনবক্স চেক করুন ভাইয়া/আপু! {{product_name}}-এর বিস্তারিত পাঠিয়ে দিয়েছি।",
        dmTemplate:
            "হ্যালো! {{product_name}}-এর বর্তমান দাম {{price}}। ডেলিভারি চার্জ: {{delivery_fee}}। অর্ডার করতে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন অথবা ভিজিট করুন: {{order_link}}",
    });
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const handleCreateRule = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const r = await fetch("/api/admin/inbox/automations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await r.json();
            if (data.ok) {
                toast.success("Comment-to-Inbox রুল তৈরি হয়েছে!");
                setForm((prev) => ({ ...prev, name: "", postId: "" }));
                mutate();
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("রুল সেভ করা যায়নি — পুনরায় চেষ্টা করুন");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRule = async (rule) => {
        const r = await fetch("/api/admin/inbox/automations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
        });
        const data = await r.json();
        if (data.ok) {
            toast.success(rule.isActive ? "রুল পজ করা হয়েছে" : "রুল চালু করা হয়েছে");
            mutate();
        }
    };

    const handleDeleteRule = async (id) => {
        const r = await fetch(`/api/admin/inbox/automations?id=${id}`, { method: "DELETE" });
        const data = await r.json();
        if (data.ok) {
            setConfirmDeleteId(null);
            toast.success("রুল মুছে ফেলা হয়েছে");
            mutate();
        }
    };

    return (
        <AdminShell title="Facebook Comment-to-Inbox">
            <InboxSubNav />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Create New Rule */}
                <form
                    onSubmit={handleCreateRule}
                    className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4"
                >
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 text-balance">
                        <MessageSquareReply className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                        নতুন Facebook Comment-to-Inbox রুল তৈরি করুন
                    </h2>

                    <div>
                        <label htmlFor="rule-name" className="text-xs font-semibold text-gray-700">
                            রুলের নাম <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="rule-name"
                            name="name"
                            type="text"
                            autoComplete="off"
                            required
                            aria-required="true"
                            placeholder="e.g. Eid Boost Post Auto Inbox…"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="rule-channel" className="text-xs font-semibold text-gray-700">
                                চ্যানেল
                            </label>
                            <select
                                id="rule-channel"
                                name="channel"
                                value={form.channel}
                                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 bg-white text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                <option value="FB_COMMENT">Facebook Comments</option>
                                <option value="ALL">All Facebook Posts</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="rule-post-id" className="text-xs font-semibold text-gray-700">
                                Post ID (ঐচ্ছিক)
                            </label>
                            <input
                                id="rule-post-id"
                                name="postId"
                                type="text"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="খালি রাখলে সব পোস্টে কাজ করবে…"
                                value={form.postId}
                                onChange={(e) => setForm({ ...form, postId: e.target.value })}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="rule-keywords" className="text-xs font-semibold text-gray-700">
                            ট্রিগার কীওয়ার্ড (কমা দিয়ে আলাদা করুন) <span aria-hidden="true">*</span>
                        </label>
                        <input
                            id="rule-keywords"
                            name="keywords"
                            type="text"
                            autoComplete="off"
                            required
                            aria-required="true"
                            value={form.keywords}
                            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="rule-product" className="text-xs font-semibold text-gray-700">
                            প্রোডাক্ট লিংক করুন (দাম ও লিংকের জন্য)
                        </label>
                        <select
                            id="rule-product"
                            name="productId"
                            value={form.productId}
                            onChange={(e) => setForm({ ...form, productId: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 bg-white text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            <option value="">-- যেকোনো প্রোডাক্ট --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (৳{p.salePrice || p.price})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rule-public-reply" className="text-xs font-semibold text-gray-700">
                            পাবলিক কমেন্ট রিপ্লাই <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="rule-public-reply"
                            name="publicReplyTemplate"
                            rows={2}
                            required
                            aria-required="true"
                            value={form.publicReplyTemplate}
                            onChange={(e) => setForm({ ...form, publicReplyTemplate: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="rule-dm-template" className="text-xs font-semibold text-gray-700">
                            অটো ইনবক্স মেসেজ (DM) <span aria-hidden="true">*</span>
                        </label>
                        <textarea
                            id="rule-dm-template"
                            name="dmTemplate"
                            rows={3}
                            required
                            aria-required="true"
                            value={form.dmTemplate}
                            onChange={(e) => setForm({ ...form, dmTemplate: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        />
                        <p className="text-[11px] text-gray-500 mt-1" translate="no">
                            ভ্যারিয়েবল: {"{{product_name}}"}, {"{{price}}"}, {"{{delivery_fee}}"}, {"{{order_link}}"}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Plus className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span>{saving ? "সেভ হচ্ছে…" : "রুল সেভ করুন"}</span>
                    </button>
                </form>

                {/* Active Rules List */}
                <section className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2 border-b pb-2 tabular-nums text-balance">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
                        অ্যাক্টিভ কমেন্ট-টু-ইনবক্স রুলস ({rules.length})
                    </h2>

                    {isLoading ? (
                        <div role="status" aria-live="polite" className="py-12 text-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" aria-hidden="true" />
                            <span className="sr-only">লোড হচ্ছে…</span>
                        </div>
                    ) : rules.length === 0 ? (
                        <p className="text-sm text-gray-500 py-8 text-center text-pretty">
                            এখনো কোনো কমেন্ট অটোমেশন রুল তৈরি করা হয়নি। বাম পাশের ফর্ম দিয়ে ১টি তৈরি করুন!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {rules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{rule.name}</h3>
                                            <p className="text-xs text-gray-500 tabular-nums">
                                                Channel: <strong>{rule.channel}</strong> · Triggers:{" "}
                                                <span className="text-emerald-700 font-semibold">
                                                    {rule.triggerCount} বার
                                                </span>
                                                {rule.product ? ` · Product: ${rule.product.name}` : ""}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleRule(rule)}
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                                    rule.isActive
                                                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                }`}
                                            >
                                                {rule.isActive ? "Active" : "Paused"}
                                            </button>

                                            {confirmDeleteId === rule.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                    >
                                                        নিশ্চিত মুছুন
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2 py-1 rounded-md bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                                                    >
                                                        বাতিল
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    aria-label={`Delete rule ${rule.name}`}
                                                    onClick={() => setConfirmDeleteId(rule.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                >
                                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs bg-white p-2.5 rounded-lg border border-gray-100 space-y-1">
                                        <p>
                                            <strong>Keywords:</strong>{" "}
                                            <span className="text-indigo-700">{rule.keywords}</span>
                                        </p>
                                        <p>
                                            <strong>Public Reply:</strong> {rule.publicReplyTemplate}
                                        </p>
                                        <p>
                                            <strong>Inbox DM:</strong> {rule.dmTemplate}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AdminShell>
    );
}
