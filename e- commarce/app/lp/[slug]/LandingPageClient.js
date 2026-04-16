"use client";
import { useState, useEffect } from "react";

export default function LandingPageClient({ countdownEnd }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        const tick = () => {
            const distance = new Date(countdownEnd).getTime() - Date.now();
            if (distance <= 0) {
                setTimeLeft(null);
                return;
            }
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft({ d, h, m, s });
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [countdownEnd]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center justify-center gap-3 mb-6">
            {[
                { label: "দিন", value: timeLeft.d },
                { label: "ঘন্টা", value: timeLeft.h },
                { label: "মিনিট", value: timeLeft.m },
                { label: "সেকেন্ড", value: timeLeft.s },
            ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl w-16 h-16 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                        {String(value).padStart(2, "0")}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{label}</span>
                </div>
            ))}
        </div>
    );
}
