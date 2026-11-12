"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

function ChatTab({ href, logoSrc, logoAlt, label, sublabel, pingColor, delay }) {
    const [hovered, setHovered] = useState(false);

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={() => setHovered(true)}
            onTouchEnd={() => setTimeout(() => setHovered(false), 1200)}
            style={{ transitionDelay: hovered ? "0ms" : delay }}
            className="flex items-center group select-none"
        >
            {/* Slide-out label — appears on hover, slides from right edge */}
            <div
                className={`flex flex-col items-end justify-center pr-2 pl-3 py-1.5 rounded-l-xl
                    bg-white border border-r-0 border-gray-200
                    shadow-[−2px_2px_12px_rgba(0,0,0,0.10)]
                    overflow-hidden whitespace-nowrap
                    transition-all duration-300 ease-out
                    ${hovered ? "max-w-[130px] opacity-100" : "max-w-0 opacity-0 px-0"}`}
            >
                <span className="text-[11px] font-bold text-gray-800 leading-tight">{label}</span>
                <span className="text-[9px] text-gray-500 leading-tight">{sublabel}</span>
            </div>

            {/* Logo card — always visible, sticks to right edge */}
            <div
                className={`relative flex items-center justify-center
                    w-11 h-11 rounded-l-xl bg-white overflow-hidden
                    border border-r-0 border-gray-200
                    shadow-[-3px_2px_14px_rgba(0,0,0,0.13)]
                    transition-transform duration-300 ease-out
                    ${hovered ? "-translate-x-0.5 scale-105" : "translate-x-0"}`}
            >
                <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                />
                {/* Subtle ping dot in top-left corner */}
                <span
                    className="absolute top-1 left-1 flex h-2 w-2"
                    style={{ opacity: hovered ? 0 : 1, transition: "opacity 200ms" }}
                >
                    <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                        style={{ backgroundColor: pingColor }}
                    />
                    <span
                        className="relative inline-flex rounded-full h-2 w-2"
                        style={{ backgroundColor: pingColor }}
                    />
                </span>
            </div>
        </a>
    );
}

export default function ChatButtons({ waNumber: propWaNumber }) {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    // Resolve WhatsApp number
    let rawNumber = propWaNumber || "8801620778044";
    let waNumber = String(rawNumber).replace(/\D/g, "");
    if (!waNumber || waNumber.includes("01337744458") || waNumber.includes("01613134043")) {
        waNumber = "8801620778044";
    }
    if (waNumber.startsWith("0")) waNumber = "88" + waNumber;
    if (!waNumber.startsWith("88")) waNumber = "88" + waNumber;

    const waMessage = "আসসালামু আলাইকুম! Pashora Shop থেকে একটু সাহায্য দরকার।";
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
    const messengerLink = `https://m.me/pashorashop`;

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (pathname?.startsWith("/admin")) return null;

    return (
        <div
            className={`fixed right-0 z-50 flex flex-col gap-2 items-end
                transition-all duration-700 ease-out
                ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
            style={{ bottom: "160px" }}
        >
            <ChatTab
                href={waLink}
                logoSrc="/whatsapp-logo.png"
                logoAlt="WhatsApp"
                label="হোয়াটসঅ্যাপ"
                sublabel="সরাসরি চ্যাট করুন"
                pingColor="#22c55e"
                delay="60ms"
            />
            <ChatTab
                href={messengerLink}
                logoSrc="/messenger-logo.png"
                logoAlt="Messenger"
                label="মেসেঞ্জার"
                sublabel="ইনবক্স করুন"
                pingColor="#a855f7"
                delay="0ms"
            />
        </div>
    );
}
