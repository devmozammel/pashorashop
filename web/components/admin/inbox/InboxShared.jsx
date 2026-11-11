"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MessageCircle,
    MessageSquareReply,
    Facebook,
    PhoneCall,
    BarChart3,
    Settings,
    Inbox,
    Megaphone,
} from "lucide-react";

export const CHANNEL_META = {
    WHATSAPP: {
        label: "WhatsApp",
        short: "WA",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
        icon: PhoneCall,
    },
    MESSENGER: {
        label: "Messenger",
        short: "FB",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-600",
        icon: MessageCircle,
    },
    FB_COMMENT: {
        label: "FB Comment",
        short: "FBC",
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-600",
        icon: Facebook,
    },
};

export function ChannelBadge({ channel, compact = false }) {
    const meta = CHANNEL_META[channel] || CHANNEL_META.MESSENGER;
    const Icon = meta.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border font-semibold shrink-0 ${meta.bg} ${
                compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
            }`}
        >
            <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} aria-hidden="true" />
            <span>{compact ? meta.short : meta.label}</span>
        </span>
    );
}

export function AdAttributionBadge({ adPlatform, adName, campaignName }) {
    if (!adPlatform || adPlatform === "ORGANIC") {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                Organic
            </span>
        );
    }

    const platformColors = {
        FACEBOOK: "bg-blue-50 text-blue-700 border-blue-200",
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

export function InboxSubNav({ unreadTotal = 0 }) {
    const pathname = usePathname();
    const tabs = [
        { href: "/admin/inbox", label: "Unified Inbox", icon: Inbox, exact: true },
        { href: "/admin/inbox/automations", label: "Comment-to-Inbox", icon: MessageSquareReply },
        { href: "/admin/inbox/analytics", label: "Ad ROI & Team Report", icon: BarChart3 },
        { href: "/admin/inbox/settings", label: "FB & WhatsApp API", icon: Settings },
    ];

    return (
        <nav aria-label="Inbox sections" className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 mb-4">
            {tabs.map((tab) => {
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
