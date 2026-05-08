import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getSiteName() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: "store_settings" } });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            return parsed.siteName || "Fashion House";
        }
    } catch (_) { }
    return "Fashion House";
}

export default async function Footer() {
    const siteName = await getSiteName();

    return (
        <footer className="border-t bg-white w-full">
            <div className="container mx-auto px-4 py-10">
                <div className="grid gap-10 md:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-6 w-6" />
                            <span className="text-lg font-bold">{siteName}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                            Your premium destination for fashion and style. Quality meets elegance.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Shop</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/shop?sort=newest" className="hover:text-gray-900 transition-colors">New Arrivals</Link></li>
                            <li><Link href="/shop" className="hover:text-gray-900 transition-colors">All Products</Link></li>
                            <li><Link href="/flash-sale" className="hover:text-gray-900 transition-colors">Flash Sale</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/contact" className="hover:text-gray-900 transition-colors">Contact Us</Link></li>
                            <li><Link href="/faq" className="hover:text-gray-900 transition-colors">FAQs</Link></li>
                            <li><Link href="/track" className="hover:text-gray-900 transition-colors">Track Order</Link></li>
                            <li><Link href="/return-refund-policy" className="hover:text-gray-900 transition-colors">Return Policy</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Legal</h3>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} {siteName}. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
