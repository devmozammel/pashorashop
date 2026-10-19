"use client";

import { useState, useEffect } from "react";
import { Zap, Clock } from "lucide-react";
import Link from "next/link";

export default function FlashSaleTimer({ endsAt, title }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = new Date(endsAt).getTime() - now;

            if (distance <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
    }, [endsAt]);

    const toBnNum = (n) => {
        const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        return n.toString().padStart(2, "0").split("").map(d => bnDigits[d] || d).join("");
    };

    const TimeUnit = ({ value, labelBn }) => (
        <div className="flex flex-col items-center">
            <div className="bg-white text-gray-900 font-bold rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-xs">
                <span className="text-sm sm:text-base font-extrabold tabular-nums">
                    {toBnNum(value)}
                </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-rose-100 mt-1">
                {labelBn}
            </span>
        </div>
    );

    const Colon = () => (
        <div className="flex flex-col items-center select-none pt-2" aria-hidden="true">
            <span className="text-base sm:text-lg font-bold text-rose-200">:</span>
        </div>
    );

    return (
        <div className="rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 p-4 sm:p-5 text-white shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left: Title & Subtitle */}
                <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                {title || "ফ্ল্যাশ সেল (Flash Sale)"}
                            </h2>
                        </div>
                        <p className="text-xs text-rose-100 mt-0.5">
                            সীমিত সময়ের অফার — স্টক শেষ হওয়ার আগেই অর্ডার করুন
                        </p>
                    </div>
                </div>

                {/* Right: Countdown Timer & CTA */}
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <TimeUnit value={timeLeft.days} labelBn="দিন" />
                        <Colon />
                        <TimeUnit value={timeLeft.hours} labelBn="ঘণ্টা" />
                        <Colon />
                        <TimeUnit value={timeLeft.minutes} labelBn="মিনিট" />
                        <Colon />
                        <TimeUnit value={timeLeft.seconds} labelBn="সেকেন্ড" />
                    </div>

                    <Link
                        href="/flash-sale"
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors shadow-xs shrink-0"
                    >
                        সব দেখুন →
                    </Link>
                </div>
            </div>
        </div>
    );
}


