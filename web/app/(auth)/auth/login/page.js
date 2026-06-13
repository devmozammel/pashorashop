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
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const isPending = loading || googleLoading;

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

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError("");
        try {
            await signIn("google", { callbackUrl });
        } catch (err) {
            setError("গুগল লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
            setGoogleLoading(false);
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
                            disabled={isPending}
                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm disabled:opacity-50"
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
                            disabled={isPending}
                            className="w-full h-14 pl-12 pr-12 rounded-2xl bg-neutral-800/50 border border-white/5 text-white placeholder-neutral-600 focus:border-white/20 focus:ring-4 focus:ring-white/5 transition-all outline-none text-sm disabled:opacity-50"
                            placeholder="••••••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isPending}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors focus:outline-none disabled:opacity-50"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In Account"}
                </button>
            </form>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-neutral-500 text-xs font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="w-full h-14 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
                {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                    <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </>
                )}
            </button>

            <div className="pt-2 text-center text-sm">
                <span className="text-neutral-500">New here? </span>
                <Link href="/auth/register" className="font-bold text-white hover:underline underline-offset-4 decoration-white/20">
                    Create account
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
