"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, User, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [password, setPassword] = useState("");

    const isPasswordValid = 
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isPasswordValid) {
            toast.error("পাসওয়ার্ড সিকিউরিটি রুল অনুযায়ী হয়নি।");
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        if (data.password !== data.confirmPassword) {
            setError("পাসওয়ার্ড দুটি মেলেনি।");
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                }),
            });

            const json = await res.json();

            if (res.ok) {
                toast.success("অ্যাকাউন্ট তৈরি হয়েছে! লগইন করা হচ্ছে...");
                // Auto login after register
                const result = await signIn("credentials", {
                    redirect: false,
                    email: data.email,
                    password: data.password
                });

                if (result?.error) {
                    router.push("/auth/login?success=Account created. Please login.");
                } else {
                    router.push("/");
                }
            } else {
                setError(json.error || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।");
                toast.error(json.error || "Registration failed.");
                setLoading(false);
            }
        } catch (err) {
            setError("সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Join Premium
                </h1>
                <p className="text-neutral-500 text-sm font-medium">
                    Create an account to start your journey with Authentic Bazar.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Secure Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="••••••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <PasswordStrength password={password} />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative group">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            minLength={8}
                            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="••••••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isPasswordValid}
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5 mt-4"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Account"}
                </button>
            </form>

            <div className="pt-2 text-center text-sm">
                <span className="text-neutral-500">Already a member? </span>
                <Link href="/auth/login" className="font-bold text-white hover:underline underline-offset-4 decoration-white/20">
                    Sign in to account
                </Link>
            </div>
        </div>
    );
}
