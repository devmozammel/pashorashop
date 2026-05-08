"use client";

import { Check, Circle } from "lucide-react";

export default function PasswordCriteria({ password }) {
    const criteria = [
        {
            label: "অন্তত ৮টি অক্ষর",
            met: password.length >= 8
        },
        {
            label: "কমপক্ষে একটি বড় হাতের অক্ষর (A-Z)",
            met: /[A-Z]/.test(password)
        },
        {
            label: "কমপক্ষে একটি সংখ্যা (0-9)",
            met: /[0-9]/.test(password)
        },
        {
            label: "একটি বিশেষ চিহ্ন (যেমন: @, #, $, %)",
            met: /[^a-zA-Z0-9]/.test(password)
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
            {criteria.map((item, index) => (
                <div key={index} className="flex items-center gap-2 transition-all duration-300">
                    {item.met ? (
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                        </div>
                    ) : (
                        <Circle className="w-4 h-4 text-neutral-300 stroke-[1.5px]" />
                    )}
                    <span className={`text-[11px] leading-tight font-medium ${item.met ? 'text-green-600' : 'text-neutral-500'}`}>
                        {item.label}
                    </span>
                </div>
            ))}
        </div>
    );
}
