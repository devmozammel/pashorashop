"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import Link from "next/link";

export default function UserMenuMobile({ onClick }) {
    const { data: session } = useSession();

    if (!session) {
        return (
            <Link
                href="/auth/login"
                onClick={onClick}
                className="flex items-center gap-3 text-[15px] font-semibold text-gray-800 py-2"
            >
                <User className="w-5 h-5 text-gray-500" />
                Login / Register
            </Link>
        );
    }

    return (
        <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 text-[15px] font-semibold text-gray-800">
                <User className="w-5 h-5 text-gray-500" />
                <span>{session.user?.name || "Account"}</span>
            </div>
            <button
                onClick={() => {
                    signOut({ callbackUrl: '/' });
                    if (onClick) onClick();
                }}
                className="flex items-center gap-3 text-[14px] font-medium text-red-600 w-full text-left"
            >
                <LogOut className="w-4 h-4" />
                Logout
            </button>
        </div>
    );
}
