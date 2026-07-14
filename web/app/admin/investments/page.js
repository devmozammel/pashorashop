"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { 
    DollarSign, Users, TrendingUp, Calendar, Plus, Edit2, Trash2, 
    ArrowUpRight, ArrowDownRight, Percent, Loader2, Info, Coins, X
} from "lucide-react";
import { toast } from "sonner";

export default function AdminInvestmentsPage() {
    const [data, setData] = useState({ partners: [], transactions: [], boostingSpends: [] });
    const [dbStats, setDbStats] = useState({
        deliveredSales: 0,
        shippedSales: 0,
        returnedSales: 0,
        totalOrders: 0,
        returnedOrdersCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Tab State
    const [activeTab, setActiveTab] = useState("equity"); // equity, boosting, transactions

    // Calculator State
    const [calcAmount, setCalcAmount] = useState(100000);
    const [calcType, setCalcType] = useState("PROFIT"); // PROFIT or LOSS

    // Modal / Form States
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showTxModal, setShowTxModal] = useState(false);
    const [showBoostModal, setShowBoostModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);

    // Form inputs - Partner
    const [partnerName, setPartnerName] = useState("");
    const [partnerRole, setPartnerRole] = useState("");
    const [partnerInvestment, setPartnerInvestment] = useState("");
    const [partnerStatus, setPartnerStatus] = useState("Paid");
    const [partnerJoined, setPartnerJoined] = useState(new Date().toISOString().split("T")[0]);
    const [partnerColor, setPartnerColor] = useState("from-blue-500 to-indigo-500");

    // Form inputs - Transaction
    const [txPartnerId, setTxPartnerId] = useState("");
    const [txAmount, setTxAmount] = useState("");
    const [txType, setTxType] = useState("Capital Injection");
    const [txDescription, setTxDescription] = useState("");
    const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

    // Form inputs - Boosting
    const [boostPlatform, setBoostPlatform] = useState("Facebook Ads");
    const [boostCampaign, setBoostCampaign] = useState("");
    const [boostAmount, setBoostAmount] = useState("");
    const [boostDate, setBoostDate] = useState(new Date().toISOString().split("T")[0]);
    const [boostDescription, setBoostDescription] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/investments");
            const json = await res.json();
            if (json.ok) {
                setData({
                    partners: json.data.partners || [],
                    transactions: json.data.transactions || [],
                    boostingSpends: json.data.boostingSpends || []
                });
                if (json.dbStats) {
                    setDbStats(json.dbStats);
                }
            } else {
                toast.error(json.message || "Failed to load investment data");
            }
        } catch (error) {
            toast.error("Failed to load investment data");
        } finally {
            setIsLoading(false);
        }
    };

    const saveData = async (updatedData) => {
        try {
            setIsSaving(true);
            const res = await fetch("/api/admin/investments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });
            const json = await res.json();
            if (json.ok) {
                setData({
                    partners: json.data.partners || [],
                    transactions: json.data.transactions || [],
                    boostingSpends: json.data.boostingSpends || []
                });
                toast.success("Dashboard data updated successfully!");
                return true;
            } else {
                toast.error(json.message || "Failed to save changes");
                return false;
            }
        } catch (error) {
            toast.error("Failed to save changes");
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Calculate Summary Stats
    const totalCapital = data.partners.reduce((sum, p) => sum + (Number(p.investmentAmount) || 0), 0);
    const activePartnersCount = data.partners.length;
    const averageInvestment = activePartnersCount > 0 ? totalCapital / activePartnersCount : 0;
    const paidCapital = data.partners.filter(p => p.status === "Paid").reduce((sum, p) => sum + (Number(p.investmentAmount) || 0), 0);
    const pendingCapital = totalCapital - paidCapital;
    
    // Boosting Statistics
    const totalBoostingSpend = (data.boostingSpends || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    
    // Cash Flow calculations
    const totalWithdrawals = data.transactions
        .filter(t => t.type === "Withdrawal")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const workingCapital = paidCapital + dbStats.deliveredSales - totalBoostingSpend - totalWithdrawals;

    // Ratios
    const returnRate = dbStats.totalOrders > 0 ? (dbStats.returnedOrdersCount / dbStats.totalOrders) * 100 : 0;
    const roas = totalBoostingSpend > 0 ? dbStats.deliveredSales / totalBoostingSpend : 0;

    // Platform wise breakdown for ads
    const platformBreakdown = (data.boostingSpends || []).reduce((acc, curr) => {
        acc[curr.platform] = (acc[curr.platform] || 0) + (Number(curr.amount) || 0);
        return acc;
    }, {});

    // Handle Partner Modal Open
    const openAddPartner = () => {
        setEditingPartner(null);
        setPartnerName("");
        setPartnerRole("");
        setPartnerInvestment("");
        setPartnerStatus("Paid");
        setPartnerJoined(new Date().toISOString().split("T")[0]);
        const gradients = [
            "from-blue-500 to-indigo-500",
            "from-pink-500 to-rose-500",
            "from-amber-500 to-orange-500",
            "from-emerald-500 to-teal-500",
            "from-purple-500 to-fuchsia-500",
            "from-cyan-500 to-blue-500",
            "from-violet-500 to-purple-500"
        ];
        setPartnerColor(gradients[Math.floor(Math.random() * gradients.length)]);
        setShowPartnerModal(true);
    };

    const openEditPartner = (partner) => {
        setEditingPartner(partner);
        setPartnerName(partner.name);
        setPartnerRole(partner.role);
        setPartnerInvestment(partner.investmentAmount);
        setPartnerStatus(partner.status);
        setPartnerJoined(partner.joinedDate);
        setPartnerColor(partner.avatarColor || "from-blue-500 to-indigo-500");
        setShowPartnerModal(true);
    };

    // Handle Partner Submit
    const handlePartnerSubmit = async (e) => {
        e.preventDefault();
        if (!partnerName || !partnerRole || !partnerInvestment) {
            toast.error("Please fill in all required fields");
            return;
        }

        let updatedPartners = [...data.partners];
        const newInvestment = Number(partnerInvestment);

        if (editingPartner) {
            // Update existing partner
            updatedPartners = updatedPartners.map(p => {
                if (p.id === editingPartner.id) {
                    return {
                        ...p,
                        name: partnerName,
                        role: partnerRole,
                        investmentAmount: newInvestment,
                        status: partnerStatus,
                        joinedDate: partnerJoined,
                        avatarColor: partnerColor
                    };
                }
                return p;
            });

            // Also check if we should add a transaction log for adjustment
            const diff = newInvestment - editingPartner.investmentAmount;
            if (diff !== 0) {
                const newTx = {
                    id: `tx-${Date.now()}`,
                    partnerId: editingPartner.id,
                    partnerName: partnerName,
                    amount: Math.abs(diff),
                    date: new Date().toISOString().split("T")[0],
                    type: diff > 0 ? "Capital Injection" : "Withdrawal",
                    description: `Capital adjusted manually from ${formatCurrency(editingPartner.investmentAmount)} to ${formatCurrency(newInvestment)}`
                };
                const updatedTxs = [newTx, ...data.transactions];
                const success = await saveData({ 
                    partners: updatedPartners, 
                    transactions: updatedTxs,
                    boostingSpends: data.boostingSpends || []
                });
                if (success) setShowPartnerModal(false);
                return;
            }
        } else {
            // Add new partner
            const newPartnerId = `partner-${Date.now()}`;
            const newPartner = {
                id: newPartnerId,
                name: partnerName,
                role: partnerRole,
                investmentAmount: newInvestment,
                sharePercentage: 0, // Calculated on backend
                status: partnerStatus,
                joinedDate: partnerJoined,
                avatarColor: partnerColor
            };

            // Log initial capital transaction
            const newTx = {
                id: `tx-${Date.now()}`,
                partnerId: newPartnerId,
                partnerName: partnerName,
                amount: newInvestment,
                date: partnerJoined,
                type: "Capital Injection",
                description: `Initial capital contribution on joining as ${partnerRole}`
            };

            updatedPartners.push(newPartner);
            const updatedTxs = [newTx, ...data.transactions];
            const success = await saveData({ 
                partners: updatedPartners, 
                transactions: updatedTxs,
                boostingSpends: data.boostingSpends || []
            });
            if (success) setShowPartnerModal(false);
            return;
        }

        const success = await saveData({ 
            partners: updatedPartners, 
            transactions: data.transactions,
            boostingSpends: data.boostingSpends || []
        });
        if (success) setShowPartnerModal(false);
    };

    // Handle Delete Partner
    const handleDeletePartner = async (partnerId) => {
        if (!confirm("Are you sure you want to delete this partner? Their historical transactions will remain logged.")) {
            return;
        }

        const updatedPartners = data.partners.filter(p => p.id !== partnerId);
        await saveData({ 
            partners: updatedPartners, 
            transactions: data.transactions,
            boostingSpends: data.boostingSpends || []
        });
    };

    // Handle Transaction Submit
    const handleTxSubmit = async (e) => {
        e.preventDefault();
        if (!txPartnerId || !txAmount || !txDescription) {
            toast.error("Please fill in all required fields");
            return;
        }

        const targetPartner = data.partners.find(p => p.id === txPartnerId);
        if (!targetPartner) {
            toast.error("Invalid partner selected");
            return;
        }

        const amount = Number(txAmount);
        const newTx = {
            id: `tx-${Date.now()}`,
            partnerId: txPartnerId,
            partnerName: targetPartner.name,
            amount,
            date: txDate,
            type: txType,
            description: txDescription
        };

        // Adjust partner's capital automatically based on transaction type
        const updatedPartners = data.partners.map(p => {
            if (p.id === txPartnerId) {
                let currentAmount = p.investmentAmount;
                if (txType === "Capital Injection") {
                    currentAmount += amount;
                } else if (txType === "Withdrawal") {
                    currentAmount = Math.max(0, currentAmount - amount);
                }
                return { ...p, investmentAmount: currentAmount };
            }
            return p;
        });

        const updatedTxs = [newTx, ...data.transactions];
        const success = await saveData({ 
            partners: updatedPartners, 
            transactions: updatedTxs,
            boostingSpends: data.boostingSpends || []
        });
        if (success) {
            setShowTxModal(false);
            setTxPartnerId("");
            setTxAmount("");
            setTxDescription("");
        }
    };

    // Handle Delete Transaction
    const handleDeleteTx = async (txId) => {
        if (!confirm("Are you sure you want to delete this transaction log? This will NOT retroactively change the partner's current capital balance.")) {
            return;
        }

        const updatedTxs = data.transactions.filter(t => t.id !== txId);
        await saveData({ 
            partners: data.partners, 
            transactions: updatedTxs,
            boostingSpends: data.boostingSpends || []
        });
    };

    // Handle Boosting Spend Submit
    const handleBoostSubmit = async (e) => {
        e.preventDefault();
        if (!boostAmount || !boostPlatform || !boostCampaign) {
            toast.error("Please fill in all required fields");
            return;
        }

        const newBoost = {
            id: `boost-${Date.now()}`,
            platform: boostPlatform,
            campaign: boostCampaign,
            amount: Number(boostAmount),
            date: boostDate,
            description: boostDescription
        };

        const updatedBoosts = [newBoost, ...(data.boostingSpends || [])];
        const success = await saveData({
            partners: data.partners,
            transactions: data.transactions,
            boostingSpends: updatedBoosts
        });

        if (success) {
            setShowBoostModal(false);
            setBoostAmount("");
            setBoostPlatform("Facebook Ads");
            setBoostCampaign("");
            setBoostDescription("");
        }
    };

    // Handle Delete Boosting Spend
    const handleDeleteBoost = async (boostId) => {
        if (!confirm("Are you sure you want to delete this boosting expense?")) {
            return;
        }

        const updatedBoosts = data.boostingSpends.filter(b => b.id !== boostId);
        await saveData({
            partners: data.partners,
            transactions: data.transactions,
            boostingSpends: updatedBoosts
        });
    };

    // Render Custom SVG Donut Chart
    const renderDonutChart = () => {
        if (totalCapital === 0) return null;
        const radius = 50;
        const strokeWidth = 14;
        const circumference = 2 * Math.PI * radius;
        let accumulatedPercent = 0;

        return (
            <svg viewBox="0 0 140 140" className="w-48 h-48 drop-shadow-md">
                <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={strokeWidth} />
                {data.partners.map((partner) => {
                    const share = partner.sharePercentage;
                    if (share <= 0) return null;
                    const strokeDashoffset = circumference - (share / 100) * circumference;
                    const rotation = accumulatedPercent * 3.6 - 90;
                    accumulatedPercent += share;

                    let color = "#3b82f6";
                    if (partner.avatarColor?.includes("pink")) color = "#f43f5e";
                    if (partner.avatarColor?.includes("amber")) color = "#f59e0b";
                    if (partner.avatarColor?.includes("emerald")) color = "#10b981";
                    if (partner.avatarColor?.includes("purple")) color = "#a855f7";
                    if (partner.avatarColor?.includes("cyan")) color = "#06b6d4";

                    return (
                        <circle
                            key={partner.id}
                            cx="70"
                            cy="70"
                            r={radius}
                            fill="transparent"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(${rotation} 70 70)`}
                            strokeLinecap="round"
                            className="transition-all duration-500 hover:stroke-[16px] cursor-pointer"
                            title={`${partner.name}: ${share}%`}
                        />
                    );
                })}
            </svg>
        );
    };

    return (
        <AdminShell title="Partners & Investments">
            {isLoading ? (
                <div className="flex justify-center flex-col items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500 font-medium">Loading finance registry...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Top Action Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Capital Ledger & Shop Financials</h2>
                            <p className="text-sm text-gray-500 mt-1">Track business contributions, real-time sales revenue, returned products, and boosting expenses.</p>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <button
                                onClick={openAddPartner}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Partner
                            </button>
                            <button
                                onClick={() => {
                                    if (data.partners.length === 0) {
                                        toast.error("Please add a partner first before logging transactions.");
                                        return;
                                    }
                                    setTxPartnerId(data.partners[0].id);
                                    setTxAmount("");
                                    setTxDescription("");
                                    setTxType("Capital Injection");
                                    setTxDate(new Date().toISOString().split("T")[0]);
                                    setShowTxModal(true);
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200"
                            >
                                <Coins className="w-4 h-4" /> Log Capital Tx
                            </button>
                            <button
                                onClick={() => {
                                    setBoostAmount("");
                                    setBoostPlatform("Facebook Ads");
                                    setBoostCampaign("");
                                    setBoostDescription("");
                                    setBoostDate(new Date().toISOString().split("T")[0]);
                                    setShowBoostModal(true);
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <TrendingUp className="w-4 h-4" /> Log Boosting Spend
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* 1. Total Sourced Capital */}
                        <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sourced Capital / মোট বিনিয়োগ</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCapital)}</h3>
                                </div>
                                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4 text-xs text-gray-500 border-t pt-3">
                                <span>Paid: <strong className="text-green-600 font-bold">{formatCurrency(paidCapital)}</strong></span>
                                <span>Pending: <strong className="text-yellow-600 font-bold">{formatCurrency(pendingCapital)}</strong></span>
                            </div>
                        </div>

                        {/* 2. Real-Time Delivered Sales */}
                        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Delivered Sales / মার্কেট সেল (ডেলিভারড)</p>
                                    <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(dbStats.deliveredSales)}</h3>
                                </div>
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 border-t pt-3 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" /> Real-time revenue from successfully delivered products
                            </p>
                        </div>

                        {/* 3. Shipped / In-Transit Value */}
                        <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">In-Transit Value / ডেলিভারি পথে (শিপড)</p>
                                    <h3 className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(dbStats.shippedSales)}</h3>
                                </div>
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 border-t pt-3 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" /> Product value currently on the market with shipping status
                            </p>
                        </div>

                        {/* 4. Returned Products Value */}
                        <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Returned Products / রিটার্ন প্রোডাক্ট</p>
                                    <h3 className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(dbStats.returnedSales)}</h3>
                                </div>
                                <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
                                    <ArrowDownRight className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-4 text-xs text-gray-500 border-t pt-3">
                                <span>Return Rate: <strong className="text-red-600 font-bold">{returnRate.toFixed(1)}%</strong></span>
                                <span>Returned Count: <strong className="text-red-600 font-bold">{dbStats.returnedOrdersCount}</strong></span>
                            </div>
                        </div>

                        {/* 5. Total Boosting Spend */}
                        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Boosting Spend / বুস্টিং খরচ</p>
                                    <h3 className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalBoostingSpend)}</h3>
                                </div>
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                                    <Coins className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-4 border-t pt-3">
                                Boost Ratio (ROAS): <strong className="text-gray-900">{roas > 0 ? `${roas.toFixed(2)}x` : "N/A"}</strong> (Delivered Sales / Boost)
                            </p>
                        </div>

                        {/* 6. Current Treasury / Working Capital */}
                        <div className="bg-white p-6 rounded-xl border border-cyan-100 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estimated Cash Flow / চলতি তহবিল</p>
                                    <h3 className={`text-2xl font-bold mt-1 ${workingCapital >= 0 ? "text-cyan-700" : "text-red-600"}`}>
                                        {formatCurrency(workingCapital)}
                                    </h3>
                                </div>
                                <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-lg">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 border-t pt-3 flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" /> (Paid Invest + Sales) - (Boost + Withdrawals)
                            </p>
                        </div>

                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab("equity")}
                                className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === "equity" ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Users className="w-4 h-4" /> Co-Founders & Equity
                            </button>
                            <button
                                onClick={() => setActiveTab("boosting")}
                                className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === "boosting" ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Coins className="w-4 h-4" /> Ad Boosting Spend
                                {(data.boostingSpends || []).length > 0 && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {(data.boostingSpends || []).length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("transactions")}
                                className={`py-4 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === "transactions" ? "border-blue-600 text-blue-600 bg-blue-50/20" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                            >
                                <Calendar className="w-4 h-4" /> Capital Transactions
                                {data.transactions.length > 0 && (
                                    <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {data.transactions.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <div className="p-6">
                            
                            {/* Tab 1: Co-Founders & Equity */}
                            {activeTab === "equity" && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Equity Share Chart */}
                                        <div className="bg-gray-50 p-6 rounded-xl border flex flex-col items-center justify-center text-center">
                                            <h3 className="text-sm font-bold text-gray-900 mb-6 self-start uppercase tracking-wider text-gray-500">Equity Share Breakdown</h3>
                                            {totalCapital > 0 ? (
                                                <>
                                                    <div className="relative flex items-center justify-center mb-6">
                                                        {renderDonutChart()}
                                                        <div className="absolute flex flex-col items-center justify-center">
                                                            <span className="text-xs text-gray-400 font-medium">Total Capital</span>
                                                            <span className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(totalCapital)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full space-y-2.5 mt-2">
                                                        {data.partners.map((partner) => {
                                                            let colorBg = "bg-blue-500";
                                                            if (partner.avatarColor?.includes("pink")) colorBg = "bg-rose-500";
                                                            if (partner.avatarColor?.includes("amber")) colorBg = "bg-amber-500";
                                                            if (partner.avatarColor?.includes("emerald")) colorBg = "bg-emerald-500";
                                                            if (partner.avatarColor?.includes("purple")) colorBg = "bg-purple-500";
                                                            if (partner.avatarColor?.includes("cyan")) colorBg = "bg-cyan-500";

                                                            return (
                                                                <div key={partner.id} className="flex justify-between items-center text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${colorBg}`} />
                                                                        <span className="text-gray-700 font-medium">{partner.name}</span>
                                                                    </div>
                                                                    <span className="font-bold text-gray-900">{partner.sharePercentage}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-gray-500 text-sm py-10">Add partners to see the equity breakdown.</p>
                                            )}
                                        </div>

                                        {/* Profit/Loss Share Calculator */}
                                        <div className="lg:col-span-2 bg-gray-50 p-6 rounded-xl border flex flex-col">
                                            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2 uppercase tracking-wider text-gray-500">
                                                Profit/Loss Share Calculator
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-6">Enter net company profit or loss figures to see how it distributes among co-founders.</p>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Calculator Mode</label>
                                                    <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCalcType("PROFIT")}
                                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${calcType === "PROFIT" ? "bg-white text-green-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                                                        >
                                                            Net Profit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCalcType("LOSS")}
                                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${calcType === "LOSS" ? "bg-white text-red-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
                                                        >
                                                            Net Loss
                                                        </button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Net Amount (BDT)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3.5 top-2 text-sm font-semibold text-gray-400">৳</span>
                                                        <input
                                                            type="number"
                                                            value={calcAmount}
                                                            onChange={(e) => setCalcAmount(Number(e.target.value))}
                                                            placeholder="Enter amount..."
                                                            className="w-full pl-7 pr-3 py-1.5 border rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex-1 border bg-white rounded-lg overflow-hidden">
                                                <div className="bg-gray-50 border-b px-4 py-2 flex justify-between items-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    <span>Partner Name & Role</span>
                                                    <div className="flex gap-16">
                                                        <span>Share</span>
                                                        <span className="w-24 text-right">Distribution</span>
                                                    </div>
                                                </div>
                                                <div className="divide-y max-h-[160px] overflow-y-auto">
                                                    {data.partners.map((partner) => {
                                                        const payout = (partner.sharePercentage / 100) * calcAmount;
                                                        return (
                                                            <div key={partner.id} className="px-4 py-2.5 flex justify-between items-center text-sm">
                                                                <div>
                                                                    <h5 className="font-semibold text-gray-900">{partner.name}</h5>
                                                                    <p className="text-xs text-gray-500">{partner.role}</p>
                                                                </div>
                                                                <div className="flex items-center gap-12">
                                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{partner.sharePercentage}%</span>
                                                                    <span className={`w-28 text-right font-bold ${calcType === "PROFIT" ? "text-green-600" : "text-red-500"}`}>
                                                                        {calcType === "PROFIT" ? "+" : "-"}{formatCurrency(payout)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {data.partners.length === 0 && (
                                                        <p className="text-center py-8 text-gray-400 text-xs">Add co-founders to display share distribution.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Registry List */}
                                    <div className="border-t pt-8">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">Founders & Partners Registry</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {data.partners.map((partner) => {
                                                return (
                                                    <div key={partner.id} className="border rounded-xl p-5 flex flex-col relative group hover:shadow-md transition-all bg-white">
                                                        <div className="flex justify-between items-start">
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${partner.avatarColor || "from-blue-500 to-indigo-500"} flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0`}>
                                                                {partner.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => openEditPartner(partner)}
                                                                    className="p-1 hover:bg-gray-100 text-gray-500 hover:text-blue-600 rounded transition-colors"
                                                                    title="Edit Partner"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePartner(partner.id)}
                                                                    className="p-1 hover:bg-gray-100 text-gray-500 hover:text-red-500 rounded transition-colors"
                                                                    title="Delete Partner"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4">
                                                            <h4 className="font-bold text-gray-900 truncate">{partner.name}</h4>
                                                            <p className="text-xs text-gray-500 font-medium truncate">{partner.role}</p>
                                                        </div>

                                                        <div className="mt-6 space-y-2 border-t pt-4 text-xs">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400 font-medium">Investment</span>
                                                                <span className="font-bold text-gray-900">{formatCurrency(partner.investmentAmount)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400 font-medium">Equity Share</span>
                                                                <span className="font-bold text-blue-600">{partner.sharePercentage}%</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-gray-400 font-medium">Status</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${partner.status === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                                                    {partner.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400 font-medium">Joined</span>
                                                                <span className="text-gray-700 font-bold">{partner.joinedDate}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {data.partners.length === 0 && (
                                                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-gray-50">
                                                    <Users className="w-10 h-10 text-gray-300 mb-2" />
                                                    <p className="text-gray-500 font-medium text-sm">No co-founders registered yet.</p>
                                                    <button
                                                        onClick={openAddPartner}
                                                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                                    >
                                                        Register First Partner
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Ad Boosting Ledger */}
                            {activeTab === "boosting" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Ad Boosting Expense Registry</h3>
                                        <button
                                            onClick={() => {
                                                setBoostAmount("");
                                                setBoostPlatform("Facebook Ads");
                                                setBoostCampaign("");
                                                setBoostDescription("");
                                                setBoostDate(new Date().toISOString().split("T")[0]);
                                                setShowBoostModal(true);
                                            }}
                                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Log Boosting Spend
                                        </button>
                                    </div>

                                    {/* Platform Wise Breakdown summaries */}
                                    {Object.keys(platformBreakdown).length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                            {Object.entries(platformBreakdown).map(([platform, amount]) => (
                                                <div key={platform} className="bg-gray-50 border p-3 rounded-lg flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">{platform}</span>
                                                    <span className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Boosting table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 border-b text-xs font-semibold uppercase tracking-wider bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Platform</th>
                                                    <th className="px-4 py-3">Campaign Name</th>
                                                    <th className="px-4 py-3">Description / Target</th>
                                                    <th className="px-4 py-3 text-right">Amount Spent</th>
                                                    <th className="px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {(data.boostingSpends || []).map((boost) => (
                                                    <tr key={boost.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">{boost.date}</td>
                                                        <td className="px-4 py-3.5 font-semibold text-amber-700">{boost.platform}</td>
                                                        <td className="px-4 py-3.5 font-bold text-gray-800">{boost.campaign}</td>
                                                        <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate" title={boost.description}>{boost.description || "N/A"}</td>
                                                        <td className="px-4 py-3.5 text-right font-bold text-red-600">-{formatCurrency(boost.amount)}</td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <button
                                                                onClick={() => handleDeleteBoost(boost.id)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                                                title="Delete Expense"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(data.boostingSpends || []).length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">No boosting expenses logged yet. Clear, real-time logging helps calculate marketing ROI accurately!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Capital Transactions */}
                            {activeTab === "transactions" && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b pb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Capital Transactions Ledger</h3>
                                        <button
                                            onClick={() => {
                                                if (data.partners.length === 0) {
                                                    toast.error("Please add a partner first before logging transactions.");
                                                    return;
                                                }
                                                setTxPartnerId(data.partners[0].id);
                                                setTxAmount("");
                                                setTxDescription("");
                                                setTxType("Capital Injection");
                                                setTxDate(new Date().toISOString().split("T")[0]);
                                                setShowTxModal(true);
                                            }}
                                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Log Capital Transaction
                                        </button>
                                    </div>

                                    {/* Transactions table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-gray-500 border-b text-xs font-semibold uppercase tracking-wider bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Founder / Partner</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Description</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                    <th className="px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {data.transactions.map((tx) => {
                                                    const isInjection = tx.type === "Capital Injection";
                                                    return (
                                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">{tx.date}</td>
                                                            <td className="px-4 py-3.5">{tx.partnerName}</td>
                                                            <td className="px-4 py-3.5">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${isInjection ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                                                    {isInjection ? (
                                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                                                    )}
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-gray-600 max-w-xs truncate" title={tx.description}>{tx.description}</td>
                                                            <td className={`px-4 py-3.5 text-right font-bold ${isInjection ? 'text-green-600' : 'text-rose-500'}`}>
                                                                {isInjection ? "+" : "-"}{formatCurrency(tx.amount)}
                                                            </td>
                                                            <td className="px-4 py-3.5 text-center">
                                                                <button
                                                                    onClick={() => handleDeleteTx(tx.id)}
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                                                    title="Delete Log"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {data.transactions.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" className="py-8 text-center text-gray-500">No transactions logged yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* MODAL: ADD/EDIT PARTNER */}
                    {showPartnerModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg border w-full max-w-md overflow-hidden animate-slide-up">
                                <div className="flex justify-between items-center px-6 py-4 border-b">
                                    <h4 className="font-bold text-gray-900">{editingPartner ? "Edit Partner" : "Add New Partner"}</h4>
                                    <button onClick={() => setShowPartnerModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handlePartnerSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Partner Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={partnerName}
                                            onChange={(e) => setPartnerName(e.target.value)}
                                            placeholder="e.g. Shakib Al Hasan"
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role / Designation *</label>
                                        <input
                                            type="text"
                                            required
                                            value={partnerRole}
                                            onChange={(e) => setPartnerRole(e.target.value)}
                                            placeholder="e.g. Managing Partner"
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Capital Investment (BDT) *</label>
                                            <input
                                                type="number"
                                                required
                                                value={partnerInvestment}
                                                onChange={(e) => setPartnerInvestment(e.target.value)}
                                                placeholder="e.g. 500000"
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Capital Status</label>
                                            <select
                                                value={partnerStatus}
                                                onChange={(e) => setPartnerStatus(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="Paid">Paid</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Joined Date</label>
                                        <input
                                            type="date"
                                            value={partnerJoined}
                                            onChange={(e) => setPartnerJoined(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="pt-4 border-t flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowPartnerModal(false)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors border"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {editingPartner ? "Save Changes" : "Register Partner"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* MODAL: LOG TRANSACTION */}
                    {showTxModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg border w-full max-w-md overflow-hidden animate-slide-up">
                                <div className="flex justify-between items-center px-6 py-4 border-b">
                                    <h4 className="font-bold text-gray-900">Log Capital Transaction</h4>
                                    <button onClick={() => setShowTxModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Select Co-founder *</label>
                                        <select
                                            required
                                            value={txPartnerId}
                                            onChange={(e) => setTxPartnerId(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                        >
                                            {data.partners.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Type *</label>
                                            <select
                                                value={txType}
                                                onChange={(e) => setTxType(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                            >
                                                <option value="Capital Injection">Capital Injection (Add)</option>
                                                <option value="Withdrawal">Withdrawal (Subtract)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount (BDT) *</label>
                                            <input
                                                type="number"
                                                required
                                                value={txAmount}
                                                onChange={(e) => setTxAmount(e.target.value)}
                                                placeholder="e.g. 50000"
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={txDate}
                                            onChange={(e) => setTxDate(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transaction Description *</label>
                                        <textarea
                                            required
                                            value={txDescription}
                                            onChange={(e) => setTxDescription(e.target.value)}
                                            placeholder="Write description..."
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    <div className="pt-4 border-t flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowTxModal(false)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors border"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Record Transaction
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* MODAL: LOG BOOSTING SPEND */}
                    {showBoostModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-lg border w-full max-w-md overflow-hidden animate-slide-up">
                                <div className="flex justify-between items-center px-6 py-4 border-b">
                                    <h4 className="font-bold text-gray-900">Log Ad Boosting Spend</h4>
                                    <button onClick={() => setShowBoostModal(false)} className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-all">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <form onSubmit={handleBoostSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Platform *</label>
                                        <select
                                            value={boostPlatform}
                                            onChange={(e) => setBoostPlatform(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="Facebook Ads">Facebook Ads</option>
                                            <option value="Google Ads">Google Ads</option>
                                            <option value="TikTok Ads">TikTok Ads</option>
                                            <option value="Instagram Ads">Instagram Ads</option>
                                            <option value="Youtube Ads">Youtube Ads</option>
                                            <option value="Other Platform">Other Platform / Boost</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Campaign Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={boostCampaign}
                                            onChange={(e) => setBoostCampaign(e.target.value)}
                                            placeholder="e.g. Eid Collection boost campaign"
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount Spent (BDT) *</label>
                                            <input
                                                type="number"
                                                required
                                                value={boostAmount}
                                                onChange={(e) => setBoostAmount(e.target.value)}
                                                placeholder="e.g. 5000"
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date *</label>
                                            <input
                                                type="date"
                                                required
                                                value={boostDate}
                                                onChange={(e) => setBoostDate(e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description / Notes</label>
                                        <textarea
                                            value={boostDescription}
                                            onChange={(e) => setBoostDescription(e.target.value)}
                                            placeholder="e.g. Facebook page boost targeting 18-35 age bracket, 7 days duration."
                                            rows={3}
                                            className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                        />
                                    </div>

                                    <div className="pt-4 border-t flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowBoostModal(false)}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors border"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Record Spend
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </AdminShell>
    );
}
