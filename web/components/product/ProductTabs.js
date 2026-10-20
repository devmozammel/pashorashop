"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Ruler, Truck, RotateCcw, ShieldCheck, Clock, HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductTabs({ product }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [tabDescription, setTabDescription] = useState(product.description || "");
    const [tabSizeChart, setTabSizeChart] = useState(product.sizeChart || "");
    const [hasSizeChart, setHasSizeChart] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState(0);

    // Parse FAQs
    let faqsList = [];
    if (product.faqs) {
        if (Array.isArray(product.faqs)) {
            faqsList = product.faqs;
        } else if (typeof product.faqs === "string") {
            try {
                faqsList = JSON.parse(product.faqs);
            } catch (_) {}
        }
    }

    useEffect(() => {
        let desc = product.description || "";
        let chart = product.sizeChart || "";

        if (chart && chart.trim().length > 0) {
            setTabSizeChart(chart);
            setTabDescription(desc);
            setHasSizeChart(true);
        } else if (desc.includes("<table")) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(desc, "text/html");
                const table = doc.querySelector("table");
                if (table) {
                    setTabSizeChart(table.outerHTML);
                    table.remove();
                    setTabDescription(doc.body.innerHTML);
                    setHasSizeChart(true);
                } else {
                    setTabDescription(desc);
                    setHasSizeChart(false);
                }
            } catch (e) {
                setTabDescription(desc);
                setHasSizeChart(false);
            }
        } else {
            setTabDescription(desc);
            setTabSizeChart("");
            setHasSizeChart(false);
        }
    }, [product.description, product.sizeChart]);

    const tabs = [
        { id: "overview", label: "বিস্তারিত বিবরণ", icon: FileText },
        ...(faqsList.length > 0 ? [{ id: "faq", label: `প্রশ্নোত্তর (${faqsList.length})`, icon: HelpCircle }] : []),
        ...(hasSizeChart ? [{ id: "size-guide", label: "সাইজ গাইড", icon: Ruler }] : []),
        { id: "shipping", label: "ডেলিভারি ও রিটার্ন পলিসি", icon: Truck }
    ];

    return (
        <div className="w-full mt-10 space-y-8">
            {/* ── WHY BUY FROM US HIGHLIGHTS (Shobkichu Style) ── */}
            <div className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <span className="w-1.5 h-5 bg-emerald-600 rounded-full" />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        কেন আমাদের থেকে পণ্য কিনবেন?
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 mt-0.5">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">১০০% অরিজিনাল পণ্য</h4>
                            <p className="text-[11px] text-gray-600 mt-0.5">সরাসরি বিশ্বস্ত ও অথেন্টিক সোর্স থেকে সংগৃহীত।</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                            <Truck className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">সুপারফাস্ট ডেলিভারি</h4>
                            <p className="text-[11px] text-gray-600 mt-0.5">ঢাকায় ২৪ ঘণ্টা ও সারাদেশে দ্রুততম হোম ডেলিভারি।</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/50 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">ক্যাশ অন ডেলিভারি</h4>
                            <p className="text-[11px] text-gray-600 mt-0.5">পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধের সুবিধা।</p>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-purple-100 bg-purple-50/50 flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
                            <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm">সহজ রিটার্ন পলিসি</h4>
                            <p className="text-[11px] text-gray-600 mt-0.5">পণ্যে কোনো সমস্যা হলে দ্রুত রিপ্লেসমেন্ট গ্যারান্টি।</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABS CONTAINER ── */}
            <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200/90 overflow-x-auto bg-gray-50/60 no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative flex items-center gap-2 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap outline-none",
                                    isActive ? "text-emerald-700 bg-white shadow-xs" : "text-gray-500 hover:text-gray-800"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Contents */}
                <div className="p-5 sm:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="min-h-[220px]"
                        >
                            {/* OVERVIEW / DESCRIPTION */}
                            {activeTab === "overview" && (
                                <div className="w-full space-y-4">
                                    <h4 className="text-base sm:text-lg font-bold text-gray-900">পণ্যের বিস্তারিত বিবরণ</h4>
                                    {tabDescription ? (
                                        <div
                                            className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-3 whitespace-pre-line"
                                            dangerouslySetInnerHTML={{ __html: tabDescription }}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">এই পণ্যের কোনো অতিরিক্ত বিবরণ দেওয়া হয়নি।</p>
                                    )}
                                </div>
                            )}

                            {/* FAQ ACCORDION */}
                            {activeTab === "faq" && (
                                <div className="w-full space-y-4">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <h4 className="text-base sm:text-lg font-bold text-gray-900">সাধারণ প্রশ্নোত্তর (FAQ)</h4>
                                        <span className="text-xs text-gray-500">মোট {faqsList.length}টি প্রশ্ন</span>
                                    </div>
                                    <div className="space-y-3">
                                        {faqsList.map((faq, idx) => {
                                            const isOpen = openFaqIndex === idx;
                                            return (
                                                <div key={idx} className="border border-gray-200/90 rounded-xl overflow-hidden bg-white">
                                                    <button
                                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                                        className="w-full text-left px-4 sm:px-5 py-3.5 flex justify-between items-center text-xs sm:text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <span>{faq.question}</span>
                                                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform shrink-0 ml-2", isOpen && "rotate-180")} />
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/40">
                                                            {faq.answer}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* SIZE GUIDE */}
                            {activeTab === "size-guide" && (
                                <div className="w-full space-y-4">
                                    <h4 className="text-base sm:text-lg font-bold text-gray-900">সাইজ গাইড ও মাপ</h4>
                                    <div
                                        className="text-xs sm:text-sm text-gray-700 leading-relaxed overflow-x-auto"
                                        dangerouslySetInnerHTML={{ __html: tabSizeChart }}
                                    />
                                </div>
                            )}

                            {/* SHIPPING & RETURNS */}
                            {activeTab === "shipping" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-4 rounded-xl border border-gray-200/90 p-4 sm:p-5 bg-gray-50/40">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm sm:text-base font-bold text-gray-900">ডেলিভারি তথ্য</h4>
                                        </div>
                                        <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                                            <li className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                <span><strong>ডেলিভারি সময়:</strong> ঢাকা শহরের ভেতরে ২৪ ঘণ্টা, ঢাকার বাইরে ২-৩ দিন।</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                <span><strong>ডেলিভারি চার্জ:</strong> ঢাকার ভিতরে মাত্র ৳৭০, ঢাকার বাইরে ৳১৩০।</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                                <span><strong>ক্যাশ অন ডেলিভারি:</strong> পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ মূল্য পরিশোধ করুন।</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="space-y-4 rounded-xl border border-gray-200/90 p-4 sm:p-5 bg-gray-50/40">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                                            <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                                                <RotateCcw className="w-4 h-4" />
                                            </div>
                                            <h4 className="text-sm sm:text-base font-bold text-gray-900">সহজ রিটার্ন ও এক্সচেঞ্জ</h4>
                                        </div>
                                        <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                                            <li>• ডেলিভারিম্যানের সামনে পণ্য চেক করার সুযোগ রয়েছে।</li>
                                            <li>• পণ্যে কোনো ত্রুটি বা সমস্যা থাকলে ১ দিনের মধ্যে সরাসরি রিপ্লেসমেন্ট সুবিধা।</li>
                                            <li>• যেকোনো প্রয়োজনে আমাদের কাস্টমার কেয়ারে কল বা WhatsApp-এ যোগাযোগ করতে পারেন।</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
