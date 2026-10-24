"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, TrendingUp, DollarSign, Activity, Wallet, X, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer"];

const statusStyle = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
};

const statusIcon = {
    PENDING: <Clock className="w-3 h-3" />,
    APPROVED: <CheckCircle className="w-3 h-3" />,
    REJECTED: <XCircle className="w-3 h-3" />,
};

export default function AffiliatePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [domain, setDomain] = useState("");

    // Withdrawal state
    const [withdrawals, setWithdrawals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({ amount: "", paymentMethod: "bKash", paymentNumber: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const origin = window.location.hostname === 'localhost' ? window.location.origin : 'https://www.pashorashop.com';
        setDomain(origin);
        if (status === "unauthenticated") {
            router.push("/auth/login");
        } else if (status === "authenticated") {
            fetchProfile();
        }
    }, [status, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/affiliate");
            if (res.ok) {
                const data = await res.json();
                if (data.enrolled) {
                    setProfile(data.profile);
                    // Use withdrawals from profile to avoid extra API call
                    setWithdrawals(data.profile.withdrawRequests || []);
                }
            }
        } catch (error) {
            console.error("Failed to fetch affiliate profile");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        setIsEnrolling(true);
        try {
            const res = await fetch("/api/user/affiliate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Successfully enrolled in Affiliate Program!");
                fetchProfile();
            } else {
                toast.error(data.error || "Failed to enroll");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsEnrolling(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/user/affiliate/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(withdrawForm),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Withdrawal request submitted! Admin will review it.");
                setShowModal(false);
                setWithdrawForm({ amount: "", paymentMethod: "bKash", paymentNumber: "" });
                fetchProfile(); // Single call refreshes both profile and withdrawals
            } else {
                toast.error(data.error || "Failed to submit request");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center">Loading...</div>;

    if (!profile) {
        return (
            <div className="container max-w-4xl mx-auto py-10 px-4">
                <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
                    <TrendingUp className="w-16 h-16 mx-auto text-primary mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Join our Affiliate Program</h1>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Share your favorite products with friends and followers. Earn a commission for every successful purchase made through your unique referral link!
                    </p>
                    <Button onClick={handleEnroll} disabled={isEnrolling} size="lg" className="w-full md:w-auto px-8">
                        {isEnrolling ? "Submitting Request..." : "Become an Affiliate"}
                    </Button>
                </div>
            </div>
        );
    }

    if (profile.status === "PENDING") {
        return (
            <div className="container max-w-4xl mx-auto py-10 px-4">
                <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
                    <div className="w-16 h-16 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Application Pending</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Your request to join the Affiliate Program is currently under review by our team.
                    </p>
                </div>
            </div>
        );
    }

    if (profile.status === "REJECTED") {
        return (
            <div className="container max-w-4xl mx-auto py-10 px-4">
                <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
                    <div className="w-16 h-16 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">Application Declined</h1>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        Unfortunately, your request has been declined at this time.
                    </p>
                </div>
            </div>
        );
    }

    const referralLink = `${domain}?ref=${profile.code}`;
    const hasPendingWithdrawal = withdrawals.some((w) => w.status === "PENDING");

    return (
        <div className="container max-w-5xl mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
                <Button
                    onClick={() => setShowModal(true)}
                    disabled={profile.pendingEarnings < 100 || hasPendingWithdrawal}
                    title={hasPendingWithdrawal ? "You have a pending withdrawal request" : profile.pendingEarnings < 100 ? "সর্বনিম্ন ৳100 থাকলে উইথড্র করা যাবে" : ""}
                    className="flex items-center gap-2"
                >
                    <Wallet className="w-4 h-4" />
                    Withdraw Earnings
                </Button>
            </div>

            {hasPendingWithdrawal && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    আপনার একটি উইথড্র রিকোয়েস্ট অপেক্ষমাণ আছে। অ্যাডমিন প্রসেস করার পর আবার সাবমিট করতে পারবেন।
                </div>
            )}

            {!hasPendingWithdrawal && profile.pendingEarnings < 100 && profile.pendingEarnings > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    সর্বনিম্ন <strong>৳100</strong> pending earnings হলে উইথড্র করতে পারবেন। আপনার বর্তমান: {formatPrice(profile.pendingEarnings)}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-6 mb-8 md:grid-cols-3">
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold">{formatPrice(profile.totalEarnings)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Pending Earnings</p>
                        <p className="text-2xl font-bold">{formatPrice(profile.pendingEarnings)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Your Referral Code</p>
                    <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2">
                        <span className="font-mono font-bold tracking-wider">{profile.code}</span>
                        <button onClick={() => copyToClipboard(profile.code)} className="text-primary hover:text-primary/80">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Referral Link */}
            <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
                <h2 className="text-xl font-bold mb-4">Your Universal Referral Link</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Share this link to direct users to the homepage with your referral code attached.
                </p>
                <div className="flex items-center gap-4">
                    <input type="text" readOnly value={referralLink} className="flex-1 px-4 py-2 border rounded-lg font-mono text-sm bg-gray-50 text-gray-700" />
                    <Button onClick={() => copyToClipboard(referralLink)}>Copy Link</Button>
                </div>
            </div>

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Withdrawal History</h2>
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Amount</th>
                                    <th className="px-6 py-4 font-medium">Payment Method</th>
                                    <th className="px-6 py-4 font-medium">Account</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Note</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {withdrawals.map((w) => (
                                    <tr key={w.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-bold text-green-600">{formatPrice(w.amount)}</td>
                                        <td className="px-6 py-4">{w.paymentMethod}</td>
                                        <td className="px-6 py-4 font-mono">{w.paymentNumber}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[w.status]}`}>
                                                {statusIcon[w.status]}
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{w.adminNote || "—"}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(w.createdAt).toLocaleDateString("bn-BD")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recent Referrals */}
            <h2 className="text-2xl font-bold mb-4">Recent Referrals</h2>
            <div className="bg-white rounded-xl border overflow-hidden">
                {!profile.transactions || profile.transactions.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <p>No referrals yet. Start sharing your link to earn!</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Order ID</th>
                                <th className="px-6 py-4 font-medium">Commission</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {profile.transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-sm font-semibold">{tx.order?.orderNumber || tx.orderId.substring(0, 8) + "..."}</p>
                                        {tx.order?.status && (
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                ${tx.order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                                tx.order.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                                                "bg-blue-50 text-blue-600"}`}>
                                                {tx.order.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-green-600">+{formatPrice(tx.commissionAmount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            tx.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                                            tx.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                            tx.status === "PAID" ? "bg-blue-100 text-blue-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {tx.status === "APPROVED" ? "✓ Confirmed" : tx.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(tx.createdAt).toLocaleDateString("bn-BD")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Withdraw Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">Withdraw Earnings</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                আপনার উইথড্রযোগ্য পরিমাণ: <strong>{formatPrice(profile.pendingEarnings)}</strong>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পরিমাণ (টাকা) *</label>
                                <input
                                    type="number"
                                    min="100"
                                    max={profile.pendingEarnings}
                                    required
                                    value={withdrawForm.amount}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder={`সর্বনিম্ন ৳100, সর্বোচ্চ ৳${profile.pendingEarnings}`}
                                />
                                <p className="text-xs text-gray-500 mt-1">সর্বনিম্ন উইথড্র পরিমাণ: <strong>৳100</strong></p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পেমেন্ট মেথড *</label>
                                <select
                                    required
                                    value={withdrawForm.paymentMethod}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, paymentMethod: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">একাউন্ট নম্বর *</label>
                                <input
                                    type="text"
                                    required
                                    value={withdrawForm.paymentNumber}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, paymentNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="যেমন: 01XXXXXXXXX"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                                    বাতিল
                                </button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1">
                                    {isSubmitting ? "সাবমিট হচ্ছে..." : "রিকোয়েস্ট করুন"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
