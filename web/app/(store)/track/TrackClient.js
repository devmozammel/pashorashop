"use client";

import { useState } from "react";
import { Search, Package, Truck, CheckCircle2, AlertCircle, Clock, MapPin, Calendar, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const ORDER_STATUS_STEPS = [
    { status: "PENDING", label: "Confirmed", icon: Clock, desc: "Order received and pending verification" },
    { status: "PACKED", label: "Packed", icon: Package, desc: "Order is being packed and prepared" },
    { status: "SHIPPED", label: "Shipped", icon: Truck, desc: "Parcel has been handed to courier" },
    { status: "DELIVERED", label: "Delivered", icon: CheckCircle2, desc: "Order has been safely delivered" },
];

export default function TrackClient() {
    const [orderId, setOrderId] = useState("");
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");

    const handleTrack = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setOrder(null);

        try {
            const res = await fetch("/api/track", {
                method: "POST",
                body: JSON.stringify({ orderId, emailOrPhone }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setOrder(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const currentStatusIndex = ORDER_STATUS_STEPS.findIndex(s => s.status === order?.status);

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-black text-white mb-4 shadow-xl shadow-black/10"
                    >
                        <Search className="w-8 h-8" />
                    </motion.div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Track Your Parcel</h1>
					<p className="text-gray-500 mt-2">Enter your details to see real-time order status</p>
                </div>

                {/* Track Form */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 mb-8"
                >
                    <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Order Number / ID</label>
                            <div className="relative">
                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ORD-123456"
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-black transition-all font-medium text-gray-900"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Phone or Email</label>
                            <div className="relative">
                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="01712xxxxxx"
                                    required
                                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-black transition-all font-medium text-gray-900"
                                    value={emailOrPhone}
                                    onChange={(e) => setEmailOrPhone(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 mt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-lg shadow-black/10"
                            >
                                {loading ? "Searching..." : "Track Now"}
                            </Button>
                        </div>
                    </form>
                </motion.div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 mb-8"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-semibold text-sm">{error}</p>
                    </motion.div>
                )}

                {/* Result Section */}
                <AnimatePresence>
                    {order && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="space-y-6"
                        >
                            {/* Order Info Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                                    <div>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Status</span>
                                        <div className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest inline-flex">
                                            {order.status}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Order #</span>
                                        <p className="font-black text-lg text-gray-900">{order.orderNumber}</p>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="relative space-y-8 mb-8">
                                    <div className="absolute left-[27px] top-6 bottom-6 w-1 bg-gray-100 rounded-full" />
                                    {ORDER_STATUS_STEPS.map((step, idx) => {
                                        const isCompleted = idx <= currentStatusIndex;
                                        const StepIcon = step.icon;
                                        
                                        return (
                                            <div key={step.status} className="relative flex items-start gap-5">
                                                <div className={cn(
                                                    "relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500",
                                                    isCompleted ? "bg-black text-white shadow-lg" : "bg-gray-100 text-gray-400"
                                                )}>
                                                    <StepIcon className="w-6 h-6" />
                                                    {isCompleted && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute -right-1 -bottom-1 bg-green-500 text-white rounded-full p-1"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <div className="flex-1 pt-2">
                                                    <h3 className={cn(
                                                        "font-black text-lg",
                                                        isCompleted ? "text-gray-900" : "text-gray-400"
                                                    )}>{step.label}</h3>
                                                    <p className="text-gray-500 text-sm">{step.desc}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Placed On</span>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Delivery to</span>
                                            <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{order.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">Need help? <a href="https://wa.me/yournumber" className="text-black font-bold hover:underline">Chat with Support</a></p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
