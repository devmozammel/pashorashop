"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import DataTable from "@/components/admin/ui/DataTable";
import { Badge } from "@/components/admin/ui/FormElements";
import { Loader2, CheckCircle, XCircle, DollarSign, Users, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

export default function AffiliatesPage() {
    const [activeTab, setActiveTab] = useState("affiliates");

    // Affiliates
    const [affiliates, setAffiliates] = useState([]);
    const [isLoadingAffiliates, setIsLoadingAffiliates] = useState(true);

    // Withdrawals
    const [withdrawals, setWithdrawals] = useState([]);
    const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(true);
    const [rejectModal, setRejectModal] = useState(null); // { id, note }

    const fetchAffiliates = async () => {
        setIsLoadingAffiliates(true);
        try {
            const res = await fetch("/api/admin/affiliates");
            const data = await res.json();
            if (res.ok) setAffiliates(data);
            else toast.error(data.error || "Failed to load affiliates");
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsLoadingAffiliates(false);
        }
    };

    const fetchWithdrawals = async () => {
        setIsLoadingWithdrawals(true);
        try {
            const res = await fetch("/api/admin/affiliates/withdrawals");
            const data = await res.json();
            if (res.ok) setWithdrawals(data);
            else toast.error(data.error || "Failed to load withdrawals");
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsLoadingWithdrawals(false);
        }
    };

    useEffect(() => {
        fetchAffiliates();
        fetchWithdrawals();
    }, []);

    // Affiliate approve/reject
    const handleAffiliateAction = async (id, payload) => {
        try {
            const res = await fetch(`/api/admin/affiliates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Affiliate updated successfully");
                fetchAffiliates();
            } else {
                toast.error(data.error || "Update failed");
            }
        } catch {
            toast.error("Error updating affiliate");
        }
    };

    // Withdrawal approve/reject
    const handleWithdrawal = async (id, action, adminNote = "") => {
        try {
            const res = await fetch(`/api/admin/affiliates/withdrawals/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, adminNote }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setRejectModal(null);
                fetchWithdrawals();
                fetchAffiliates(); // Refresh earnings too
            } else {
                toast.error(data.error || "Failed");
            }
        } catch {
            toast.error("Error processing withdrawal");
        }
    };

    const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");

    // Affiliates columns
    const affiliateColumns = [
        {
            header: "User",
            cell: (row) => (
                <div>
                    <p className="font-semibold text-gray-900">{row.user?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{row.user?.email || "No email"}</p>
                </div>
            ),
        },
        {
            header: "Code",
            cell: (row) => <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{row.code}</span>,
        },
        {
            header: "Status",
            cell: (row) => {
                const variants = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
                return <Badge variant={variants[row.status] || "secondary"}>{row.status}</Badge>;
            },
        },
        {
            header: "Earnings",
            cell: (row) => (
                <div className="text-sm">
                    <p className="text-green-600 font-medium">Earned: {formatPrice(row.totalEarnings)}</p>
                    <p className="text-orange-500 font-medium">Pending: {formatPrice(row.pendingEarnings)}</p>
                </div>
            ),
        },
        { header: "Tx Count", cell: (row) => row._count?.transactions || 0 },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex items-center gap-2">
                    {row.status === "PENDING" && (
                        <>
                            <button onClick={() => handleAffiliateAction(row.id, { status: "APPROVED" })} className="p-1 hover:bg-green-100 text-green-600 rounded" title="Approve">
                                <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleAffiliateAction(row.id, { status: "REJECTED" })} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Reject">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </>
                    )}
                    {row.status === "APPROVED" && row.pendingEarnings > 0 && (
                        <button onClick={() => handleAffiliateAction(row.id, { markPaid: true })} className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200" title="Mark pending as Paid">
                            <DollarSign className="w-3 h-3" /> Mark Paid
                        </button>
                    )}
                </div>
            ),
        },
    ];

    // Withdrawal status styling
    const wStatusStyle = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

    return (
        <AdminShell title="Affiliate Management">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("affiliates")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "affiliates" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Users className="w-4 h-4" />
                    Affiliates
                </button>
                <button
                    onClick={() => setActiveTab("withdrawals")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "withdrawals" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <ArrowDownCircle className="w-4 h-4" />
                    Withdrawal Requests
                    {pendingWithdrawals.length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {pendingWithdrawals.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Affiliates Tab */}
            {activeTab === "affiliates" && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {isLoadingAffiliates ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : affiliates.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">No affiliate requests found.</div>
                    ) : (
                        <DataTable columns={affiliateColumns} data={affiliates} searchKey="code" />
                    )}
                </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === "withdrawals" && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {isLoadingWithdrawals ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">কোনো উইথড্র রিকোয়েস্ট নেই।</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b text-gray-700">
                                <tr>
                                    <th className="px-5 py-4 font-medium">User</th>
                                    <th className="px-5 py-4 font-medium">Amount</th>
                                    <th className="px-5 py-4 font-medium">Payment Info</th>
                                    <th className="px-5 py-4 font-medium">Status</th>
                                    <th className="px-5 py-4 font-medium">Date</th>
                                    <th className="px-5 py-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/50">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900">{w.affiliate?.user?.name || "Unknown"}</p>
                                            <p className="text-xs text-gray-500">{w.affiliate?.user?.email || ""}</p>
                                            <p className="text-xs text-gray-400 font-mono">Code: {w.affiliate?.code}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-lg font-bold text-green-600">{formatPrice(w.amount)}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{w.paymentMethod}</span>
                                            <p className="font-mono text-gray-700 mt-1">{w.paymentNumber}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge variant={wStatusStyle[w.status] || "secondary"}>{w.status}</Badge>
                                            {w.adminNote && <p className="text-xs text-gray-500 mt-1">{w.adminNote}</p>}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 text-xs">
                                            {new Date(w.createdAt).toLocaleDateString("bn-BD")}
                                        </td>
                                        <td className="px-5 py-4">
                                            {w.status === "PENDING" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleWithdrawal(w.id, "APPROVE")}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg border border-green-200 font-medium"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ id: w.id, note: "" })}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 font-medium"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Reject Note Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Rejection Note (Optional)</h3>
                        <textarea
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                            placeholder="কারণ লিখুন (যদি থাকে)..."
                            value={rejectModal.note}
                            onChange={(e) => setRejectModal({ ...rejectModal, note: e.target.value })}
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setRejectModal(null)} className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">
                                বাতিল
                            </button>
                            <button
                                onClick={() => handleWithdrawal(rejectModal.id, "REJECT", rejectModal.note)}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                Reject করুন
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
