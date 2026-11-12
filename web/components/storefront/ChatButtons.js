"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function ChatButtons({ waNumber: propWaNumber }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
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
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    if (pathname?.startsWith("/admin")) return null;

    return (
        <div
            className={`fixed bottom-[160px] right-4 md:bottom-20 md:right-5 z-50 flex flex-col items-end gap-2.5
                transition-all duration-500 ease-out
                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
            {/* WhatsApp — logo only, no label */}
            <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
                className={`flex items-center justify-center w-11 h-11 rounded-full
                    shadow-lg bg-white overflow-hidden
                    transition-all duration-300 ease-out
                    hover:scale-110 active:scale-95
                    ${isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-4 scale-75 pointer-events-none"}`}
                style={{ transitionDelay: isOpen ? "60ms" : "0ms" }}
            >
                <Image src="/whatsapp-logo.png" alt="WhatsApp" width={44} height={44} className="w-full h-full object-cover" />
            </a>

            {/* Messenger — logo only, no label */}
            <a
                href={messengerLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="মেসেঞ্জারে ইনবক্স করুন"
                className={`flex items-center justify-center w-11 h-11 rounded-full
                    shadow-lg bg-white overflow-hidden
                    transition-all duration-300 ease-out
                    hover:scale-110 active:scale-95
                    ${isOpen
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-4 scale-75 pointer-events-none"}`}
                style={{ transitionDelay: isOpen ? "0ms" : "0ms" }}
            >
                <Image src="/messenger-logo.png" alt="Messenger" width={44} height={44} className="w-full h-full object-cover" />
            </a>

            {/* ── Toggle Button (Unique: both logos overlapping inside) ── */}
            <button
                onClick={() => setIsOpen((p) => !p)}
                aria-label={isOpen ? "বন্ধ করুন" : "যোগাযোগ করুন"}
                className={`relative flex items-center justify-center w-12 h-12 rounded-2xl
                    shadow-xl transition-all duration-300 ease-out
                    hover:scale-105 active:scale-95
                    ${isOpen ? "bg-gray-800 rotate-[360deg]" : "bg-gray-900"}`}
                style={{ transition: "background-color 300ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1)" }}
            >
                {/* Closed state: two logos overlapping (the unique design) */}
                <div
                    className={`absolute inset-0 flex items-center justify-center
                        transition-all duration-250
                        ${isOpen ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}
                >
                    {/* WA logo — top-left, slightly bigger */}
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full overflow-hidden ring-[1.5px] ring-gray-900 shadow">
                        <Image src="/whatsapp-logo.png" alt="" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                    {/* Messenger logo — bottom-right, slightly smaller */}
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full overflow-hidden ring-[1.5px] ring-gray-900 shadow">
                        <Image src="/messenger-logo.png" alt="" width={20} height={20} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Open state: X icon */}
                <div
                    className={`absolute inset-0 flex items-center justify-center
                        transition-all duration-250
                        ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                </div>

                {/* Red notification dot (only when closed) */}
                {!isOpen && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                )}
            </button>
        </div>
    );
}
