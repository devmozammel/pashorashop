"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Custom hook to get user data from either NextAuth or Mock LocalStorage
export function useUserSession() {
    const { data: session, status } = useSession();
    const [mockUser, setMockUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for mock user
        const storedMock = typeof window !== 'undefined' ? localStorage.getItem("fh_mock_user") : null;

        if (storedMock) {
            setMockUser(JSON.parse(storedMock));
        }

        if (status !== "loading") {
            setIsLoading(false);
        }
    }, [status]);

    const user = session?.user || mockUser; // NextAuth takes precedence, then Mock

    // Combined Sign Out
    const signOut = async (options) => {
        if (session) {
            await nextAuthSignOut(options);
        } else {
            localStorage.removeItem("fh_mock_user");
            localStorage.removeItem("fh_user_profile");
            localStorage.removeItem("fh_orders");
            if (options?.callbackUrl) {
                window.location.href = options.callbackUrl;
            } else {
                window.location.reload();
            }
        }
    };

    return {
        user,
        status: isLoading ? "loading" : (user ? "authenticated" : "unauthenticated"),
        signOut
    };
}

// Helper to require authentication protected routes
export function requireUserClient(redirectUrl = "/auth/login") {
    const { user, status } = useUserSession();
    const router = useRouter();

    useEffect(() => {
        if (status !== "loading" && !user) {
            router.push(`${redirectUrl}?callbackUrl=${window.location.pathname}`);
        }
    }, [user, status, router, redirectUrl]);

    return { user, status };
}
