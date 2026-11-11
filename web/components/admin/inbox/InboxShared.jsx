"use client";

import { useId, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MessageSquareReply,
    BarChart3,
    Settings,
    Inbox,
    Megaphone,
    Layers,
} from "lucide-react";

/**
 * Official-style crisp SVG brand logo for WhatsApp.
 */
export function WhatsAppLogo({ className = "w-5 h-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#25D366" />
            <path
                fill="#FFFFFF"
                d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"
            />
        </svg>
    );
}

/**
 * Official-style gradient SVG brand logo for Facebook Messenger.
 */
export function MessengerLogo({ className = "w-5 h-5" }) {
    const gradId = useId();
    return (
        <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true">
            <defs>
                <linearGradient id={gradId} x1="15%" y1="90%" x2="85%" y2="10%">
                    <stop offset="0%" stopColor="#006AFF" />
                    <stop offset="45%" stopColor="#0099FF" />
                    <stop offset="78%" stopColor="#A033FF" />
                    <stop offset="100%" stopColor="#FF5280" />
                </linearGradient>
            </defs>
            <path
                fill={`url(#${gradId})`}
                d="M12 1.5C6.1 1.5 1.5 5.83 1.5 11.4c0 2.9 1.22 5.5 3.38 7.36.18.15.28.37.29.6l.06 1.88a.84.84 0 0 0 1.18.74l2.1-.93a.84.84 0 0 1 .56-.04c.92.25 1.91.39 2.93.39 5.9 0 10.5-4.33 10.5-9.9S17.9 1.5 12 1.5z"
            />
            <path
                fill="#FFFFFF"
                d="M13.06 14.23l-2.67-2.85-5.21 2.85 5.73-6.08 2.74 2.85 5.14-2.85-5.73 6.08z"
            />
        </svg>
    );
}

/**
 * Official-style Facebook logo with overlapping comment indicator for FB Comments.
 */
export function FacebookCommentLogo({ className = "w-5 h-5" }) {
    return (
        <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-hidden="true">
            <circle cx="11" cy="11.5" r="9.5" fill="#1877F2" />
            <path
                fill="#FFFFFF"
                d="M12.45 19v-6.7h2.2l.33-2.6h-2.53V8.05c0-.75.21-1.26 1.29-1.26h1.36V4.46c-.24-.03-1.05-.1-1.99-.1-1.97 0-3.32 1.2-3.32 3.41v1.93H7.57v2.6h2.22V19h2.66z"
            />
            <circle cx="18.2" cy="17.8" r="5" fill="#FFFFFF" />
            <path
                fill="#4F46E5"
                d="M18.2 13.6a4.2 4.2 0 0 0-4.2 4.1c0 .79.23 1.52.63 2.14l-.43 1.76 1.82-.45c.65.34 1.39.54 2.18.54a4.2 4.2 0 0 0 4.2-4.09 4.2 4.2 0 0 0-4.2-4zm-1.6 4.7a.55.55 0 1 1 0-1.1.55.55 0 0 1 0 1.1zm1.6 0a.55.55 0 1 1 0-1.1.55.55 0 0 1 0 1.1zm1.6 0a.55.55 0 1 1 0-1.1.55.55 0 0 1 0 1.1z"
            />
        </svg>
    );
}

export function ChannelLogo({ channel, className = "w-5 h-5" }) {
    if (channel === "WHATSAPP") return <WhatsAppLogo className={className} />;
    if (channel === "FB_COMMENT") return <FacebookCommentLogo className={className} />;
    if (channel === "MESSENGER") return <MessengerLogo className={className} />;
    return <Layers className={`${className} text-emerald-600 shrink-0`} aria-hidden="true" />;
}

export const CHANNEL_META = {
    WHATSAPP: {
        label: "WhatsApp",
        short: "WA",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        avatarBg: "bg-emerald-100 text-emerald-800",
        bubbleOutbound: "bg-emerald-700 text-white",
        dot: "bg-[#25D366]",
        Logo: WhatsAppLogo,
    },
    MESSENGER: {
        label: "Messenger",
        short: "Messenger",
        bg: "bg-sky-50 text-sky-800 border-sky-200",
        avatarBg: "bg-sky-100 text-sky-800",
        bubbleOutbound: "bg-[#006AFF] text-white",
        dot: "bg-[#006AFF]",
        Logo: MessengerLogo,
    },
    FB_COMMENT: {
        label: "FB Comment",
        short: "FB Comment",
        bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
        avatarBg: "bg-indigo-100 text-indigo-800",
        bubbleOutbound: "bg-[#1877F2] text-white",
        dot: "bg-[#1877F2]",
        Logo: FacebookCommentLogo,
    },
};

function getInitials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function ChannelAvatar({ name, channel, avatarUrl, size = "md" }) {
    const meta = CHANNEL_META[channel] || CHANNEL_META.MESSENGER;
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [avatarUrl]);

    const sizeClasses =
        size === "lg"
            ? { box: "w-10 h-10 text-xs", badge: "w-[18px] h-[18px] -bottom-0.5 -right-0.5" }
            : { box: "w-9 h-9 text-[11px]", badge: "w-4 h-4 -bottom-0.5 -right-0.5" };

    return (
        <div className="relative shrink-0">
            {avatarUrl && !imgError ? (
                <img
                    src={avatarUrl}
                    alt={name || "Customer"}
                    onError={() => setImgError(true)}
                    className={`${sizeClasses.box} rounded-full object-cover bg-slate-100 ring-1 ring-gray-200/80`}
                />
            ) : (
                <span
                    aria-hidden="true"
                    className={`${sizeClasses.box} rounded-full ${meta.avatarBg} font-bold flex items-center justify-center tracking-tight`}
                >
                    {getInitials(name)}
                </span>
            )}
            <span
                title={meta.label}
                className={`absolute ${sizeClasses.badge} rounded-full bg-white ring-2 ring-white flex items-center justify-center shadow-sm`}
            >
                <ChannelLogo channel={channel} className="w-full h-full" />
            </span>
        </div>
    );
}

export function ChannelBadge({ channel, compact = false }) {
    const meta = CHANNEL_META[channel] || CHANNEL_META.MESSENGER;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold shrink-0 ${meta.bg} ${
                compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs"
            }`}
        >
            <ChannelLogo channel={channel} className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            <span>{compact ? meta.short : meta.label}</span>
        </span>
    );
}

export function AdAttributionBadge({ adPlatform, adName, campaignName }) {
    if (!adPlatform || adPlatform === "ORGANIC") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200/80">
                Organic
            </span>
        );
    }

    const platformColors = {
        FACEBOOK: "bg-blue-50 text-blue-700 border-blue-200/80",
    };

    const platformLabel = "FB Boost";

    return (
        <span
            title={campaignName ? `Campaign: ${campaignName}` : adName || adPlatform}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border max-w-full truncate ${
                platformColors[adPlatform] || "bg-amber-50 text-amber-800 border-amber-200"
            }`}
        >
            <Megaphone className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
                {platformLabel}
                {adName ? `: ${adName.slice(0, 18)}` : ""}
            </span>
        </span>
    );
}

export const INBOX_NAV_TABS = [
    { href: "/admin/inbox", label: "Unified Inbox", icon: Inbox, exact: true },
    { href: "/admin/inbox/automations", label: "Comment-to-Inbox", icon: MessageSquareReply },
    { href: "/admin/inbox/analytics", label: "Ad ROI & Team Report", icon: BarChart3 },
    { href: "/admin/inbox/settings", label: "FB & WhatsApp API", icon: Settings },
];

export function InboxSubNav({ unreadTotal = 0 }) {
    const pathname = usePathname();

    return (
        <nav aria-label="Inbox sections" className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-4">
            {INBOX_NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium touch-manipulation transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            active
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{tab.label}</span>
                        {tab.exact && unreadTotal > 0 && (
                            <span
                                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                                    active ? "bg-white text-emerald-700" : "bg-rose-600 text-white"
                                }`}
                            >
                                {unreadTotal}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
