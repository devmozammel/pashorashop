"use client";

import { useState } from "react";
import NextImage from "next/image";

/**
 * SafeImage — Next.js Image with automatic fallback on error.
 * If the src fails to load, shows a clean gray box (no broken icon).
 * Accepts all standard Next.js Image props.
 */
export default function SafeImage({ src, alt = "", fallback = null, className = "", ...props }) {
    const [errored, setErrored] = useState(false);

    // If errored or no src, show fallback
    if (errored || !src) {
        return fallback ?? (
            <div
                className={`bg-gray-100 flex items-center justify-center ${className}`}
                style={props.style}
                aria-label={alt}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M21 3.75H3A.75.75 0 002.25 4.5v15A.75.75 0 003 20.25h18a.75.75 0 00.75-.75v-15A.75.75 0 0021 3.75z" />
                </svg>
            </div>
        );
    }

    return (
        <NextImage
            src={src}
            alt={alt}
            className={className}
            onError={() => setErrored(true)}
            {...props}
        />
    );
}
