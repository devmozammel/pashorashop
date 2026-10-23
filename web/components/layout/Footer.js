import {
    ShoppingBag,
    Facebook,
    Instagram,
    Truck,
    ShieldCheck,
    RotateCcw,
    Headphones,
    PhoneCall,
    Mail,
    MapPin,
    MessageCircle,
    ArrowUpRight,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getStoreSettings() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: "store_settings" } });
        if (setting?.value) {
            return JSON.parse(setting.value);
        }
    } catch (_) { }
    return {
        siteName: "Pashora Shop",
        whatsapp: "8801620778044",
        supportEmail: "support@pashorashop.com",
        address: "Dhaka, Bangladesh",
        deliveryFeeInside: 70,
        deliveryFeeOutside: 130
    };
}

export default async function Footer() {
    const settings = await getStoreSettings();
    const siteName = settings.siteName || "Pashora Shop";
    const whatsapp = settings.whatsapp || "8801620778044";
    const cleanPhone = whatsapp.replace(/[^0-9]/g, "");
    const deliveryInside = settings.deliveryFeeInside || 70;
    const deliveryOutside = settings.deliveryFeeOutside || 130;

    return (
        <footer className="w-full bg-[#0b0f17] text-gray-300 border-t border-gray-800/80">
            {/* 1. Top Delivery & Free Shipping Banner */}
            <div className="bg-gray-900 text-gray-300 py-2.5 px-4 border-b border-gray-800">
                <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm font-medium gap-2 text-center sm:text-left">
                    <div className="flex items-center justify-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>
                            সারা বাংলাদেশে ডেলিভারি · ঢাকার ভিতরে ৳{deliveryInside} · ঢাকার বাইরে ৳{deliveryOutside}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-emerald-400 font-semibold">৳২,০০০+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি</span>
                    </div>
                </div>
            </div>

            {/* 2. 4-Column Trust & Service Highlights (Clean & Uniform) */}
            <div className="border-b border-gray-800/80 py-6 bg-[#0d121c]">
                <div className="container mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">দ্রুত ডেলিভারি</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">ঢাকায় দ্রুত, সারাদেশে নির্ভরযোগ্য</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">ক্যাশ অন ডেলিভারি</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">পণ্য হাতে পেয়ে পেমেন্ট করুন</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">১ দিনের রিটার্ন</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">ঝামেলাহীন সহজ রিটার্ন সাপোর্ট</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0">
                            <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">দ্রুত সাপোর্ট</h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">সরাসরি ফোন ও WhatsApp হেল্পলাইন</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Main Footer Links & Info */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand Info & Contact Card (Spans 2 cols on lg) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                                <ShoppingBag className="w-4 h-4" />
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">{siteName}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm">
                            আমাদের লক্ষ্য সেরা মানের অথেনটিক ও ট্রেন্ডি প্রোডাক্ট সবচেয়ে সাশ্রয়ী মূল্যে গ্রাহকের দোরগোড়ায় পৌঁছে দেওয়া। ১০০% সন্তুষ্টির নিশ্চয়তা।
                        </p>

                        {/* Direct Helpline / WhatsApp CTAs */}
                        <div className="pt-2 flex flex-wrap gap-2.5">
                            <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors"
                            >
                                <MessageCircle className="w-4 h-4 fill-white" />
                                <span>WhatsApp চ্যাট</span>
                            </a>
                            <a
                                href={`tel:${cleanPhone}`}
                                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium text-xs px-3.5 py-2 rounded-lg border border-gray-700 transition-colors"
                            >
                                <PhoneCall className="w-3.5 h-3.5 text-gray-400" />
                                <span>সরাসরি কল: +{cleanPhone}</span>
                            </a>
                        </div>

                        {/* Location & Email */}
                        <div className="pt-2 space-y-1.5 text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                <span>{settings.address || "ঢাকা, বাংলাদেশ"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                <span>{settings.supportEmail || "support@authenticbazar.shop"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Support Links */}
                    <div>
                        <h3 className="font-semibold text-white text-sm tracking-wide mb-3.5">
                            গ্রাহক সেবা
                        </h3>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                            <li><Link href="/track" className="hover:text-white transition-colors">অর্ডার ট্র্যাকিং</Link></li>
                            <li><Link href="/return-refund-policy" className="hover:text-white transition-colors">রিটার্ন ও রিফান্ড পলিসি</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-white transition-colors">প্রাইভেসি পলিসি</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">শর্তাবলী ও নিয়মাবলী</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">সাধারণ প্রশ্নাবলী (FAQ)</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">যোগাযোগ করুন</Link></li>
                        </ul>
                    </div>

                    {/* Quick Shopping Links */}
                    <div>
                        <h3 className="font-semibold text-white text-sm tracking-wide mb-3.5">
                            জনপ্রিয় ক্যাটাগরি
                        </h3>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                            <li><Link href="/category/phones-gadgets" className="hover:text-white transition-colors">ফোন ও গ্যাজেট</Link></li>
                            <li><Link href="/category/men" className="hover:text-white transition-colors">পুরুষদের ফ্যাশন</Link></li>
                            <li><Link href="/category/women" className="hover:text-white transition-colors">নারীদের ফ্যাশন</Link></li>
                            <li><Link href="/category/beauty-skincare" className="hover:text-white transition-colors">বিউটি ও স্কিনকেয়ার</Link></li>
                            <li><Link href="/category/sports" className="hover:text-white transition-colors">স্পোর্টস ও ফিটনেস</Link></li>
                            <li><Link href="/flash-sale" className="text-emerald-400 hover:text-white font-medium transition-colors">ফ্ল্যাশ সেল অফার</Link></li>
                        </ul>
                    </div>

                    {/* Social & Payment */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-l-2 border-brand-500 pl-2">
                            যুক্ত থাকুন
                        </h3>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.facebook.com/share/1D2rWcKMQo/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-blue-500 hover:border-blue-500/40 flex items-center justify-center transition-all"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="https://www.instagram.com/authentic_bazar_shop?igsh=MWxzOXo5d2J3N3Jlbg=="
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-pink-500 hover:border-pink-500/40 flex items-center justify-center transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a
                                href="https://tiktok.com/@authenticbazar.shop"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 flex items-center justify-center transition-all"
                                aria-label="TikTok"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-4 w-4 fill-current">
                                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31c8.89,0,17.14.82,25.83,2.44v86.28a82.86,82.86,0,1,0-43,84.14,79.88,79.88,0,0,0,53.86-81.5V0h86.77a102.77,102.77,0,0,0,101.44,101.44v86.77A211,211,0,0,1,448,209.91Z" />
                                </svg>
                            </a>
                        </div>

                        <div className="pt-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                পেমেন্ট পার্টনার
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-gray-300">
                                <span className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-lg">ক্যাশ অন ডেলিভারি</span>
                                <span className="bg-pink-950/50 border border-pink-800/40 text-pink-300 px-2 py-1 rounded-lg">bKash</span>
                                <span className="bg-orange-950/50 border border-orange-800/40 text-orange-300 px-2 py-1 rounded-lg">Nagad</span>
                                <span className="bg-purple-950/50 border border-purple-800/40 text-purple-300 px-2 py-1 rounded-lg">Rocket</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bottom Copyright Bar */}
                <div className="mt-12 pt-6 border-t border-gray-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 text-center md:text-left">
                    <p>© {new Date().getFullYear()} {siteName}. সর্বস্বত্ব সংরক্ষিত।</p>
                    <div className="flex items-center gap-4 text-gray-500">
                        <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            ১০০% সিকিউর চেকআউট
                        </span>
                        <span>•</span>
                        <span>সরাসরি সারা বাংলাদেশে ডেলিভারি</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

