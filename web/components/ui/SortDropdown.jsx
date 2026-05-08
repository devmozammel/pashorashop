"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ArrowUpDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SortDropdown({ options, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeOption = options.find(o => o.value === value) || options[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-300",
                    "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md",
                    isOpen ? "ring-2 ring-gray-900 border-gray-900" : ""
                )}
            >
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
                    {activeOption.label}
                </span>
                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-300",
                    isOpen ? "rotate-180" : ""
                )} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "absolute right-0 mt-2 w-56 rounded-2xl p-1.5 z-50",
                            "bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                        )}
                    >
                        <div className="space-y-1">
                            {options.map((option) => {
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200",
                                            isSelected 
                                                ? "bg-gray-900 text-white font-bold" 
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        )}
                                    >
                                        {option.label}
                                        {isSelected && <Check className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
