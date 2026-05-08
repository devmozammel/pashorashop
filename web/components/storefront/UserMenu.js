import Link from "next/link";
import { User, LogOut, LayoutDashboard, ShoppingBag, CreditCard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useUserSession } from "@/lib/userSession";

export default function UserMenu() {
    const { user, signOut } = useUserSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) {
        return (
            <Link href="/auth/login" className="p-2 hover:bg-muted rounded-full transition-colors hidden md:block">
                <User className="w-5 h-5" />
            </Link>
        );
    }

    return (
        <div className="relative z-50" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-muted rounded-full transition-colors hidden md:block"
            >
                <div className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b bg-gray-50/50">
                        <p className="text-sm font-semibold truncate text-gray-900">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {user.role === "ADMIN" && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Panel
                        </Link>
                    )}

                    <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <User className="w-4 h-4" />
                        My Profile
                    </Link>

                    <Link
                        href="/my-orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        My Orders
                    </Link>

                    <div className="border-t my-1"></div>

                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
