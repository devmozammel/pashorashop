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

    // Close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    if (pathname?.startsWith("/admin")) return null;

    return (
        <div
            className={`fixed bottom-[170px] right-4 md:bottom-20 md:right-6 z-50 flex flex-col items-end gap-3 transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        >
            {/* WhatsApp Option */}
            <div
                className={`flex items-center gap-2 transition-all duration-300 ease-out ${
                    isOpen
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-4 opacity-0 scale-95 pointer-events-none"
                }`}
                style={{ transitionDelay: isOpen ? "60ms" : "0ms" }}
            >
                {/* Label */}
                <div className="bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100 flex flex-col items-end leading-tight">
                    <span className="text-xs font-bold text-gray-800">হোয়াটসঅ্যাপ</span>
                    <span className="text-[10px] text-gray-500">সরাসরি চ্যাট করুন</span>
                </div>
                {/* WhatsApp official logo button */}
                <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 overflow-hidden relative bg-white"
                >
                    <Image
                        src="/whatsapp-logo.png"
                        alt="WhatsApp"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                    />
                    {/* Ping animation */}
                    <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-[#25D366] opacity-40" />
                </a>
            </div>

            {/* Messenger Option */}
            <div
                className={`flex items-center gap-2 transition-all duration-300 ease-out ${
                    isOpen
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-4 opacity-0 scale-95 pointer-events-none"
                }`}
                style={{ transitionDelay: "0ms" }}
            >
                {/* Label */}
                <div className="bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100 flex flex-col items-end leading-tight">
                    <span className="text-xs font-bold text-gray-800">মেসেঞ্জার</span>
                    <span className="text-[10px] text-gray-500">ফেসবুকে ইনবক্স করুন</span>
                </div>
                {/* Messenger official logo button */}
                <a
                    href={messengerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="মেসেঞ্জারে চ্যাট করুন"
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 overflow-hidden relative bg-white"
                >
                    <Image
                        src="/messenger-logo.png"
                        alt="Messenger"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                    />
                </a>
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={isOpen ? "বন্ধ করুন" : "আমাদের সাথে যোগাযোগ করুন"}
                className={`flex flex-col items-center justify-center h-16 w-16 rounded-full shadow-xl transition-transform transition-colors duration-300 relative ${
                    isOpen
                        ? "bg-gray-700 rotate-45 scale-95"
                        : "bg-gray-900 hover:scale-110"
                }`}
            >
                {/* Chat icon when closed */}
                {!isOpen && (
                    <>
                        <svg
                            className="h-6 w-6 fill-white mb-0.5"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.826 1.3 5.356 3.357 7.11l-.888 3.267a.5.5 0 0 0 .718.556L8.937 20.4A10.42 10.42 0 0 0 12 20.486c5.523 0 10-4.144 10-9.243C22 6.145 17.523 2 12 2z"/>
                        </svg>
                        <span className="text-[9px] font-bold text-white leading-tight text-center px-1">
                            কথা বলুন
                        </span>
                    </>
                )}
                {/* X icon when open */}
                {isOpen && (
                    <svg className="h-7 w-7" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    </svg>
                )}
                {/* Red notification dot when closed */}
                {!isOpen && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                )}
            </button>
        </div>
    );
}
