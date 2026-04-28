"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function WhatsAppButton() {
    const [isVisible, setIsVisible] = useState(false);

    // Default WhatsApp number (will be used if env is not set)
    // Needs to include country code without '+'
    const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801700000000";
    const message = "Hello Authentic Bazar! I need some help.";

    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    useEffect(() => {
        // slight delay to animate in after initial load
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-[170px] right-4 md:bottom-20 md:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-500 hover:scale-110 hover:bg-green-600 hover:shadow-xl ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="h-7 w-7" />

            {/* Ping animation behind the button */}
            <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
        </a>
    );
}
