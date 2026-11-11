"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import {
    Search,
    Send,
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    Truck,
    Plus,
    Trash2,
    CheckCircle2,
    UserCheck,
    FlaskConical,
    ExternalLink,
    ShoppingBag,
    Loader2,
    MessageSquare,
    ChevronLeft,
} from "lucide-react";
import {
    CHANNEL_META,
    ChannelBadge,
    AdAttributionBadge,
    InboxSubNav,
} from "./InboxShared";

const fetcher = (url) => fetch(url).then((r) => r.json());

const QUICK_REPLIES = [
    {
        label: "নাম ও ঠিকানা চান",
        text: "অর্ডারটি কনফার্ম করতে অনুগ্রহ করে আপনার নাম, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বরটি দিন।",
    },
    {
        label: "ডেলিভারি চার্জ",
        text: "আমাদের ডেলিভারি চার্জ ঢাকার ভেতরে ৭০৳ (১-২ দিন) এবং ঢাকার বাইরে ১৩০৳ (২-৩ দিন)। সম্পূর্ণ ক্যাশ অন ডেলিভারিতে অর্ডার করতে পারবেন।",
    },
    {
        label: "অর্ডার নেওয়া হচ্ছে",
        text: "ধন্যবাদ! আপনার তথ্য পেয়েছি। আমি এখনি আপনার অর্ডারটি এন্ট্রি করে দিচ্ছি।",
    },
];

function formatShortTime(dateStr) {
    if (!dateStr) return "";
    try {
        return new Intl.DateTimeFormat("en-BD", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(dateStr));
    } catch {
        return "";
    }
}

function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SocialInboxWorkspace() {
    const [channelFilter, setChannelFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [mobilePane, setMobilePane] = useState("list"); // list | chat | order

    // Reply state
    const [replyText, setReplyText] = useState("");
    const [isPublicCommentReply, setIsPublicCommentReply] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Simulator dropdown
    const [showSimMenu, setShowSimMenu] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const simMenuRef = useRef(null);

    // Fraud check loading
    const [isCheckingFraud, setIsCheckingFraud] = useState(false);

    // 1-Click Order form state
    const [orderForm, setOrderForm] = useState({
        customerName: "",
        phone: "",
        address: "",
        city: "",
        deliveryArea: "INSIDE_DHAKA",
        deliveryFee: 70,
        discount: 0,
        advancePayment: 0,
        courierName: "Steadfast",
        autoBookCourier: true,
        sendConfirmationMessage: true,
    });
    const [productSearch, setProductSearch] = useState("");
    const [orderItems, setOrderItems] = useState([]);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    const messagesEndRef = useRef(null);

    // Close simulator dropdown on Escape or outside click
    useEffect(() => {
        if (!showSimMenu) return;
        const handleKey = (e) => {
            if (e.key === "Escape") setShowSimMenu(false);
        };
        const handleClickOutside = (e) => {
            if (simMenuRef.current && !simMenuRef.current.contains(e.target)) {
                setShowSimMenu(false);
            }
        };
        document.addEventListener("keydown", handleKey);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showSimMenu]);

    // 1. Poll conversations list every 4s
    const listUrl = `/api/admin/inbox/conversations?channel=${channelFilter}&status=${statusFilter}&search=${encodeURIComponent(
        searchQuery
    )}`;
    const {
        data: listRes,
        mutate: mutateList,
        isLoading: isLoadingList,
    } = useSWR(listUrl, fetcher, { refreshInterval: 4000 });

    const conversations = listRes?.data || [];
    const unreadByChannel = listRes?.unreadByChannel || {};
    const totalUnread = listRes?.totalUnread || 0;
    const staffUsers = listRes?.staffUsers || [];

    // Auto-select first conversation on initial load
    useEffect(() => {
        if (!selectedId && conversations.length > 0) {
            setSelectedId(conversations[0].id);
        }
    }, [conversations, selectedId]);

    // 2. Poll active conversation every 4s
    const {
        data: activeRes,
        mutate: mutateActive,
        isLoading: isLoadingActive,
    } = useSWR(
        selectedId ? `/api/admin/inbox/conversations/${selectedId}` : null,
        fetcher,
        { refreshInterval: 4000 }
    );
    const activeConv = activeRes?.data || null;

    // 3. Load products for 1-click order panel
    const { data: productsData } = useSWR("/api/admin/products", fetcher);
    const products = Array.isArray(productsData) ? productsData : productsData?.data || [];

    // Pre-fill order form when switching conversation
    useEffect(() => {
        if (!activeConv) return;
        const ext = activeConv.extractedData || {};
        const area = ext.deliveryArea || "INSIDE_DHAKA";
        setOrderForm((prev) => ({
            ...prev,
            customerName: ext.customerName || activeConv.customerName || "",
            phone: activeConv.phone || ext.phone || "",
            address: ext.address || "",
            city: ext.city || "",
            deliveryArea: area,
            deliveryFee: area === "OUTSIDE_DHAKA" ? 130 : 70,
        }));
        setIsPublicCommentReply(false);
    }, [activeConv?.id]);

    // Scroll chat to bottom when message count changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeConv?.messages?.length]);

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products.slice(0, 12);
        return products
            .filter(
                (p) =>
                    p.name?.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q)
            )
            .slice(0, 15);
    }, [products, productSearch]);

    const orderSubtotal = useMemo(
        () => orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
        [orderItems]
    );
    const orderTotal = Math.max(
        0,
        orderSubtotal + Number(orderForm.deliveryFee || 0) - Number(orderForm.discount || 0)
    );
    const codPayable = Math.max(0, orderTotal - Number(orderForm.advancePayment || 0));

    const handleSendReply = async (textOverride = null) => {
        const text = (textOverride ?? replyText).trim();
        if (!text || !selectedId) return;

        setIsSendingReply(true);
        try {
            const res = await fetch(`/api/admin/inbox/conversations/${selectedId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, isPublicCommentReply }),
            });
            const data = await res.json();
            if (data.ok) {
                if (!textOverride) setReplyText("");
                toast.success(
                    data.simulated
                        ? "রিপ্লাই সেভ হয়েছে (Demo Mode — FB/WhatsApp Token দিলে সরাসরি লাইভ যাবে)"
                        : "মেসেজ পাঠানো হয়েছে!"
                );
                mutateActive();
                mutateList();
            } else {
                toast.error(data.message || "মেসেজ পাঠানো যায়নি");
            }
        } catch {
            toast.error("নেটওয়ার্ক সমস্যার কারণে মেসেজ পাঠানো যায়নি");
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleAssignModerator = async (assignedToId) => {
        if (!selectedId) return;
        const res = await fetch(`/api/admin/inbox/conversations/${selectedId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignedToId: assignedToId || null }),
        });
        const data = await res.json();
        if (data.ok) {
            toast.success("মডারেটর অ্যাসাইন করা হয়েছে");
            mutateActive();
            mutateList();
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedId) return;
        const res = await fetch(`/api/admin/inbox/conversations/${selectedId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.ok) {
            toast.success(`স্ট্যাটাস আপডেট হয়েছে: ${newStatus}`);
            mutateActive();
            mutateList();
        }
    };

    const handleLiveFraudCheck = async () => {
        if (!selectedId) return;
        if (!orderForm.phone || orderForm.phone.replace(/\D/g, "").length < 10) {
            toast.error("ফ্রড চেক করতে সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন");
            return;
        }
        setIsCheckingFraud(true);
        try {
            await fetch(`/api/admin/inbox/conversations/${selectedId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: orderForm.phone }),
            });
            const res = await fetch(`/api/admin/inbox/conversations/${selectedId}?liveFraud=true`);
            const data = await res.json();
            if (data.ok) {
                mutateActive(data, false);
                const courier = data.data?.customerRisk?.courier;
                if (courier?.ok) {
                    toast.success(`Steadfast Success Ratio: ${courier.deliveryRatio}%`);
                } else if (courier?.message) {
                    toast.info(courier.message);
                }
            }
        } catch {
            toast.error("ফ্রড চেক করা যায়নি — একটু পর আবার চেষ্টা করুন");
        } finally {
            setIsCheckingFraud(false);
        }
    };

    const handleAddProduct = (product, variant = null) => {
        const unitPrice = variant
            ? Number(variant.salePrice || variant.price || product.salePrice || product.price)
            : Number(product.salePrice || product.discountPrice || product.price);

        const variantLabel = variant
            ? ` (${[variant.size, variant.color].filter(Boolean).join(" / ")})`
            : "";

        setOrderItems((prev) => {
            const idx = prev.findIndex(
                (i) => i.productId === product.id && (i.variantId || null) === (variant?.id || null)
            );
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                return next;
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    variantId: variant?.id || null,
                    name: `${product.name}${variantLabel}`,
                    unitPrice,
                    quantity: 1,
                },
            ];
        });
        setProductSearch("");
    };

    const handleSubmitOneClickOrder = async (e) => {
        e.preventDefault();
        if (!selectedId) return;
        if (orderItems.length === 0) {
            toast.error("অন্তত ১টি প্রোডাক্ট সিলেক্ট করুন");
            return;
        }
        setIsSubmittingOrder(true);
        try {
            const res = await fetch(`/api/admin/inbox/conversations/${selectedId}/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...orderForm,
                    items: orderItems,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                const courierMsg = data.courierBooking?.ok
                    ? ` এবং ${data.courierBooking.courierName} বুকিং সম্পন্ন (Tracking: ${data.courierBooking.trackingCode})`
                    : data.courierBooking?.message
                    ? ` (অর্ডার সেভ হয়েছে, তবে কুরিয়ার সতর্কতা: ${data.courierBooking.message})`
                    : "";
                toast.success(`অর্ডার #${data.data.orderNumber} তৈরি হয়েছে${courierMsg}`);
                setOrderItems([]);
                mutateActive();
                mutateList();
            } else {
                toast.error(data.message || "অর্ডার সাবমিট করা যায়নি");
            }
        } catch {
            toast.error("অর্ডার তৈরি করতে সমস্যা হয়েছে — পুনরায় চেষ্টা করুন");
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleSimulate = async (preset) => {
        setIsSimulating(true);
        setShowSimMenu(false);
        try {
            const res = await fetch("/api/admin/inbox/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preset }),
            });
            const data = await res.json();
            if (data.ok) {
                const convId = data.data?.conversation?.id;
                toast.success(
                    data.data?.commentAutoTriggered
                        ? `ডেমো কমেন্ট এসেছে + অটো রুল “${data.data.commentAutoTriggered}” ট্রিগার হয়েছে!`
                        : "ডেমো চ্যাট ইনবক্সে যুক্ত হয়েছে!"
                );
                await mutateList();
                if (convId) {
                    setSelectedId(convId);
                    setMobilePane("chat");
                }
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error("ডেমো মেসেজ সিমুলেট করা যায়নি");
        } finally {
            setIsSimulating(false);
        }
    };

    const risk = activeConv?.customerRisk;
    const successRatio = risk?.combinedSuccessRatio;

    return (
        <div>
            <InboxSubNav unreadTotal={totalUnread} />

            {/* Channel Filter + Simulator Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by channel">
                    {[
                        { key: "ALL", label: "সব চ্যানেল" },
                        { key: "WHATSAPP", label: "WhatsApp" },
                        { key: "MESSENGER", label: "Messenger" },
                        { key: "FB_COMMENT", label: "FB Comments" },
                    ].map((ch) => {
                        const unread = ch.key === "ALL" ? totalUnread : unreadByChannel[ch.key] || 0;
                        const active = channelFilter === ch.key;
                        return (
                            <button
                                key={ch.key}
                                type="button"
                                onClick={() => setChannelFilter(ch.key)}
                                aria-pressed={active}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                    active
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                <span>{ch.label}</span>
                                {unread > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white tabular-nums">
                                        {unread}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Test Simulator */}
                <div className="relative" ref={simMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowSimMenu((v) => !v)}
                        disabled={isSimulating}
                        aria-expanded={showSimMenu}
                        aria-haspopup="menu"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                        {isSimulating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                            <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span>টেস্ট ডেমো মেসেজ পাঠান</span>
                    </button>

                    {showSimMenu && (
                        <div
                            role="menu"
                            aria-label="Demo message presets"
                            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-30 space-y-1 overscroll-contain"
                        >
                            <p className="text-[11px] font-semibold text-gray-500 px-2 py-1">
                                টেস্ট ইনবাউন্ড ইভেন্ট সিলেক্ট করুন:
                            </p>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleSimulate("MESSENGER_AD")}
                                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-blue-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                Messenger (FB Ad + নাম/ঠিকানা/ফোনসহ)
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleSimulate("FB_COMMENT_PRICE")}
                                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-indigo-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                FB Boost Comment (“Price please?”)
                            </button>
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => handleSimulate("WHATSAPP_AD")}
                                className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-emerald-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                WhatsApp (Click-to-WhatsApp Ad মেসেজ)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Pane Switcher (visible below lg breakpoint) */}
            <div className="grid grid-cols-3 gap-1.5 mb-3 lg:hidden bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                {[
                    { id: "list", label: `চ্যাট (${conversations.length})` },
                    { id: "chat", label: "মেসেজ ও চ্যাট" },
                    { id: "order", label: "১-ক্লিক অর্ডার" },
                ].map((pane) => (
                    <button
                        key={pane.id}
                        type="button"
                        onClick={() => setMobilePane(pane.id)}
                        className={`py-2 px-2 rounded-lg text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            mobilePane === pane.id
                                ? "bg-emerald-600 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        {pane.label}
                    </button>
                ))}
            </div>

            {/* 3-Pane Unified Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* ─── LEFT PANE: Conversations List ─── */}
                <section
                    aria-label="Conversations list"
                    className={`lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-col h-[560px] lg:h-[calc(100vh-220px)] lg:min-h-[640px] ${
                        mobilePane === "list" ? "flex" : "hidden lg:flex"
                    }`}
                >
                    <div className="p-3 border-b border-gray-100 space-y-2">
                        <div className="relative">
                            <label htmlFor="inbox-search" className="sr-only">
                                কাস্টমার বা মেসেজ খুঁজুন
                            </label>
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" aria-hidden="true" />
                            <input
                                id="inbox-search"
                                name="inboxSearch"
                                type="search"
                                autoComplete="off"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="নাম, ফোন বা অ্যাড খুঁজুন…"
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            />
                        </div>
                        <div className="flex gap-1.5" role="group" aria-label="Filter by status">
                            {["ALL", "OPEN", "ORDERED", "RESOLVED"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    aria-pressed={statusFilter === st}
                                    className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                        statusFilter === st
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-gray-100">
                        {isLoadingList ? (
                            <div role="status" aria-live="polite" className="p-8 text-center text-gray-400 text-sm">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" aria-hidden="true" />
                                লোড হচ্ছে…
                            </div>
                        ) : conversations.length === 0 ? (
                            <div role="status" aria-live="polite" className="p-6 text-center text-gray-500 text-sm space-y-3">
                                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" aria-hidden="true" />
                                <p className="font-medium text-gray-700">এখনো কোনো মেসেজ নেই।</p>
                                <p className="text-xs text-gray-400 text-pretty">
                                    টেস্ট করতে নিচের বাটনে ক্লিক করে একটি ডেমো ইনবাউন্ড মেসেজ পাঠান।
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleSimulate("MESSENGER_AD")}
                                    disabled={isSimulating}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                                    ডেমো চ্যাট দিয়ে শুরু করুন
                                </button>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const isSelected = conv.id === selectedId;
                                const meta = CHANNEL_META[conv.channel] || CHANNEL_META.MESSENGER;
                                const ChannelIcon = meta.icon;
                                return (
                                    <button
                                        key={conv.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(conv.id);
                                            setMobilePane("chat");
                                        }}
                                        aria-current={isSelected ? "true" : undefined}
                                        className={`w-full text-left p-3 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
                                            isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-600" : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${meta.bg}`}
                                                    title={meta.label}
                                                >
                                                    <ChannelIcon className="w-3.5 h-3.5" aria-hidden="true" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {conv.customerName}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate tabular-nums">
                                                        {conv.phone || conv.customerHandle || meta.label}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="text-[10px] text-gray-400 tabular-nums">
                                                    {formatShortTime(conv.lastMessageAt)}
                                                </span>
                                                {conv.unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white tabular-nums">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                                            {conv.lastMessagePreview}
                                        </p>

                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                            <AdAttributionBadge
                                                adPlatform={conv.adPlatform}
                                                adName={conv.adName}
                                                campaignName={conv.campaignName}
                                            />
                                            <span
                                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                                    conv.status === "ORDERED"
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : conv.status === "RESOLVED"
                                                        ? "bg-gray-100 text-gray-600"
                                                        : "bg-blue-50 text-blue-700"
                                                }`}
                                            >
                                                {conv.status}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* ─── CENTER PANE: Chat Thread + Gemini AI Co-pilot ─── */}
                <section
                    aria-label="Active conversation"
                    className={`lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-col h-[580px] lg:h-[calc(100vh-220px)] lg:min-h-[640px] ${
                        mobilePane === "chat" ? "flex" : "hidden lg:flex"
                    }`}
                >
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            {isLoadingActive ? (
                                <Loader2 className="w-8 h-8 animate-spin mb-2" aria-hidden="true" />
                            ) : (
                                <>
                                    <ShoppingBag className="w-10 h-10 mb-3 text-gray-300" aria-hidden="true" />
                                    <p className="text-sm font-medium text-gray-600 text-pretty">
                                        বাম পাশ থেকে যেকোনো চ্যাট সিলেক্ট করুন
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => setMobilePane("list")}
                                            aria-label="চ্যাট তালিকায় ফিরে যান"
                                            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <span
                                            aria-hidden="true"
                                            className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0"
                                        >
                                            {getInitials(activeConv.customerName)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <h2 className="font-bold text-gray-900 truncate text-sm">
                                                    {activeConv.customerName}
                                                </h2>
                                                <ChannelBadge channel={activeConv.channel} compact />
                                            </div>
                                            {activeConv.phone && (
                                                <p className="text-[11px] text-gray-500 tabular-nums">
                                                    {activeConv.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <label htmlFor="assign-moderator-select" className="sr-only">
                                            মডারেটর অ্যাসাইন করুন
                                        </label>
                                        <select
                                            id="assign-moderator-select"
                                            value={activeConv.assignedToId || ""}
                                            onChange={(e) => handleAssignModerator(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            <option value="">Unassigned</option>
                                            {staffUsers.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name || u.email}
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor="conv-status-select" className="sr-only">
                                            চ্যাট স্ট্যাটাস
                                        </label>
                                        <select
                                            id="conv-status-select"
                                            value={activeConv.status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            <option value="OPEN">OPEN</option>
                                            <option value="PENDING">PENDING</option>
                                            <option value="ORDERED">ORDERED</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <AdAttributionBadge
                                        adPlatform={activeConv.adPlatform}
                                        adName={activeConv.adName}
                                        campaignName={activeConv.campaignName}
                                    />
                                    {activeConv.campaignName && (
                                        <span className="text-[11px] text-gray-500">
                                            Campaign: <strong className="text-gray-700">{activeConv.campaignName}</strong>
                                        </span>
                                    )}
                                    {activeConv.postTitle && (
                                        <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 truncate max-w-full">
                                            Post: {activeConv.postTitle}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 bg-slate-50/60">
                                {(activeConv.messages || []).map((msg) => {
                                    const isOutbound = msg.direction === "OUTBOUND";
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${
                                                isOutbound ? "items-end" : "items-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words ${
                                                    msg.senderType === "AI_AUTO"
                                                        ? "bg-violet-600 text-white rounded-br-sm"
                                                        : isOutbound
                                                        ? "bg-emerald-600 text-white rounded-br-sm"
                                                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                                                }`}
                                            >
                                                {msg.mediaUrl && (
                                                    <img
                                                        src={msg.mediaUrl}
                                                        alt="Customer attachment"
                                                        width={320}
                                                        height={240}
                                                        loading="lazy"
                                                        className="rounded-lg max-h-48 w-auto mb-2 object-cover outline outline-1 outline-black/10 -outline-offset-1"
                                                    />
                                                )}
                                                <p className="leading-relaxed">{msg.body}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1 tabular-nums">
                                                {msg.senderType === "AI_AUTO" && (
                                                    <>
                                                        <MessageSquare className="w-3 h-3 text-indigo-600" aria-hidden="true" />
                                                        Auto-Reply
                                                    </>
                                                )}
                                                {msg.senderType === "MODERATOR" && (
                                                    <>
                                                        <UserCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                                                        {msg.sender?.name ||
                                                            msg.metadata?.staffName ||
                                                            "Moderator"}
                                                    </>
                                                )}
                                                {msg.senderType === "CUSTOMER" && activeConv.customerName}
                                                 {" · "}
                                                 {formatShortTime(msg.createdAt)}
                                             </span>
                                         </div>
                                     );
                                 })}
                                 <div ref={messagesEndRef} />
                             </div>

                             {/* Reply Input Box + Quick Replies */}
                            <div className="p-3 border-t border-gray-200 bg-white space-y-2">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                    {QUICK_REPLIES.map((qr) => (
                                        <button
                                            key={qr.label}
                                            type="button"
                                            onClick={() => setReplyText(qr.text)}
                                            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            + {qr.label}
                                        </button>
                                    ))}
                                </div>

                                {activeConv.channel.includes("COMMENT") && (
                                    <label
                                        htmlFor="public-comment-toggle"
                                        className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-0.5"
                                    >
                                        <input
                                            id="public-comment-toggle"
                                            type="checkbox"
                                            checked={isPublicCommentReply}
                                            onChange={(e) => setIsPublicCommentReply(e.target.checked)}
                                            className="rounded text-emerald-600 focus-visible:ring-emerald-500"
                                        />
                                        <span>
                                            পাবলিক কমেন্টে রিপ্লাই দিন (আনচেক রাখলে সরাসরি কাস্টমারের ইনবক্সে যাবে)
                                        </span>
                                    </label>
                                )}

                                <div className="flex gap-2">
                                    <label htmlFor="inbox-reply-input" className="sr-only">
                                        কাস্টমারকে মেসেজ লিখুন
                                    </label>
                                    <textarea
                                        id="inbox-reply-input"
                                        name="replyText"
                                        rows={2}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendReply();
                                            }
                                        }}
                                        placeholder="মেসেজ লিখুন… (Enter চাপলে সেন্ড হবে)"
                                        className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSendReply()}
                                        disabled={isSendingReply || !replyText.trim()}
                                        className="px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    >
                                        {isSendingReply ? (
                                            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                        ) : (
                                            <Send className="w-4 h-4" aria-hidden="true" />
                                        )}
                                        <span>Send</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* ─── RIGHT PANE: Fraud/Delivery Ratio + 1-Click Order & Courier Booking ─── */}
                <section
                    aria-label="Customer risk and 1-click order"
                    className={`lg:col-span-4 space-y-4 lg:h-[calc(100vh-220px)] lg:min-h-[640px] overflow-y-auto overscroll-contain pr-0.5 ${
                        mobilePane === "order" ? "block" : "hidden lg:block"
                    }`}
                >
                    {/* 1. Courier Fraud Check & Delivery Success Ratio */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 text-balance">
                                {risk?.riskLevel === "HIGH_RISK" || risk?.riskLevel === "BLOCKED" ? (
                                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                )}
                                ডেলিভারি ও ফ্রড চেক
                            </h3>
                            <button
                                type="button"
                                onClick={handleLiveFraudCheck}
                                disabled={isCheckingFraud || !selectedId}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 touch-manipulation transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                                {isCheckingFraud ? (
                                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                )}
                                Live Fraud Check
                            </button>
                        </div>

                        {!orderForm.phone ? (
                            <p className="text-xs text-gray-500 text-pretty">
                                কাস্টমার ফোন নম্বর দিলে বা নিচের ফর্মে লিখলে আগের Delivery Success Ratio ও ফেক অর্ডার রিস্ক দেখা যাবে।
                            </p>
                        ) : (
                            <div className="space-y-2.5" role="status" aria-live="polite">
                                <div className="flex items-center justify-between text-xs gap-2">
                                    <span className="font-semibold text-gray-800 tabular-nums">
                                        {orderForm.phone}
                                    </span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full font-bold border ${
                                            risk?.riskLevel === "BLOCKED" || risk?.riskLevel === "HIGH_RISK"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : risk?.riskLevel === "MODERATE_RISK"
                                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        }`}
                                    >
                                        {risk?.riskLabel || "নতুন কাস্টমার"}
                                    </span>
                                </div>

                                {successRatio !== null && successRatio !== undefined && (
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold mb-1 tabular-nums">
                                            <span>Delivery Success Ratio</span>
                                            <span>{successRatio}%</span>
                                        </div>
                                        <div
                                            role="progressbar"
                                            aria-valuenow={Math.min(100, Math.max(0, successRatio))}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label="Delivery success ratio"
                                            className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
                                        >
                                            <div
                                                className={`h-full transition-[width] duration-300 ${
                                                    successRatio >= 80
                                                        ? "bg-emerald-500"
                                                        : successRatio >= 55
                                                        ? "bg-amber-500"
                                                        : "bg-rose-600"
                                                }`}
                                                style={{ width: `${Math.min(100, Math.max(0, successRatio))}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2 text-center pt-1 tabular-nums">
                                    <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-100">
                                        <p className="text-[10px] text-gray-500">মোট অর্ডার</p>
                                        <p className="text-sm font-bold text-gray-800">
                                            {risk?.local?.totalOrders ?? 0}
                                        </p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-lg p-1.5 border border-emerald-100">
                                        <p className="text-[10px] text-emerald-700">ডেলিভার্ড</p>
                                        <p className="text-sm font-bold text-emerald-800">
                                            {risk?.local?.deliveredOrders ?? 0}
                                        </p>
                                    </div>
                                    <div className="bg-rose-50 rounded-lg p-1.5 border border-rose-100">
                                        <p className="text-[10px] text-rose-700">ক্যানসেল</p>
                                        <p className="text-sm font-bold text-rose-800">
                                            {risk?.local?.cancelledOrders ?? 0}
                                        </p>
                                    </div>
                                </div>

                                {risk?.courier?.ok && (
                                    <p className="text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 tabular-nums">
                                        Steadfast Global: {risk.courier.deliveryRatio}% সফল · {risk.courier.volumeRange}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 2. 1-Click Order Entry + Auto Courier Booking */}
                    <form
                        onSubmit={handleSubmitOneClickOrder}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3"
                    >
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2 text-balance">
                            <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                            চ্যাট থেকেই ১-ক্লিক অর্ডার এন্ট্রি
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="order-customer-name" className="text-[11px] font-semibold text-gray-700">
                                    কাস্টমার নাম <span aria-hidden="true">*</span>
                                </label>
                                <input
                                    id="order-customer-name"
                                    name="customerName"
                                    type="text"
                                    autoComplete="off"
                                    required
                                    aria-required="true"
                                    value={orderForm.customerName}
                                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="order-phone" className="text-[11px] font-semibold text-gray-700">
                                    ফোন নম্বর <span aria-hidden="true">*</span>
                                </label>
                                <input
                                    id="order-phone"
                                    name="phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="off"
                                    spellCheck={false}
                                    required
                                    aria-required="true"
                                    placeholder="01XXXXXXXXX…"
                                    value={orderForm.phone}
                                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mt-0.5 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="order-address" className="text-[11px] font-semibold text-gray-700">
                                সম্পূর্ণ ঠিকানা <span aria-hidden="true">*</span>
                            </label>
                            <textarea
                                id="order-address"
                                name="address"
                                rows={2}
                                required
                                aria-required="true"
                                placeholder="বাসা, রোড, এলাকা, থানা, জেলা…"
                                value={orderForm.address}
                                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mt-0.5 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="order-area" className="text-[11px] font-semibold text-gray-700">
                                    ডেলিভারি এরিয়া
                                </label>
                                <select
                                    id="order-area"
                                    name="deliveryArea"
                                    value={orderForm.deliveryArea}
                                    onChange={(e) => {
                                        const area = e.target.value;
                                        setOrderForm({
                                            ...orderForm,
                                            deliveryArea: area,
                                            deliveryFee: area === "OUTSIDE_DHAKA" ? 130 : 70,
                                        });
                                    }}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mt-0.5 bg-white text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <option value="INSIDE_DHAKA">ঢাকার ভেতরে (৳৭০)</option>
                                    <option value="OUTSIDE_DHAKA">ঢাকার বাইরে (৳১৩০)</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="order-city" className="text-[11px] font-semibold text-gray-700">
                                    শহর / জেলা
                                </label>
                                <input
                                    id="order-city"
                                    name="city"
                                    type="text"
                                    autoComplete="off"
                                    placeholder="e.g. Dhaka…"
                                    value={orderForm.city}
                                    onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Product Picker */}
                        <div className="space-y-1.5">
                            <label htmlFor="order-product-search" className="text-[11px] font-semibold text-gray-700">
                                প্রোডাক্ট যোগ করুন <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="order-product-search"
                                name="productSearch"
                                type="search"
                                autoComplete="off"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="প্রোডাক্টের নাম বা SKU লিখুন…"
                                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            />
                            {productSearch.trim().length > 0 && (
                                <div className="max-h-44 overflow-y-auto overscroll-contain border border-gray-200 rounded-lg divide-y bg-gray-50">
                                    {filteredProducts.length === 0 ? (
                                        <p className="p-2.5 text-xs text-gray-500">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
                                    ) : (
                                        filteredProducts.map((prod) => (
                                            <div key={prod.id} className="p-2 text-xs space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-gray-800 truncate">
                                                        {prod.name}
                                                    </span>
                                                    <span className="text-emerald-700 font-bold shrink-0 tabular-nums">
                                                        ৳{prod.salePrice || prod.price}
                                                    </span>
                                                </div>
                                                {prod.variants?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {prod.variants.map((v) => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                onClick={() => handleAddProduct(prod, v)}
                                                                className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 text-[10px] tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                            >
                                                                + {[v.size, v.color].filter(Boolean).join("/")} ({v.stock})
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddProduct(prod)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" aria-hidden="true" />
                                                        Add (Stock: {prod.stock})
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Selected Order Items */}
                            {orderItems.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    {orderItems.map((item, idx) => (
                                        <div
                                            key={`${item.productId}_${item.variantId || idx}`}
                                            className="flex items-center justify-between gap-2 bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1.5 text-xs"
                                        >
                                            <span className="truncate font-medium text-gray-800 flex-1 min-w-0">
                                                {item.name}
                                            </span>
                                            <label htmlFor={`qty-${idx}`} className="sr-only">
                                                Quantity for {item.name}
                                            </label>
                                            <input
                                                id={`qty-${idx}`}
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const q = Math.max(1, Number(e.target.value));
                                                    setOrderItems((prev) =>
                                                        prev.map((x, i) => (i === idx ? { ...x, quantity: q } : x))
                                                    );
                                                }}
                                                className="w-12 border border-gray-200 rounded px-1 py-0.5 text-center bg-white tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                            />
                                            <span className="font-bold text-gray-900 tabular-nums shrink-0">
                                                ৳{item.unitPrice * item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={`Remove ${item.name}`}
                                                onClick={() =>
                                                    setOrderItems((prev) => prev.filter((_, i) => i !== idx))
                                                }
                                                className="w-7 h-7 flex items-center justify-center rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Totals & Courier Selection */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                            <div>
                                <label htmlFor="order-delivery-fee" className="text-[10px] font-semibold text-gray-600">
                                    ডেলিভারি ফি
                                </label>
                                <input
                                    id="order-delivery-fee"
                                    type="number"
                                    min={0}
                                    value={orderForm.deliveryFee}
                                    onChange={(e) =>
                                        setOrderForm({ ...orderForm, deliveryFee: Number(e.target.value) })
                                    }
                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="order-discount" className="text-[10px] font-semibold text-gray-600">
                                    ডিসকাউন্ট
                                </label>
                                <input
                                    id="order-discount"
                                    type="number"
                                    min={0}
                                    value={orderForm.discount}
                                    onChange={(e) =>
                                        setOrderForm({ ...orderForm, discount: Number(e.target.value) })
                                    }
                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="order-advance" className="text-[10px] font-semibold text-gray-600">
                                    অ্যাডভান্স
                                </label>
                                <input
                                    id="order-advance"
                                    type="number"
                                    min={0}
                                    value={orderForm.advancePayment}
                                    onChange={(e) =>
                                        setOrderForm({ ...orderForm, advancePayment: Number(e.target.value) })
                                    }
                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                <span>মোট বিল (COD সংগ্রহ):</span>
                                <span className="text-base text-emerald-700 tabular-nums">
                                    ৳{codPayable.toLocaleString("en-BD")}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                    Steadfast Courier
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Connected
                                </span>
                            </div>

                            <label
                                htmlFor="auto-book-courier"
                                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-0.5"
                            >
                                <input
                                    id="auto-book-courier"
                                    type="checkbox"
                                    checked={orderForm.autoBookCourier}
                                    onChange={(e) =>
                                        setOrderForm({ ...orderForm, autoBookCourier: e.target.checked })
                                    }
                                    className="rounded text-emerald-600 focus-visible:ring-emerald-500"
                                />
                                <span>অর্ডার সাবমিটের সাথেই Steadfast-এ অটো-বুকিং করুন</span>
                            </label>

                            <label
                                htmlFor="send-confirm-chat"
                                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-0.5"
                            >
                                <input
                                    id="send-confirm-chat"
                                    type="checkbox"
                                    checked={orderForm.sendConfirmationMessage}
                                    onChange={(e) =>
                                        setOrderForm({
                                            ...orderForm,
                                            sendConfirmationMessage: e.target.checked,
                                        })
                                    }
                                    className="rounded text-emerald-600 focus-visible:ring-emerald-500"
                                />
                                <span>কাস্টমারকে চ্যাটে কনফার্মেশন ও ট্র্যাকিং পাঠান</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingOrder || !selectedId}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            {isSubmittingOrder ? (
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            )}
                            <span>{isSubmittingOrder ? "সাবমিট হচ্ছে…" : "১-ক্লিকে অর্ডার সাবমিট ও বুক করুন"}</span>
                        </button>
                    </form>

                    {/* 3. Linked / Recent Orders for this customer */}
                    {activeConv && (activeConv.orders?.length > 0 || activeConv.phoneOrderHistory?.length > 0) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
                            <h4 className="text-xs font-bold text-gray-700 uppercase">
                                কাস্টমারের পূর্ববর্তী / লিংকড অর্ডার
                            </h4>
                            <div className="space-y-1.5">
                                {(activeConv.orders?.length ? activeConv.orders : activeConv.phoneOrderHistory).map(
                                    (ord) => (
                                        <a
                                            key={ord.id}
                                            href={`/admin/orders/${ord.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            <div>
                                                <p className="font-bold text-gray-800 tabular-nums">
                                                    #{ord.orderNumber}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {ord.courierName || "No Courier"}
                                                    {ord.trackingNumber ? ` · ${ord.trackingNumber}` : ""}
                                                </p>
                                            </div>
                                            <div className="text-right tabular-nums">
                                                <p className="font-bold text-emerald-700">৳{ord.total}</p>
                                                <span className="text-[10px] font-semibold text-gray-600 inline-flex items-center gap-1 justify-end">
                                                    {ord.status}
                                                    <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                                                </span>
                                            </div>
                                        </a>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
