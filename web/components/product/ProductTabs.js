"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Ruler, Truck, RotateCcw, ShieldCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductTabs({ product }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [tabDescription, setTabDescription] = useState(product.description || "");
    const [tabSizeChart, setTabSizeChart] = useState(product.sizeChart || "");
    const [hasSizeChart, setHasSizeChart] = useState(false);

    useEffect(() => {
        let desc = product.description || "";
        let chart = product.sizeChart || "";

        if (chart && chart.trim().length > 0) {
            setTabSizeChart(chart);
            setTabDescription(desc);
            setHasSizeChart(true);
        } else if (desc.includes("<table")) {
            // Legacy size chart parsing
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(desc, "text/html");
                const table = doc.querySelector("table");
                if (table) {
                    setTabSizeChart(table.outerHTML);
                    table.remove();

                    // Clean up "size chart" text headers
                    const elements = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6, p, div"));
                    elements.forEach(el => {
                        const txt = el.textContent.toLowerCase();
                        if (txt.includes("size chart") || txt.includes("sizechart")) {
                            el.remove();
                        }
                    });

                    setTabDescription(doc.body.innerHTML);
                    setHasSizeChart(true);
                } else {
                    setTabDescription(desc);
                    setHasSizeChart(false);
                }
            } catch (e) {
                console.error("Error parsing legacy size chart:", e);
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
        { id: "overview", label: "Description", icon: FileText },
        ...(hasSizeChart ? [{ id: "size-guide", label: "Size Guide", icon: Ruler }] : []),
        { id: "shipping", label: "Shipping & Returns", icon: Truck }
    ];

    return (
        <div className="w-full mt-12 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-slide-up">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all whitespace-nowrap outline-none",
                                isActive ? "text-black" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="p-6 md:p-8 min-h-[250px]"
                    >
                        {activeTab === "overview" && (
                            <div className="w-full overflow-hidden break-words">
                                {tabDescription ? (
                                    <div
                                        className="product-rich-description prose prose-sm md:prose-base max-w-none text-gray-600 leading-relaxed break-words"
                                        dangerouslySetInnerHTML={{ __html: tabDescription }}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No description available for this product.</p>
                                )}
                            </div>
                        )}

                        {activeTab === "size-guide" && (
                            <div className="w-full">
                                <div className="max-w-2xl">
                                    <h4 className="text-base font-bold text-gray-900 mb-2">Size Chart & Measurements</h4>
                                    <p className="text-xs text-gray-500 mb-6">
                                        Please check the measurements carefully before selecting your size. Expected deviation is less than 3%.
                                    </p>
                                </div>
                                <div className="w-full overflow-x-auto rounded-xl border border-gray-100 size-chart-table-container">
                                    <div
                                        className="product-rich-description break-words"
                                        dangerouslySetInnerHTML={{ __html: tabSizeChart }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === "shipping" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                {/* Delivery Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900">Delivery Information</h4>
                                    </div>
                                    
                                    <div className="space-y-4 text-sm text-gray-600">
                                        <div className="flex items-start gap-3">
                                            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold text-gray-900 block">Delivery Time</span>
                                                <span>Inside Dhaka: 2-3 Days<br />Outside Dhaka: 3-5 Days</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold text-gray-900 block">Cash On Delivery</span>
                                                <span>We support Cash on Delivery all across Bangladesh. Verify your product at your doorstep.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-4 h-4 text-gray-400 mt-0.5 shrink-0 font-bold text-xs">৳</div>
                                            <div>
                                                <span className="font-bold text-gray-900 block">Shipping Charges</span>
                                                <span>Inside Dhaka: ৳70<br />Outside Dhaka: ৳130</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Exchange & Return Policy */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 border-b pb-3">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <RotateCcw className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-base font-bold text-gray-900">Easy Returns & Exchanges</h4>
                                    </div>

                                    <div className="space-y-4 text-sm text-gray-600">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold text-gray-900 block">7 Days Exchange Policy</span>
                                                <span>If you face any size or fit issues, you can easily exchange the product within 7 days.</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold text-gray-900 block">Authenticity Guaranteed</span>
                                                <span>All products are 100% authentic and pass rigorous quality checks before shipment.</span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-400 italic pt-2 leading-relaxed">
                                            * Product packaging and labels must be intact for successful returns. Shipping charges are non-refundable in case of returns.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
