"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error("ইমেইল অ্যাড্রেসটি দিন।");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                toast.success("পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে!");
            } else {
                toast.error(data.error || "লিঙ্ক পাঠাতে সমস্যা হয়েছে।");
            }
        } catch (error) {
            toast.error("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center space-y-6">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full" />
                    <CheckCircle2 className="relative mx-auto h-20 w-20 text-green-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight">Check Your Inbox</h2>
                    <p className="text-neutral-500 text-sm font-medium px-4 leading-relaxed">
                        একটি পাসওয়ার্ড রিসেট লিঙ্ক <strong>{email}</strong> ঠিকানায় পাঠানো হয়েছে। দয়া করে আপনার ইনবক্স অথবা <span className="text-white font-bold underline">SPAM / Junk</span> ফোল্ডার চেক করুন।
                    </p>
                </div>
                <Link
                    href="/auth/login"
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center shadow-xl shadow-white/5"
                >
                    Return to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
                <Link
                    href="/auth/login"
                    className="group flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to login
                </Link>
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        Reset Identity
                    </h1>
                    <p className="text-neutral-500 text-sm font-medium">
                        Recovery access to your premium account securely.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin h-6 w-6" />
                    ) : (
                        "Send Secure Link"
                    )}
                </button>
            </form>
            
            <p className="text-center text-[10px] text-neutral-600 uppercase tracking-widest leading-relaxed px-8">
                Security Tip: Never share your recovery link with anyone. Authentic Bazar support will never ask for it.
            </p>
        </div>
    );
}
