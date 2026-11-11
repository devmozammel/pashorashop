"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { InboxSubNav, ChannelBadge } from "@/components/admin/inbox/InboxShared";
import { Megaphone, Users, TrendingUp, Clock, Loader2 } from "lucide-react";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function InboxAnalyticsPage() {
    const [days, setDays] = useState(30);
    const { data: res, isLoading } = useSWR(`/api/admin/inbox/analytics?days=${days}`, fetcher);
    const report = res?.data;

    return (
        <AdminShell title="Ad ROI & Moderator Performance">
            <InboxSubNav />

            <div className="flex justify-end mb-4">
                <label htmlFor="analytics-days-filter" className="sr-only">
                    রিপোর্টের সময়সীমা
                </label>
                <select
                    id="analytics-days-filter"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-900 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                    <option value={7}>গত ৭ দিন</option>
                    <option value={30}>গত ৩০ দিন</option>
                    <option value={90}>গত ৯০ দিন</option>
                </select>
            </div>

            {isLoading || !report ? (
                <div role="status" aria-live="polite" className="py-20 text-center bg-white rounded-xl border border-gray-200">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" aria-hidden="true" />
                    <p className="text-xs text-gray-500">রিপোর্ট লোড হচ্ছে…</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-semibold">মোট ইনবক্স ইনকোয়ারি</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {report.summary.totalConversations.toLocaleString("en-BD")}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-semibold">চ্যাট থেকে কনফার্ম অর্ডার</p>
                            <p className="text-2xl font-bold text-emerald-700 mt-1">
                                {report.summary.totalOrders.toLocaleString("en-BD")}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-semibold">ইনবক্স রেভিনিউ</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                ৳{report.summary.totalRevenue.toLocaleString("en-BD")}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-500 font-semibold">গড় কনভার্সন রেট</p>
                            <p className="text-2xl font-bold text-violet-700 mt-1">
                                {report.summary.overallConversionRate}%
                            </p>
                        </div>
                    </div>

                    {/* 1. Ad / Boost ROI Breakdown */}
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
                            <Megaphone className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />
                            <div>
                                <h2 className="font-bold text-gray-900 text-balance">
                                    অ্যাড ও বুস্ট ROI রিপোর্ট (Facebook / TikTok / Instagram)
                                </h2>
                                <p className="text-xs text-gray-500 text-pretty">
                                    কোন বুস্ট বা অ্যাড থেকে শুধু জিজ্ঞাসাবাদ আসছে আর কোনটা থেকে আসল অর্ডার ও সেলস হচ্ছে।
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left tabular-nums">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Platform</th>
                                        <th scope="col" className="px-4 py-3">Ad / Boost Name</th>
                                        <th scope="col" className="px-4 py-3">Campaign</th>
                                        <th scope="col" className="px-4 py-3 text-right">Messages</th>
                                        <th scope="col" className="px-4 py-3 text-right">Orders</th>
                                        <th scope="col" className="px-4 py-3 text-right">Conversion</th>
                                        <th scope="col" className="px-4 py-3 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.adRoi.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                                এই সময়ে কোনো অ্যাড ডেটা পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        report.adRoi.map((row) => (
                                            <tr key={row.key} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-semibold">{row.adPlatform}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {row.adName}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">{row.campaignName}</td>
                                                <td className="px-4 py-3 text-right">{row.conversationsCount}</td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                                    {row.ordersCount}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            row.conversionRate >= 20
                                                                ? "bg-emerald-100 text-emerald-800"
                                                                : "bg-amber-100 text-amber-800"
                                                        }`}
                                                    >
                                                        {row.conversionRate}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                    ৳{row.revenue.toLocaleString("en-BD")}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 2. Team & Moderator Performance Report */}
                    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
                            <Users className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                            <div>
                                <h2 className="font-bold text-gray-900 text-balance">
                                    টিম ও মডারেটর পারফরম্যান্স রিপোর্ট
                                </h2>
                                <p className="text-xs text-gray-500 text-pretty">
                                    কে কতগুলো মেসেজের রিপ্লাই দিয়েছে, কার কনভার্সন রেট বেশি, এবং গড় রেসপন্স টাইম কত মিনিট।
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left tabular-nums">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">Moderator / Admin</th>
                                        <th scope="col" className="px-4 py-3">Role</th>
                                        <th scope="col" className="px-4 py-3 text-right">Replies Sent</th>
                                        <th scope="col" className="px-4 py-3 text-right">Chats Handled</th>
                                        <th scope="col" className="px-4 py-3 text-right">Orders Closed</th>
                                        <th scope="col" className="px-4 py-3 text-right">Conversion Rate</th>
                                        <th scope="col" className="px-4 py-3 text-right">Avg Reply Time</th>
                                        <th scope="col" className="px-4 py-3 text-right">Sales Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {report.moderatorPerformance.map((mod) => (
                                        <tr key={mod.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">{mod.name}</p>
                                                <p className="text-xs text-gray-400">{mod.email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                                                    {mod.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{mod.repliesSent}</td>
                                            <td className="px-4 py-3 text-right">{mod.conversationsHandled}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                                {mod.ordersClosed}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                {mod.conversionRate}%
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                                    {mod.avgResponseMinutes !== null
                                                        ? `${mod.avgResponseMinutes} min`
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                ৳{mod.revenue.toLocaleString("en-BD")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 3. Channel Breakdown */}
                    {report.channelBreakdown.length > 0 && (
                        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm text-balance">
                                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                চ্যানেল অনুযায়ী পারফরম্যান্স
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 tabular-nums">
                                {report.channelBreakdown.map((ch) => (
                                    <div key={ch.channel} className="p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-1.5">
                                        <ChannelBadge channel={ch.channel} />
                                        <div className="flex justify-between text-xs pt-1">
                                            <span className="text-gray-500">Chats:</span>
                                            <span className="font-bold">{ch.conversations}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Orders:</span>
                                            <span className="font-bold text-emerald-700">{ch.orders}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Sales:</span>
                                            <span className="font-bold">৳{ch.revenue.toLocaleString("en-BD")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </AdminShell>
    );
}
