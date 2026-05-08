"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SigninRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const callbackUrl = searchParams.get("callbackUrl");
        const target = callbackUrl
            ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
            : "/auth/login";

        router.replace(target);
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Redirecting to login...</p>
            </div>
        </div>
    );
}

export default function SigninRedirect() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            </div>
        }>
            <SigninRedirectContent />
        </Suspense>
    );
}
