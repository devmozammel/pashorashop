"use client";

import { useState, useEffect } from "react";
import { Timer, Zap } from "lucide-react";

export default function FlashSaleTimer({ endsAt }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = new Date(endsAt).getTime() - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [endsAt]);

    const TimeUnit = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-14 h-14 md:w-16 md:h-16 flex items-center justify-center mb-1 shadow-lg">
                <span className="text-xl md:text-2xl font-black text-white">{value.toString().padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-white/60 tracking-widest">{label}</span>
        </div>
    );

    return (
        <div className="flex items-center gap-6 bg-gradient-to-r from-red-600 to-orange-500 p-6 md:p-8 rounded-[2rem] shadow-2xl overflow-hidden relative group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

            {/* Content */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-inner animate-pulse">
                        <Zap className="w-8 h-8 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic underline decoration-white/30 underline-offset-8">
                            Flash Sale
                        </h2>
                        <p className="text-white/80 text-sm font-medium mt-1">Hurry up! Offers end in:</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <span className="text-2xl font-bold text-white/50 mb-6">:</span>
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <span className="text-2xl font-bold text-white/50 mb-6">:</span>
                    <TimeUnit value={timeLeft.minutes} label="Mins" />
                    <span className="text-2xl font-bold text-white/50 mb-6">:</span>
                    <TimeUnit value={timeLeft.seconds} label="Secs" />
                </div>
            </div>
        </div>
    );
}
