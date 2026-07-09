"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

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
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-13 h-13 sm:w-15 sm:h-15 md:w-18 md:h-18 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/15">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-white tabular-nums">
                    {value.toString().padStart(2, '0')}
                </span>
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-xs uppercase font-bold text-white/90 tracking-widest mt-1.5">
                {label}
            </span>
        </div>
    );

    const Colon = () => (
        <div className="flex flex-col items-center select-none" aria-hidden="true">
            <div className="w-2 h-13 sm:h-15 md:h-18 flex items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-white/40 animate-pulse">:</span>
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-xs mt-1.5 opacity-0">Spacer</span>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gradient-to-r from-[#ff3c2b] via-[#ff6519] to-[#ff8f00] p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,101,25,0.25)] overflow-hidden relative group">
            {/* Background Decorative Blur Rings */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

            {/* Content */}
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 w-full justify-between">
                {/* Left side: Icon + Title */}
                <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-[#e13b30] text-white rounded-full flex items-center justify-center border-2 border-white/20 shadow-inner shrink-0 transition-transform duration-300 group-hover:scale-110">
                        <Zap className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-3.5xl font-black text-white tracking-tight uppercase italic leading-none select-none">
                            Flash Sale
                        </h2>
                        <p className="text-white/80 text-xs md:text-sm font-medium mt-1">Hurry up! Offers end in:</p>
                    </div>
                </div>

                {/* Right side: Countdown Timer */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <Colon />
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <Colon />
                    <TimeUnit value={timeLeft.minutes} label="Mins" />
                    <Colon />
                    <TimeUnit value={timeLeft.seconds} label="Secs" />
                </div>
            </div>
        </div>
    );
}
