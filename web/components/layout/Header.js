
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import HeaderClient from "@/components/layout/HeaderClient";

export default async function Header() {
    const session = await getServerSession(authOptions);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6" />
                    <span className="text-lg font-bold">Fashion House</span>
                </Link>
                <nav className="hidden md:flex gap-6">
                    <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">
                        Home
                    </Link>
                    <Link href="/category/men" className="text-sm font-medium hover:underline underline-offset-4">
                        Men
                    </Link>
                    <Link href="/category/women" className="text-sm font-medium hover:underline underline-offset-4">
                        Women
                    </Link>
                    <Link href="/category/kids" className="text-sm font-medium hover:underline underline-offset-4">
                        Kids
                    </Link>
                </nav>
                <div className="flex items-center gap-4">
                    <HeaderClient session={session} />
                </div>
            </div>
        </header>
    );
}
