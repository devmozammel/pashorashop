"use client";

import { motion } from "framer-motion";
import { Hammer, Timer, ArrowRight, Instagram, Facebook } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl w-full text-center z-10"
            >
                {/* Logo Branding */}
                <div className="mb-12">
                    <h1 className="text-3xl font-black tracking-tighter mb-2 italic">
                        AUTHENTIC BAZAR
                    </h1>
                    <div className="h-1 w-12 bg-white mx-auto rounded-full" />
                </div>

                {/* Animated Icon */}
                <div className="relative inline-block mb-10">
                    <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full" />
                    <motion.div 
                        animate={{ 
                            rotate: [0, -10, 10, -10, 0],
                            y: [0, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="relative bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl"
                    >
                        <Hammer className="w-16 h-16 text-white" strokeWidth={1.5} />
                    </motion.div>
                    
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-2 -right-2 bg-white text-black p-2 rounded-full shadow-lg"
                    >
                        <Timer className="w-5 h-5" />
                    </motion.div>
                </div>

                {/* Headline */}
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                    Improving Your <br/> Experience
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-lg md:text-xl max-w-lg mx-auto mb-12 leading-relaxed">
                    We're currently performing some scheduled maintenance to bring you a more premium and seamless shopping experience.
                </p>

                {/* Action / Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">status</span>
                        <p className="font-semibold text-white">System Optimizing...</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-left backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Estimated time</span>
                        <p className="font-semibold text-white">Returning Soon</p>
                    </div>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-6 text-gray-400">
                    <a href="#" className="hover:text-white transition-colors">
                        <Facebook className="w-6 h-6" />
                    </a>
                    <a href="#" className="hover:text-white transition-colors">
                        <Instagram className="w-6 h-6" />
                    </a>
                    <div className="h-6 w-px bg-white/10" />
                    <Link href="/auth/login" className="flex items-center gap-2 text-sm font-bold hover:text-white transition-colors">
                        Admin Login <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </motion.div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 text-white/20 text-[10vw] font-black pointer-events-none select-none tracking-tighter mix-blend-overlay">
                COMING SOON
            </div>
        </div>
    );
}
