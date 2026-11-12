"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
                {/* Button */}
                <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="হোয়াটসঅ্যাপে চ্যাট করুন"
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe59] hover:scale-110 transition-transform transition-colors duration-200 active:scale-95 relative"
                >
                    <svg className="h-7 w-7 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                    </svg>
                    {/* Ping animation */}
                    <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-[#25D366] opacity-50" />
                </a>
            </div>

            {/* Messenger Option */}
            <div
                className={`flex items-center gap-2 transition-all duration-300 ease-out ${
                    isOpen
                        ? "translate-y-0 opacity-100 scale-100"
                        : "translate-y-4 opacity-0 scale-95 pointer-events-none"
                }`}
                style={{ transitionDelay: isOpen ? "0ms" : "0ms" }}
            >
                {/* Label */}
                <div className="bg-white rounded-full px-3 py-1.5 shadow-md border border-gray-100 flex flex-col items-end leading-tight">
                    <span className="text-xs font-bold text-gray-800">মেসেঞ্জার</span>
                    <span className="text-[10px] text-gray-500">ফেসবুকে ইনবক্স করুন</span>
                </div>
                {/* Button */}
                <a
                    href={messengerLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="মেসেঞ্জারে চ্যাট করুন"
                    className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg hover:scale-110 hover:brightness-110 transition-transform duration-200 active:scale-95 relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #0099FF 0%, #A033FF 50%, #FF5C87 100%)" }}
                >
                    {/* Messenger logo SVG */}
                    <svg className="h-7 w-7 fill-current" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.59 8 256.55 8zm149.24 185.13l-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.08-43.47a15 15 0 0 0-18 0l-78.37 59.44c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.06 43.46a15 15 0 0 0 18 0l78.37-59.44c10.48-7.93 24.17 4.6 17.13 15.68z"/>
                    </svg>
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
                {/* Chat bubble icon when closed */}
                {!isOpen && (
                    <>
                        {/* Chat icon */}
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
                    <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                    </svg>
                )}
                {/* Ping when closed */}
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
