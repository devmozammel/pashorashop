"use client";

import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", size = "default", ...props }) {
    const variants = {
        primary: "bg-gray-900 text-white hover:bg-gray-800",
        secondary: "bg-white text-gray-900 border hover:bg-gray-50",
        danger: "bg-red-600 text-white hover:bg-red-700",
        ghost: "hover:bg-gray-100 text-gray-700"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        default: "px-4 py-2 text-sm",
        icon: "p-2"
    };

    return (
        <button
            className={cn("inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none", variants[variant], sizes[size], className)}
            {...props}
        />
    );
}

export function Input({ className, label, error, ...props }) {
    return (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <input
                className={cn("flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50", className, error && "border-red-500 focus:ring-red-500")}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export function Select({ className, label, options = [], ...props }) {
    return (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
            <select
                className={cn("flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50", className)}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

export function Badge({ children, variant = "default" }) {
    const variants = {
        default: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
        danger: "bg-red-100 text-red-800"
    };

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant])}>
            {children}
        </span>
    );
}
