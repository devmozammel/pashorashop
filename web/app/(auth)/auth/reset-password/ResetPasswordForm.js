"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, ShieldLarge } from "lucide-react";
import { toast } from "sonner";
import PasswordStrength from "@/components/auth/PasswordStrength";

export default function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isPasswordValid = 
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password);

    if (!token) {
        return (
            <div className="text-center p-8 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-red-400 font-bold mb-4">Invalid or missing token.</p>
                <Link href="/auth/forgot-password" className="text-sm text-white underline underline-offset-4 font-bold">
                    Request a new link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            toast.error("দয়া করে সব সিকিউরিটি নিয়মগুলো পূরণ করুন।");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("পাসওয়ার্ড দুটি মেলেনি।");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (res.ok) {
                setIsSuccess(true);
                toast.success("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
            } else {
                toast.error(data.error || "পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।");
            }
        } catch (error) {
            toast.error("একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
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
                    <h2 className="text-3xl font-black text-white tracking-tight">Identity Secured</h2>
                    <p className="text-neutral-500 text-sm font-medium">
                        আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে। এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
                    </p>
                </div>
                <Link
                    href="/auth/login"
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center shadow-xl shadow-white/5"
                >
                    লগইন করুন
                </Link>
            </div>
        );
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">New Secure Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                        placeholder="••••••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <PasswordStrength password={password} />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                        placeholder="••••••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors focus:outline-none"
                    >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5 mt-4"
            >
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : "Update Identity"}
            </button>
        </form>
    );
}
