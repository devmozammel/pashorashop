import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { Loader2 } from "lucide-react";

export const metadata = {
    title: "Reset Identity - Authentic Bazar",
    description: "Enter your new password to reset your account access.",
};

export default function ResetPasswordPage() {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    New Identity
                </h1>
                <p className="text-neutral-500 text-sm font-medium">
                    Select a fortified password for your premium account.
                </p>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-white/20 h-10 w-10" />
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
