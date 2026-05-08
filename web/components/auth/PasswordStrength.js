"use client";

import { useState, useEffect } from "react";
import { Check, X, Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export default function PasswordStrength({ password = "" }) {
    const [strength, setStrength] = useState(0);
    const [checks, setChecks] = useState({
        length: false,
        upper: false,
        number: false,
        special: false,
    });

    useEffect(() => {
        const newChecks = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9]/.test(password),
        };
        setChecks(newChecks);

        const metCount = Object.values(newChecks).filter(Boolean).length;
        setStrength(metCount);
    }, [password]);

    const getStrengthColor = () => {
        if (strength === 0) return "bg-neutral-800";
        if (strength === 1) return "bg-red-500/80";
        if (strength === 2) return "bg-orange-500/80";
        if (strength === 3) return "bg-blue-500/80";
        return "bg-green-500/80";
    };

    const getStrengthText = () => {
        if (password.length === 0) return "";
        if (strength <= 1) return "Unsafe";
        if (strength === 2) return "Moderate";
        if (strength === 3) return "Strong";
        return "Fortified";
    };

    const getIcon = () => {
        if (strength <= 2) return <ShieldAlert className="w-4 h-4 text-orange-500" />;
        if (strength === 3) return <Shield className="w-4 h-4 text-blue-500" />;
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
    };

    if (!password) return null;

    return (
        <div className="mt-4 space-y-4 p-5 rounded-2xl bg-white/5 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Security Level</span>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{getStrengthText()}</span>
            </div>

            {/* Strength Bar */}
            <div className="grid grid-cols-4 gap-2 h-1.5">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={`rounded-full transition-all duration-700 ${
                            strength >= step ? getStrengthColor() : "bg-neutral-800"
                        }`}
                    />
                ))}
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                <CheckItem label="8+ Characters" met={checks.length} />
                <CheckItem label="Uppercase" met={checks.upper} />
                <CheckItem label="Number (0-9)" met={checks.number} />
                <CheckItem label="Special (@#$)" met={checks.special} />
            </div>
        </div>
    );
}

function CheckItem({ label, met }) {
    return (
        <div className="flex items-center gap-2.5">
            <div className={`p-0.5 rounded-full transition-all duration-500 ${met ? "bg-green-500/10" : "bg-neutral-800"}`}>
                {met ? (
                    <Check className="w-2.5 h-2.5 text-green-500" />
                ) : (
                    <X className="w-2.5 h-2.5 text-neutral-600" />
                )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight transition-all duration-500 ${met ? "text-green-500/80" : "text-neutral-500"}`}>
                {label}
            </span>
        </div>
    );
}
