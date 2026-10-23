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
        <div className="flex items-center gap-1.5 sm:gap-2">
            {[
                { label: "দিন", value: timeLeft.d },
                { label: "ঘণ্টা", value: timeLeft.h },
                { label: "মিনিট", value: timeLeft.m },
                { label: "সেকেন্ড", value: timeLeft.s },
            ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center">
                    <div className="bg-white border-2 border-amber-300 rounded-xl min-w-[34px] sm:min-w-[40px] h-9 sm:h-10 px-1.5 flex items-center justify-center text-sm sm:text-base font-black text-slate-900 shadow-sm">
                        {String(value).padStart(2, "0")}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-950 mt-0.5">{label}</span>
                </div>
            ))}
        </div>
    );
}
