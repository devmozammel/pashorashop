"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
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
    BarChart3,
    MessageSquareReply,
    Settings,
    Sparkles,
    Mic,
    Square,
    ImagePlus,
    Phone,
    PhoneCall,
    X,
    Maximize2,
    Volume2,
} from "lucide-react";
import {
    CHANNEL_META,
    ChannelLogo,
    ChannelAvatar,
    ChannelBadge,
    AdAttributionBadge,
} from "./InboxShared";

const fetcher = (url) => fetch(url).then((r) => r.json());

function formatCallLinks(rawPhone) {
    const digits = String(rawPhone || "").replace(/\D/g, "");
    if (!digits) return null;
    let intl = digits;
    let local = digits;
    if (/^01[3-9]\d{8}$/.test(digits)) {
        intl = `88${digits}`;
    } else if (/^8801[3-9]\d{8}$/.test(digits)) {
        local = digits.slice(2);
    } else if (/^1[3-9]\d{8}$/.test(digits)) {
        local = `0${digits}`;
        intl = `880${digits}`;
    }
    return {
        display: local,
        telHref: `tel:+${intl}`,
        waHref: `https://wa.me/${intl}`,
    };
}

function formatRecordingTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

const CHANNELS = [
    { key: "ALL", label: "সব চ্যানেল", subtitle: "Unified" },
    { key: "WHATSAPP", label: "WhatsApp", subtitle: "Cloud API" },
    { key: "MESSENGER", label: "Messenger", subtitle: "Page DM" },
    { key: "FB_COMMENT", label: "FB Comments", subtitle: "Post Reply" },
];

const STATUS_OPTIONS = [
    { key: "ALL", label: "সব মেসেজ", dot: "bg-slate-400" },
    { key: "OPEN", label: "অপেক্ষমাণ (Open)", dot: "bg-blue-500" },
    { key: "ORDERED", label: "অর্ডার সম্পন্ন", dot: "bg-emerald-500" },
    { key: "RESOLVED", label: "সমাধান (Resolved)", dot: "bg-gray-400" },
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
    const mobileSimRef = useRef(null);

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
    const [isSyncingMessenger, setIsSyncingMessenger] = useState(false);

    // Media, Voice Recording, Call & Lightbox states
    const [lightboxImage, setLightboxImage] = useState(null);
    const [pendingMedia, setPendingMedia] = useState(null);
    const [ephemeralSentPreviews, setEphemeralSentPreviews] = useState({});
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [recordingSec, setRecordingSec] = useState(0);
    const [voiceDraft, setVoiceDraft] = useState(null); // { blob, objectUrl, durationSec }
    const [showCallPopover, setShowCallPopover] = useState(false);
    const [callPhoneInput, setCallPhoneInput] = useState("");
    const [isSavingCallPhone, setIsSavingCallPhone] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const recordTimerRef = useRef(null);
    const audioChunksRef = useRef([]);
    const callPopoverRef = useRef(null);

    useEffect(() => {
        return () => {
            if (recordTimerRef.current) clearInterval(recordTimerRef.current);
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!lightboxImage && !showCallPopover) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                setLightboxImage(null);
                setShowCallPopover(false);
            }
        };
        const onClickOut = (e) => {
            if (showCallPopover && callPopoverRef.current && !callPopoverRef.current.contains(e.target)) {
                setShowCallPopover(false);
            }
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClickOut);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClickOut);
        };
    }, [lightboxImage, showCallPopover]);

    // Close simulator dropdown on Escape or outside click
    useEffect(() => {
        if (!showSimMenu) return;
        const handleKey = (e) => {
            if (e.key === "Escape") setShowSimMenu(false);
        };
        const handleClickOutside = (e) => {
            const insideDesktop = simMenuRef.current?.contains(e.target);
            const insideMobile = mobileSimRef.current?.contains(e.target);
            if (!insideDesktop && !insideMobile) {
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
        setPendingMedia(null);
        setVoiceDraft(null);
        setShowCallPopover(false);
        setCallPhoneInput(activeConv.phone || ext.phone || "");
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

    const handleSendReply = async (textOverride = null, mediaOverride = null) => {
        const text = (textOverride ?? replyText).trim();
        const mediaToUse = mediaOverride || pendingMedia;
        if ((!text && !mediaToUse?.url && !mediaToUse?.file) || !selectedId) return;

        setIsSendingReply(true);
        try {
            let res;
            if (mediaToUse?.file) {
                const form = new FormData();
                form.append("file", mediaToUse.file);
                form.append("text", text);
                form.append("isPublicCommentReply", String(Boolean(isPublicCommentReply)));
                res = await fetch(`/api/admin/inbox/conversations/${selectedId}/reply`, {
                    method: "POST",
                    body: form,
                });
            } else {
                res = await fetch(`/api/admin/inbox/conversations/${selectedId}/reply`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text,
                        mediaUrl: mediaToUse?.url || null,
                        mediaType: mediaToUse?.mediaType || "TEXT",
                        mediaMeta: mediaToUse
                            ? {
                                  publicId: mediaToUse.publicId || null,
                                  resourceType: mediaToUse.resourceType || null,
                              }
                            : {},
                        isPublicCommentReply,
                    }),
                });
            }
            const data = await res.json();
            if (data.ok) {
                if (mediaToUse?.file && mediaToUse?.objectUrl && data.data?.message?.id) {
                    setEphemeralSentPreviews((prev) => ({
                        ...prev,
                        [data.data.message.id]: mediaToUse.objectUrl,
                    }));
                }
                if (textOverride === null) setReplyText("");
                if (!mediaOverride) setPendingMedia(null);
                toast.success(
                    data.simulated
                        ? "রিপ্লাই সেভ হয়েছে (Demo Mode — FB/WhatsApp Token দিলে সরাসরি লাইভ যাবে)"
                        : mediaToUse?.mediaType === "AUDIO"
                        ? "ভয়েস মেসেজ পাঠানো হয়েছে!"
                        : mediaToUse?.file
                        ? "ছবি সরাসরি পাঠানো হয়েছে (ডাটাবেসে সেভ করা হয়নি)!"
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

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!String(file.type || "").startsWith("image/")) {
            toast.error("শুধুমাত্র ছবির ফাইল (JPG, PNG, WebP) নির্বাচন করুন");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("ছবির সাইজ সর্বোচ্চ ৫ এমবি হতে পারবে");
            return;
        }
        if (pendingMedia?.objectUrl) {
            URL.revokeObjectURL(pendingMedia.objectUrl);
        }
        const objectUrl = URL.createObjectURL(file);
        setPendingMedia({
            file,
            objectUrl,
            mediaType: "IMAGE",
            name: file.name,
        });
        toast.success("ছবি যুক্ত হয়েছে (ডাটাবেসে আপলোড হবে না) — Send চাপুন");
    };

    const stopStreamTracks = () => {
        if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
        }
    };

    const startVoiceRecording = async () => {
        if (!navigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
            toast.error("আপনার ব্রাউজার মাইক্রোফোন রেকর্ডিং সাপোর্ট করছে না");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            audioChunksRef.current = [];
            setVoiceDraft(null);
            setRecordingSec(0);

            const preferredMime = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find(
                (m) => MediaRecorder.isTypeSupported?.(m)
            );
            const recorder = preferredMime
                ? new MediaRecorder(stream, { mimeType: preferredMime })
                : new MediaRecorder(stream);

            recorder.ondataavailable = (ev) => {
                if (ev.data && ev.data.size > 0) {
                    audioChunksRef.current.push(ev.data);
                }
            };

            recorder.onstop = () => {
                stopStreamTracks();
                const chunks = audioChunksRef.current;
                if (chunks.length > 0) {
                    const mime = recorder.mimeType || "audio/webm";
                    const blob = new Blob(chunks, { type: mime });
                    const objectUrl = URL.createObjectURL(blob);
                    setVoiceDraft({ blob, objectUrl, mime });
                }
                setIsRecordingVoice(false);
            };

            mediaRecorderRef.current = recorder;
            recorder.start(250);
            setIsRecordingVoice(true);
            recordTimerRef.current = setInterval(() => {
                setRecordingSec((s) => s + 1);
            }, 1000);
        } catch {
            stopStreamTracks();
            toast.error("মাইক্রোফোনের অনুমতি (Permission) পাওয়া যায়নি");
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        } else {
            stopStreamTracks();
            setIsRecordingVoice(false);
        }
    };

    const cancelVoiceRecording = () => {
        audioChunksRef.current = [];
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
        }
        stopStreamTracks();
        setIsRecordingVoice(false);
        setRecordingSec(0);
        if (voiceDraft?.objectUrl) {
            URL.revokeObjectURL(voiceDraft.objectUrl);
        }
        setVoiceDraft(null);
    };

    const handleSendVoiceDraft = async () => {
        if (!voiceDraft?.blob || !selectedId) return;
        setIsUploadingMedia(true);
        try {
            const ext = voiceDraft.mime?.includes("mp4") ? "m4a" : voiceDraft.mime?.includes("ogg") ? "ogg" : "webm";
            const file = new File([voiceDraft.blob], `voice-${Date.now()}.${ext}`, {
                type: voiceDraft.mime || "audio/webm",
            });
            const form = new FormData();
            form.append("file", file);
            form.append("kind", "AUDIO");

            const upRes = await fetch("/api/admin/inbox/media/upload", {
                method: "POST",
                body: form,
            });
            const upData = await upRes.json();
            if (!upData.ok) {
                toast.error(upData.message || "ভয়েস আপলোড ব্যর্থ হয়েছে");
                return;
            }

            if (voiceDraft.objectUrl) URL.revokeObjectURL(voiceDraft.objectUrl);
            setVoiceDraft(null);
            await handleSendReply("", {
                url: upData.url,
                mediaType: "AUDIO",
                publicId: upData.publicId,
                resourceType: upData.resourceType,
            });
        } catch {
            toast.error("ভয়েস পাঠাতে সমস্যা হয়েছে");
        } finally {
            setIsUploadingMedia(false);
        }
    };

    const handleSaveCallPhone = async (e) => {
        e.preventDefault();
        if (!selectedId || !callPhoneInput.trim()) return;
        setIsSavingCallPhone(true);
        try {
            const res = await fetch(`/api/admin/inbox/conversations/${selectedId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: callPhoneInput.trim() }),
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("ফোন নম্বর সেভ হয়েছে — এখন কল বা WhatsApp কল করতে পারবেন");
                mutateActive();
                mutateList();
            } else {
                toast.error(data.message || "নম্বর সেভ করা যায়নি");
            }
        } catch {
            toast.error("নম্বর সেভ করতে সমস্যা হয়েছে");
        } finally {
            setIsSavingCallPhone(false);
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

    const handleSyncMessenger = async () => {
        setIsSyncingMessenger(true);
        try {
            const res = await fetch("/api/admin/inbox/sync-messenger", { method: "POST" });
            const data = await res.json();
            if (data.ok) {
                toast.success(
                    `Messenger সিঙ্ক সফল! ${data.syncedConversations}টি চ্যাট ও ${data.importedMessages}টি নতুন মেসেজ আনা হয়েছে।`
                );
                await mutateList();
                if (selectedId) await mutateActive();
            } else {
                toast.error(data.message || "Messenger সিঙ্ক করা যায়নি");
            }
        } catch {
            toast.error("Messenger সিঙ্ক করতে নেটওয়ার্ক সমস্যা হয়েছে");
        } finally {
            setIsSyncingMessenger(false);
        }
    };

    const risk = activeConv?.customerRisk;
    const successRatio = risk?.combinedSuccessRatio;
    const activeChannelMeta = CHANNELS.find((c) => c.key === channelFilter) || CHANNELS[0];
    const activeConvMeta = activeConv ? CHANNEL_META[activeConv.channel] || CHANNEL_META.MESSENGER : null;
    const activeCallLinks = activeConv
        ? formatCallLinks(
              activeConv.phone ||
                  orderForm.phone ||
                  (activeConv.channel === "WHATSAPP" ? activeConv.externalUserId : "")
          )
        : null;

    const simMenuContent = (
        <div
            role="menu"
            aria-label="Demo message presets"
            className="w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-40 space-y-1 overscroll-contain"
        >
            <p className="text-[11px] font-semibold text-gray-500 px-2 py-1">
                ডেমো ইনবাউন্ড মেসেজ পাঠান:
            </p>
            <button
                type="button"
                role="menuitem"
                onClick={() => handleSimulate("MESSENGER_AD")}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg text-xs hover:bg-sky-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
                <ChannelLogo channel="MESSENGER" className="w-4 h-4" />
                <span>Messenger (FB Ad + নাম/ঠিকানা/ফোনসহ)</span>
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => handleSimulate("FB_COMMENT_PRICE")}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg text-xs hover:bg-indigo-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                <ChannelLogo channel="FB_COMMENT" className="w-4 h-4" />
                <span>FB Boost Comment (“Price please?”)</span>
            </button>
            <button
                type="button"
                role="menuitem"
                onClick={() => handleSimulate("WHATSAPP_AD")}
                className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg text-xs hover:bg-emerald-50 text-gray-800 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <ChannelLogo channel="WHATSAPP" className="w-4 h-4" />
                <span>WhatsApp (Click-to-WhatsApp Ad মেসেজ)</span>
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white border-t border-gray-200">
            {/* ─── MOBILE / TABLET TOP BAR (hidden on lg+) ─── */}
            <div className="lg:hidden border-b border-gray-200 bg-white px-3 py-2 space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <Link
                            href="/admin/inbox/automations"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700"
                        >
                            <MessageSquareReply className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Auto Reply</span>
                        </Link>
                        <Link
                            href="/admin/inbox/analytics"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700"
                        >
                            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>ROI Report</span>
                        </Link>
                        <Link
                            href="/admin/inbox/settings"
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-700"
                        >
                            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>API</span>
                        </Link>
                    </div>
                    <div className="relative shrink-0" ref={mobileSimRef}>
                        <button
                            type="button"
                            onClick={() => setShowSimMenu((v) => !v)}
                            disabled={isSimulating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                        >
                            <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>ডেমো</span>
                        </button>
                        {showSimMenu && (
                            <div className="absolute right-0 mt-1.5 z-40">
                                {simMenuContent}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Channel Pills with Brand Logos */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="group" aria-label="Filter by channel">
                    {CHANNELS.map((ch) => {
                        const unread = ch.key === "ALL" ? totalUnread : unreadByChannel[ch.key] || 0;
                        const active = channelFilter === ch.key;
                        return (
                            <button
                                key={ch.key}
                                type="button"
                                onClick={() => setChannelFilter(ch.key)}
                                aria-pressed={active}
                                className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    active
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "bg-slate-100 text-gray-700 hover:bg-slate-200"
                                }`}
                            >
                                <ChannelLogo channel={ch.key} className="w-4 h-4" />
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

                {/* Mobile Pane Switcher */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    {[
                        { id: "list", label: `চ্যাট (${conversations.length})` },
                        { id: "chat", label: "মেসেজ ও চ্যাট" },
                        { id: "order", label: "১-ক্লিক অর্ডার" },
                    ].map((pane) => (
                        <button
                            key={pane.id}
                            type="button"
                            onClick={() => setMobilePane(pane.id)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold tabular-nums transition-colors ${
                                mobilePane === pane.id
                                    ? "bg-white text-emerald-700 shadow-sm"
                                    : "text-gray-600"
                            }`}
                        >
                            {pane.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── MAIN 4-PANE SAAS INBOX WORKSPACE ─── */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* ─── PANE 1: LEFT CHANNEL & NAVIGATION SIDEBAR (Desktop) ─── */}
                <aside
                    aria-label="Inbox channels and tools"
                    className="hidden lg:flex lg:flex-col w-[224px] xl:w-[240px] shrink-0 border-r border-gray-200 bg-slate-50/80 select-none"
                >
                    {/* Workspace Title */}
                    <div className="px-4 py-3.5 border-b border-gray-200/80 flex items-center justify-between gap-2 bg-white/70">
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 tracking-tight truncate">
                                Omnichannel Inbox
                            </h1>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                                <span>Live Sync · Meta API</span>
                            </p>
                        </div>
                    </div>

                    {/* Channels + Status Filters */}
                    <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
                        <div>
                            <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                চ্যানেলসমূহ
                            </p>
                            <div className="space-y-1" role="group" aria-label="Inbox channels">
                                {CHANNELS.map((ch) => {
                                    const unread = ch.key === "ALL" ? totalUnread : unreadByChannel[ch.key] || 0;
                                    const active = channelFilter === ch.key;
                                    return (
                                        <button
                                            key={ch.key}
                                            type="button"
                                            onClick={() => setChannelFilter(ch.key)}
                                            aria-pressed={active}
                                            className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-left transition-[background-color,box-shadow,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                                active
                                                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/90"
                                                    : "text-gray-700 hover:bg-white/70 hover:text-gray-900"
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5 min-w-0">
                                                <ChannelLogo channel={ch.key} className="w-5 h-5" />
                                                <span className="min-w-0">
                                                    <span className={`block text-[13px] leading-tight truncate ${active ? "font-bold" : "font-semibold"}`}>
                                                        {ch.label}
                                                    </span>
                                                    <span className="block text-[10px] text-gray-400 leading-tight mt-0.5">
                                                        {ch.subtitle}
                                                    </span>
                                                </span>
                                            </span>
                                            {unread > 0 && (
                                                <span
                                                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ${
                                                        active
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-rose-500 text-white"
                                                    }`}
                                                >
                                                    {unread}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                স্ট্যাটাস ফিল্টার
                            </p>
                            <div className="space-y-1" role="group" aria-label="Filter by status">
                                {STATUS_OPTIONS.map((st) => {
                                    const active = statusFilter === st.key;
                                    return (
                                        <button
                                            key={st.key}
                                            type="button"
                                            onClick={() => setStatusFilter(st.key)}
                                            aria-pressed={active}
                                            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                                                active
                                                    ? "bg-emerald-50 text-emerald-800 font-semibold"
                                                    : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} aria-hidden="true" />
                                            <span className="truncate">{st.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <p className="px-2.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                অটোমেশন ও রিপোর্ট
                            </p>
                            <nav aria-label="Inbox settings and reports" className="space-y-1">
                                <Link
                                    href="/admin/inbox/automations"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
                                >
                                    <MessageSquareReply className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden="true" />
                                    <span className="truncate">Comment-to-Inbox</span>
                                </Link>
                                <Link
                                    href="/admin/inbox/analytics"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
                                >
                                    <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                                    <span className="truncate">Ad ROI & Team Report</span>
                                </Link>
                                <Link
                                    href="/admin/inbox/settings"
                                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:bg-white hover:text-gray-900 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
                                    <span className="truncate">FB & WhatsApp API</span>
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Sidebar Footer: Demo Simulator */}
                    <div className="p-2.5 border-t border-gray-200/80 bg-white/60 relative" ref={simMenuRef}>
                        <button
                            type="button"
                            onClick={() => setShowSimMenu((v) => !v)}
                            disabled={isSimulating}
                            aria-expanded={showSimMenu}
                            aria-haspopup="menu"
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 hover:bg-amber-100 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                            {isSimulating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>টেস্ট ডেমো মেসেজ</span>
                        </button>
                        {showSimMenu && (
                            <div className="absolute bottom-full left-2.5 mb-2 z-50">
                                {simMenuContent}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ─── PANE 2: CONVERSATIONS LIST ─── */}
                <section
                    aria-label="Conversations list"
                    className={`w-full lg:w-[295px] xl:w-[325px] shrink-0 border-r border-gray-200 bg-white flex-col min-h-0 ${
                        mobilePane === "list" ? "flex" : "hidden lg:flex"
                    }`}
                >
                    <div className="px-3.5 py-3 border-b border-gray-100 space-y-2.5 shrink-0">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <ChannelLogo channel={channelFilter} className="w-5 h-5" />
                                <h2 className="text-sm font-bold text-gray-900 truncate">
                                    {activeChannelMeta.label}
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {(channelFilter === "ALL" || channelFilter === "MESSENGER") && (
                                    <button
                                        type="button"
                                        onClick={handleSyncMessenger}
                                        disabled={isSyncingMessenger}
                                        title="Facebook থেকে পুরনো ও নতুন Messenger চ্যাট সিঙ্ক করুন"
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <RefreshCw
                                            className={`w-3 h-3 ${isSyncingMessenger ? "animate-spin" : ""}`}
                                            aria-hidden="true"
                                        />
                                        <span>{isSyncingMessenger ? "সিঙ্ক…" : "Sync"}</span>
                                    </button>
                                )}
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 tabular-nums shrink-0">
                                    {conversations.length}
                                </span>
                            </div>
                        </div>

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
                                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-gray-200 rounded-lg focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            />
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
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
                                    <ChannelLogo channel={channelFilter} className="w-6 h-6" />
                                </div>
                                <p className="font-semibold text-gray-700">এখনো কোনো মেসেজ নেই</p>
                                <p className="text-xs text-gray-400 text-pretty">
                                    {(channelFilter === "ALL" || channelFilter === "MESSENGER")
                                        ? "Facebook Messenger থেকে মেসেজ আনতে Sync বাটনে ক্লিক করুন অথবা ডেমো চ্যাট টেস্ট করুন।"
                                        : "নিচের বাটনে ক্লিক করে একটি ডেমো ইনবাউন্ড চ্যাট টেস্ট করুন।"}
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {(channelFilter === "ALL" || channelFilter === "MESSENGER") && (
                                        <button
                                            type="button"
                                            onClick={handleSyncMessenger}
                                            disabled={isSyncingMessenger}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        >
                                            <RefreshCw
                                                className={`w-3.5 h-3.5 ${isSyncingMessenger ? "animate-spin" : ""}`}
                                                aria-hidden="true"
                                            />
                                            Messenger Sync করুন
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSimulate(
                                                channelFilter === "WHATSAPP"
                                                    ? "WHATSAPP_AD"
                                                    : channelFilter === "FB_COMMENT"
                                                    ? "FB_COMMENT_PRICE"
                                                    : "MESSENGER_AD"
                                            )
                                        }
                                        disabled={isSimulating}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                                        ডেমো চ্যাট পাঠান
                                    </button>
                                </div>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const isSelected = conv.id === selectedId;
                                const meta = CHANNEL_META[conv.channel] || CHANNEL_META.MESSENGER;
                                return (
                                    <button
                                        key={conv.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(conv.id);
                                            setMobilePane("chat");
                                        }}
                                        aria-current={isSelected ? "true" : undefined}
                                        className={`w-full text-left px-3.5 py-3 transition-colors hover:bg-slate-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${
                                            isSelected
                                                ? "bg-emerald-50/70 shadow-[inset_3px_0_0_0_#059669]"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <ChannelAvatar
                                                name={conv.customerName}
                                                channel={conv.channel}
                                                avatarUrl={conv.customerAvatar}
                                                size="md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[13px] font-semibold text-gray-900 truncate">
                                                        {conv.customerName}
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                                                        {formatShortTime(conv.lastMessageAt)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <p className="text-[11px] text-gray-500 truncate tabular-nums">
                                                        {conv.phone || conv.customerHandle || meta.label}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white tabular-nums shrink-0">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-snug">
                                                    {conv.lastMessagePreview}
                                                </p>

                                                <div className="flex flex-wrap items-center justify-between gap-1 mt-2">
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
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* ─── PANE 3: CENTER ACTIVE CHAT THREAD ─── */}
                <section
                    aria-label="Active conversation"
                    className={`flex-1 min-w-0 bg-[#F5F7FA] flex-col min-h-0 ${
                        mobilePane === "chat" ? "flex" : "hidden lg:flex"
                    }`}
                >
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            {isLoadingActive ? (
                                <Loader2 className="w-8 h-8 animate-spin mb-2" aria-hidden="true" />
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-3">
                                        <MessageSquare className="w-7 h-7 text-emerald-600" aria-hidden="true" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700">
                                        বাম পাশ থেকে যেকোনো চ্যাট সিলেক্ট করুন
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        ক্লিক করলেই এখানে সম্পূর্ণ চ্যাট এবং ডান পাশে অর্ডার ও ফ্রড চেক প্যানেল দেখা যাবে।
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="px-4 py-3 border-b border-gray-200 bg-white space-y-2 shrink-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <button
                                            type="button"
                                            onClick={() => setMobilePane("list")}
                                            aria-label="চ্যাট তালিকায় ফিরে যান"
                                            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                        <ChannelAvatar
                                            name={activeConv.customerName}
                                            channel={activeConv.channel}
                                            avatarUrl={activeConv.customerAvatar}
                                            size="lg"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <h2 className="font-bold text-gray-900 truncate text-sm">
                                                    {activeConv.customerName}
                                                </h2>
                                                <ChannelBadge channel={activeConv.channel} compact />
                                            </div>
                                            {activeConv.phone && (
                                                <p className="text-[11px] text-gray-500 tabular-nums mt-0.5">
                                                    {activeConv.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                        {activeCallLinks ? (
                                            <>
                                                <a
                                                    href={activeCallLinks.telHref}
                                                    title={`ফোন কল করুন (${activeCallLinks.display})`}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-semibold hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                >
                                                    <PhoneCall className="w-3.5 h-3.5" aria-hidden="true" />
                                                    <span className="hidden sm:inline">Call</span>
                                                </a>
                                                <a
                                                    href={activeCallLinks.waHref}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="WhatsApp-এ খুলে কল বা চ্যাট করুন"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200/90 text-xs font-semibold hover:bg-green-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                                                >
                                                    <ChannelLogo channel="WHATSAPP" className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">WA Call</span>
                                                </a>
                                            </>
                                        ) : (
                                            <div className="relative" ref={callPopoverRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCallPopover((v) => !v)}
                                                    title="কল করতে কাস্টমারের নম্বর যুক্ত করুন বা চান"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-gray-700 border border-gray-200 text-xs font-semibold hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                >
                                                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                                                    <span className="hidden sm:inline">Call</span>
                                                </button>
                                                {showCallPopover && (
                                                    <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-40 space-y-2.5">
                                                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                                                            কল করার জন্য মোবাইল নম্বর
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 leading-snug">
                                                            Meta থার্ড-পার্টি ওয়েবে সরাসরি Messenger কল দেয় না — নম্বর সেভ করলে এখান থেকেই ফোন বা WhatsApp কল করতে পারবেন।
                                                        </p>
                                                        <form onSubmit={handleSaveCallPhone} className="flex gap-1.5">
                                                            <input
                                                                type="tel"
                                                                value={callPhoneInput}
                                                                onChange={(e) => setCallPhoneInput(e.target.value)}
                                                                placeholder="01XXXXXXXXX"
                                                                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                            />
                                                            <button
                                                                type="submit"
                                                                disabled={isSavingCallPhone || !callPhoneInput.trim()}
                                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                                                            >
                                                                {isSavingCallPhone ? "…" : "Save"}
                                                            </button>
                                                        </form>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowCallPopover(false);
                                                                handleSendReply(
                                                                    "কল বা অর্ডার কনফার্ম করার জন্য অনুগ্রহ করে আপনার মোবাইল নম্বরটি দিন।"
                                                                );
                                                            }}
                                                            className="w-full py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100"
                                                        >
                                                            + চ্যাটে কাস্টমারের নম্বর চান
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <label htmlFor="assign-moderator-select" className="sr-only">
                                            মডারেটর অ্যাসাইন করুন
                                        </label>
                                        <select
                                            id="assign-moderator-select"
                                            value={activeConv.assignedToId || ""}
                                            onChange={(e) => handleAssignModerator(e.target.value)}
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-slate-50 text-gray-700 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-slate-50 font-semibold text-gray-700 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
                            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3.5">
                                <div className="flex justify-center">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200/80 text-[11px] font-medium text-gray-500 shadow-sm">
                                        <ChannelLogo channel={activeConv.channel} className="w-3.5 h-3.5" />
                                        <span>{activeConvMeta?.label || "Social"} কনভার্সেশন</span>
                                    </span>
                                </div>

                                {(activeConv.messages || []).map((msg) => {
                                    const isOutbound = msg.direction === "OUTBOUND";
                                    const outboundTone =
                                        msg.senderType === "AI_AUTO"
                                            ? "bg-indigo-600 text-white"
                                            : activeConvMeta?.bubbleOutbound || "bg-emerald-700 text-white";
                                    const displayMediaUrl =
                                        msg.mediaUrl ||
                                        msg.ephemeralMediaUrl ||
                                        ephemeralSentPreviews[msg.id] ||
                                        null;
                                    const isAudio =
                                        displayMediaUrl &&
                                        (msg.messageType === "AUDIO" ||
                                            /\.(mp3|ogg|wav|m4a|webm)(\?|$)/i.test(displayMediaUrl));
                                    const isVideo = displayMediaUrl && msg.messageType === "VIDEO";
                                    const isGenericMediaPlaceholder =
                                        (Boolean(displayMediaUrl) || msg.messageType === "IMAGE") &&
                                        /^\[(image|audio|voice message|video|attachment|ছবি পাঠানো হয়েছে)\]$/i.test(
                                            String(msg.body || "").trim()
                                        );
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${
                                                isOutbound ? "items-end" : "items-start"
                                            }`}
                                        >
                                            <div
                                                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                                                    isOutbound
                                                        ? `${outboundTone} rounded-br-sm shadow-sm`
                                                        : "bg-white text-gray-800 border border-gray-200/90 rounded-bl-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                                                }`}
                                            >
                                                {displayMediaUrl && isAudio && (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
                                                            <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                                            <span>Voice Message</span>
                                                        </div>
                                                        <audio
                                                            controls
                                                            preload="metadata"
                                                            src={displayMediaUrl}
                                                            className="w-60 sm:w-64 max-w-full h-9 rounded-lg"
                                                        />
                                                    </div>
                                                )}
                                                {displayMediaUrl && isVideo && (
                                                    <video
                                                        controls
                                                        preload="metadata"
                                                        src={displayMediaUrl}
                                                        className="rounded-lg max-h-56 w-auto mb-1.5 bg-black"
                                                    />
                                                )}
                                                {displayMediaUrl && !isAudio && !isVideo && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setLightboxImage(displayMediaUrl)}
                                                        title="সাময়িক প্রিভিউ (ডাটাবেসে সেভ নেই) — বড় করে দেখতে ক্লিক করুন"
                                                        className="group relative block rounded-lg overflow-hidden mb-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                                                    >
                                                        <img
                                                            src={displayMediaUrl}
                                                            alt="Chat attachment"
                                                            width={320}
                                                            height={240}
                                                            loading="lazy"
                                                            className="rounded-lg max-h-56 w-auto object-cover outline outline-1 outline-black/10 -outline-offset-1 transition-transform duration-150 group-hover:scale-[1.01]"
                                                        />
                                                        <span className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                                                        </span>
                                                    </button>
                                                )}
                                                {!displayMediaUrl && msg.messageType === "IMAGE" && (
                                                    <div
                                                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg mb-1 border ${
                                                            isOutbound
                                                                ? "bg-white/15 border-white/25 text-white/95"
                                                                : "bg-slate-50 border-slate-200 text-slate-600"
                                                        }`}
                                                    >
                                                        <ImagePlus className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
                                                        <span>সাময়িক ছবি (সার্ভারে সেভ করা হয়নি)</span>
                                                    </div>
                                                )}
                                                {msg.body && !isGenericMediaPlaceholder && (
                                                    <p className="leading-relaxed">{msg.body}</p>
                                                )}
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

                            {/* Reply Input Box + Quick Replies + Voice + Image */}
                            <div className="p-3 border-t border-gray-200 bg-white space-y-2 shrink-0">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                                    {QUICK_REPLIES.map((qr) => (
                                        <button
                                            key={qr.label}
                                            type="button"
                                            onClick={() => setReplyText(qr.text)}
                                            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 border border-gray-200/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

                                {/* Attached Image Preview */}
                                {pendingMedia && (
                                    <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <img
                                                src={pendingMedia.objectUrl || pendingMedia.url}
                                                alt="Selected upload"
                                                className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-emerald-900 truncate">
                                                    {pendingMedia.name || "ছবি যুক্ত হয়েছে"}
                                                </p>
                                                <p className="text-[11px] text-emerald-700">
                                                    ডাটাবেসে সেভ হবে না — সরাসরি মেসেজে যাবে, Send চাপুন
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (pendingMedia?.objectUrl) {
                                                    URL.revokeObjectURL(pendingMedia.objectUrl);
                                                }
                                                setPendingMedia(null);
                                            }}
                                            aria-label="ছবি সরান"
                                            className="p-1 rounded-lg text-emerald-800 hover:bg-emerald-100"
                                        >
                                            <X className="w-4 h-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                )}

                                {/* Live Voice Recording Bar */}
                                {isRecordingVoice && (
                                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
                                        <div className="flex items-center gap-2 text-xs font-bold text-rose-700">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                                            <span>ভয়েস রেকর্ড হচ্ছে…</span>
                                            <span className="tabular-nums font-mono">
                                                {formatRecordingTime(recordingSec)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={cancelVoiceRecording}
                                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white border border-gray-200"
                                            >
                                                বাতিল
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopVoiceRecording}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
                                            >
                                                <Square className="w-3 h-3 fill-current" aria-hidden="true" />
                                                <span>থামান</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Recorded Voice Draft Preview */}
                                {voiceDraft && !isRecordingVoice && (
                                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50/80 border border-indigo-200">
                                        <audio
                                            controls
                                            src={voiceDraft.objectUrl}
                                            className="h-8 max-w-full flex-1 min-w-[180px]"
                                        />
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={cancelVoiceRecording}
                                                disabled={isUploadingMedia || isSendingReply}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                বাতিল
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSendVoiceDraft}
                                                disabled={isUploadingMedia || isSendingReply}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isUploadingMedia || isSendingReply ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                                                )}
                                                <span>ভয়েস পাঠান</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                <div className="flex gap-2 items-end">
                                    <div className="flex flex-col gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingMedia || isRecordingVoice}
                                            title="ছবি অ্যাটাচ ও সেন্ড করুন"
                                            aria-label="ছবি অ্যাটাচ করুন"
                                            className="p-2 rounded-xl border border-gray-200 bg-slate-50 text-gray-700 hover:bg-slate-100 hover:text-emerald-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                        >
                                            {isUploadingMedia && !voiceDraft ? (
                                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                            ) : (
                                                <ImagePlus className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                                            disabled={isUploadingMedia}
                                            title={isRecordingVoice ? "রেকর্ডিং থামান" : "ভয়েস মেসেজ রেকর্ড করুন"}
                                            aria-label={isRecordingVoice ? "রেকর্ডিং থামান" : "ভয়েস মেসেজ রেকর্ড করুন"}
                                            className={`p-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 ${
                                                isRecordingVoice
                                                    ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                                                    : "border-gray-200 bg-slate-50 text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                                            }`}
                                        >
                                            {isRecordingVoice ? (
                                                <Square className="w-4 h-4 fill-current" aria-hidden="true" />
                                            ) : (
                                                <Mic className="w-4 h-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
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
                                        placeholder={`${activeConvMeta?.label || "Inbox"}-এ রিপ্লাই লিখুন… (Enter চাপলে সেন্ড)`}
                                        className="flex-1 text-sm bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none min-h-[70px]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSendReply()}
                                        disabled={isSendingReply || isUploadingMedia || (!replyText.trim() && !pendingMedia)}
                                        className="h-[70px] px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 touch-manipulation transition-[background-color,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

                {/* ─── PANE 4: RIGHT FRAUD CHECK + 1-CLICK ORDER ─── */}
                <section
                    aria-label="Customer risk and 1-click order"
                    className={`w-full lg:w-[335px] xl:w-[375px] shrink-0 border-l border-gray-200 bg-slate-50/70 overflow-y-auto overscroll-contain p-3.5 space-y-3.5 ${
                        mobilePane === "order" ? "block" : "hidden lg:block"
                    }`}
                >
                    {/* 1. Courier Fraud Check & Delivery Success Ratio */}
                    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-3.5 space-y-3">
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
                                    <div className="bg-slate-50 rounded-lg p-1.5 border border-gray-100">
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
                        className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-3.5 space-y-3"
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
                                <div className="max-h-44 overflow-y-auto overscroll-contain border border-gray-200 rounded-lg divide-y bg-slate-50">
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

                        <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-gray-200/90">
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
                        <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm p-3.5 space-y-2">
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
                                            className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

            {lightboxImage && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3"
                    >
                        <div className="flex items-center gap-2 self-end">
                            <a
                                href={lightboxImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-semibold hover:bg-white/25"
                            >
                                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>নতুন ট্যাবে খুলুন</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setLightboxImage(null)}
                                aria-label="ছবি বন্ধ করুন"
                                className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25"
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>
                        <img
                            src={lightboxImage}
                            alt="Full size chat attachment"
                            className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
