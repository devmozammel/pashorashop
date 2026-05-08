"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/account";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (res.error) {
                setError("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
                toast.error("Invalid credentials.");
                setLoading(false);
            } else {
                toast.success("সফলভাবে লগইন হয়েছে!");
                router.refresh();
                
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (session?.user?.role === "ADMIN") {
                    router.push("/admin");
                } else {
                    router.push(callbackUrl);
                }
            }
        } catch (err) {
            setError("কিছু ভুল হয়েছে। আবার চেষ্টা করুন।");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    Welcome Back
                </h1>
                <p className="text-neutral-500 text-sm font-medium">
                    Sign in to continue to your premium experience.
                </p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1" htmlFor="email">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest" htmlFor="password">Password</label>
                        <Link href="/auth/forgot-password" title="যাও পাসওয়ার্ডটি খুঁজে আনি" className="text-[11px] text-white/40 hover:text-white transition-colors font-bold uppercase tracking-tighter">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm"
                            placeholder="••••••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In Account"}
                </button>
            </form>

            <div className="pt-2 text-center text-sm">
                <span className="text-neutral-500">New here? </span>
                <Link href="/auth/register" className="font-bold text-white hover:underline underline-offset-4 decoration-white/20">
                    Create a premium account
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20 text-white">
                <Loader2 className="w-10 h-10 animate-spin opacity-20" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
