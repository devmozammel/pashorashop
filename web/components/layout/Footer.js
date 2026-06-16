import { ShoppingBag, Facebook, Instagram } from "lucide-react";
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
                        <div className="flex items-center gap-4 pt-2">
                            <a href="https://www.facebook.com/share/1D2rWcKMQo/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="Facebook">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://www.instagram.com/authentic_bazar_shop?igsh=MWxzOXo5d2J3N3Jlbg==" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors" aria-label="Instagram">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://tiktok.com/@authenticbazar.shop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors" aria-label="TikTok">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 fill-current">
                                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31c8.89,0,17.14.82,25.83,2.44v86.28a82.86,82.86,0,1,0-43,84.14,79.88,79.88,0,0,0,53.86-81.5V0h86.77a102.77,102.77,0,0,0,101.44,101.44v86.77A211,211,0,0,1,448,209.91Z"/>
                                </svg>
                            </a>
                        </div>
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
