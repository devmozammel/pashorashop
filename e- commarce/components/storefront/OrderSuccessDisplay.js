"use client";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import ConfettiEffect from "./ConfettiEffect";

export default function OrderSuccessDisplay({ order }) {
    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-[60vh] flex items-center justify-center py-12 px-4 overflow-hidden">
            <ConfettiEffect />
            
            <motion.div 
                className="max-w-2xl w-full text-center z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Animated Checkmark */}
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                    className="flex justify-center mb-8"
                >
                    <div className="bg-green-100 p-6 rounded-full">
                        <CheckCircle className="w-20 h-20 text-green-600" />
                    </div>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">
                    Thank You!
                </motion.h1>
                
                <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
                    Your order <span className="font-bold text-black bg-yellow-100 px-2 rounded">#{order.orderNumber}</span> has been placed successfully and is being processed.
                </motion.p>

                {/* Glassmorphism Info Card */}
                <motion.div 
                    variants={itemVariants}
                    className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-2xl rounded-3xl p-8 mb-10 text-left relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-50" />
                    
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-green-600" />
                        Order Summary
                    </h3>
                    
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">Status</span>
                            <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                {order.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">Payment Method</span>
                            <span className="font-medium">{order.paymentMethod}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">Total Paid</span>
                            <span className="text-2xl font-black text-green-600 bg-green-50 px-4 py-1 rounded-xl">
                                {formatPrice(order.total)}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-12 py-7 text-lg font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all">
                            Continue Shopping
                        </Button>
                    </Link>
                    <Link href="/orders">
                        <Button variant="outline" size="lg" className="rounded-full px-12 py-7 text-lg font-semibold border-2 hover:bg-gray-50 flex items-center gap-2 group">
                            View Orders
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </motion.div>

                <motion.p variants={itemVariants} className="mt-8 text-gray-400 text-sm">
                    We will send a confirmation email shortly.
                </motion.p>
            </motion.div>
        </div>
    );
}
