
"use client";

import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import CartDrawer from '@/components/cart/CartDrawer';
import { Button } from '@/components/ui/Button';

export default function HeaderClient({ session }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-4">
                <button className="text-sm font-medium hover:underline underline-offset-4">
                    <Search className="h-5 w-5" />
                </button>
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative text-sm font-medium hover:underline underline-offset-4"
                >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        0
                    </span>
                </button>
                {session ? (
                    <Link href="/my-orders">
                        <User className="h-5 w-5" />
                    </Link>
                ) : (
                    <Link href="/auth/login" className="text-sm font-medium hover:underline underline-offset-4">
                        Login
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-white border-b shadow-lg p-4 md:hidden flex flex-col gap-4">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                    <Link href="/category/men" onClick={() => setIsMobileMenuOpen(false)}>Men</Link>
                    <Link href="/category/women" onClick={() => setIsMobileMenuOpen(false)}>Women</Link>
                    <Link href="/category/kids" onClick={() => setIsMobileMenuOpen(false)}>Kids</Link>
                </div>
            )}
        </>
    );
}
