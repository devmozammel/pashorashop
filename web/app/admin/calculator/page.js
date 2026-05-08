"use client";

import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Calculator, Save, History, DollarSign, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function PricingCalculatorPage() {
    const [history, setHistory] = useState([]);
    
    // Form State
    const [name, setName] = useState("");
    const [totalBuyingCost, setTotalBuyingCost] = useState("");
    const [quantity, setQuantity] = useState("");
    const [shippingCost, setShippingCost] = useState("0");
    const [packagingCost, setPackagingCost] = useState("0");
    const [adSpend, setAdSpend] = useState("0");
    const [otherCosts, setOtherCosts] = useState("0");
    const [targetMargin, setTargetMargin] = useState("20");

    // Results
    const [results, setResults] = useState({
        costPerItem: 0,
        suggestedPrice: 0,
        profitPerItem: 0,
        totalEstimatedProfit: 0
    });

    useEffect(() => {
        fetchHistory();
    }, []);



    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/admin/calculator");
            const data = await res.json();
            if (data.ok) {
                setHistory(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const calculatePricing = () => {
        const qty = Number(quantity) || 0;
        const buying = Number(totalBuyingCost) || 0;
        
        if (qty <= 0) {
            setResults({ costPerItem: 0, suggestedPrice: 0, profitPerItem: 0, totalEstimatedProfit: 0 });
            return;
        }

        const extraCosts = Number(shippingCost) + Number(packagingCost) + Number(adSpend) + Number(otherCosts);
        const totalInvestment = buying + extraCosts;
        
        const costPerPiece = totalInvestment / qty;
        
        const marginPct = Number(targetMargin) || 0;
        
        let suggested = costPerPiece;
        let markupAmount = 0;

        if (marginPct >= 100) {
            // If they enter 100% or more, they likely mean Markup instead of Margin
            markupAmount = costPerPiece * (marginPct / 100);
            suggested = costPerPiece + markupAmount;
        } else if (marginPct > 0) {
            // True Retail Margin Formula: Selling Price = Cost / (1 - Margin%)
            suggested = costPerPiece / (1 - (marginPct / 100));
            markupAmount = suggested - costPerPiece;
        }
        
        setResults({
            costPerItem: Math.round(costPerPiece),
            suggestedPrice: Math.round(suggested),
            profitPerItem: Math.round(markupAmount),
            totalEstimatedProfit: Math.round(markupAmount * qty)
        });
    };

    const handleSave = async () => {
        if (!name || !totalBuyingCost || !quantity) {
            return toast.error("Please fill Name, Total Buying Cost, and Quantity");
        }

        const payload = {
            name,
            totalBuyingCost: Number(totalBuyingCost),
            quantity: Number(quantity),
            shippingCost: Number(shippingCost),
            packagingCost: Number(packagingCost),
            adSpend: Number(adSpend),
            otherCosts: Number(otherCosts),
            targetMargin: Number(targetMargin),
            suggestedPrice: results.suggestedPrice,
            costPerItem: results.costPerItem
        };

        const t = toast.loading("Saving calculation...");
        try {
            const res = await fetch("/api/admin/calculator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.ok) {
                toast.success("Saved successfully", { id: t });
                setName("");
                fetchHistory();
            } else {
                toast.error(data.message, { id: t });
            }
        } catch (error) {
            toast.error("Failed to save", { id: t });
        }
    };

    return (
        <AdminShell title="Pricing Calculator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Calculator Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-2 mb-6">
                            <Calculator className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold">Input Costs</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Calculation Name / Product Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Winter Jacket Batch 1" className="w-full border rounded-lg px-4 py-2" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Buying Cost (BDT)</label>
                                    <input type="number" value={totalBuyingCost} onChange={e => setTotalBuyingCost(e.target.value)} className="w-full border rounded-lg px-4 py-2" placeholder="e.g., 50000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Quantity Bought</label>
                                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border rounded-lg px-4 py-2" placeholder="e.g., 100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Shipping / Delivery</label>
                                    <input type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Packaging Materials Cost</label>
                                    <input type="number" value={packagingCost} onChange={e => setPackagingCost(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Est. Marketing / Ad Spend</label>
                                    <input type="number" value={adSpend} onChange={e => setAdSpend(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Other Hidden Costs</label>
                                    <input type="number" value={otherCosts} onChange={e => setOtherCosts(e.target.value)} className="w-full border rounded-lg px-4 py-2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-blue-700 mb-1 mt-4">Target Profit Margin (%)</label>
                                <input type="number" value={targetMargin} onChange={e => setTargetMargin(e.target.value)} className="w-full border-2 border-blue-200 focus:border-blue-500 rounded-lg px-4 py-2 bg-blue-50" />
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <button onClick={calculatePricing} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800">
                                <Calculator className="w-4 h-4" /> Calculate Price
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Output Results & History */}
                <div className="space-y-6">
                    {/* Live Results Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 lg:p-6 rounded-xl shadow-lg text-white">
                        <h2 className="text-base lg:text-lg font-bold mb-5 flex items-center gap-2 opacity-90">
                            <TrendingUp className="w-5 h-5 shrink-0" /> <span className="truncate">Calculation Results</span>
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <p className="text-blue-100 text-xs lg:text-sm mb-1">Exact Cost Per Item</p>
                                <p className="text-2xl lg:text-3xl font-bold truncate">BDT {results.costPerItem}</p>
                            </div>
                            
                            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                                <p className="text-blue-100 text-xs lg:text-sm mb-1 font-medium">Suggested Selling Price</p>
                                <p className="text-3xl lg:text-4xl font-extrabold text-green-300 truncate">BDT {results.suggestedPrice}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-blue-100 text-[10px] lg:text-xs mb-1">Profit Per Item</p>
                                    <p className="text-lg lg:text-xl font-bold truncate">BDT {results.profitPerItem}</p>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-[10px] lg:text-xs mb-1">Total Est. Profit</p>
                                    <p className="text-lg lg:text-xl font-bold truncate">BDT {results.totalEstimatedProfit}</p>
                                </div>
                            </div>
                        </div>

                        {/* Save Button inside Results */}
                        <div className="mt-6 pt-5 border-t border-white/20 flex justify-end">
                            <button 
                                onClick={handleSave} 
                                disabled={results.suggestedPrice === 0} 
                                className="bg-white text-blue-700 px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <Save className="w-4 h-4" /> Save Profile
                            </button>
                        </div>
                    </div>

                    {/* Saved History */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-5 h-5 text-gray-500" />
                            <h2 className="text-lg font-bold">Saved Profiles</h2>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {history.map((item) => (
                                <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                                        <span>Cost: BDT {item.costPerItem}</span>
                                        <span className="font-bold text-green-600">Sell: BDT {item.suggestedPrice}</span>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">No saved calculations.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </AdminShell>
    );
}
