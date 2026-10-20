import { getSiteUrl } from "@/lib/siteUrl";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

async function getSiteName() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: "store_settings" } });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            return parsed.siteName || "Pashora Shop";
        }
    } catch (_) { }
    return "Pashora Shop";
}

export async function generateMetadata() {
    const siteName = await getSiteName();
    const siteUrl = getSiteUrl();
    const title = `Privacy Policy | গোপনীয়তা নীতি | ${siteName}`;
    const description = `${siteName} আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখে। আমাদের গোপনীয়তা নীতি পড়ুন এবং জানুন আমরা কীভাবে আপনার ডেটা ব্যবহার করি।`;
    return {
        title,
        description,
        alternates: { canonical: `${siteUrl}/privacy-policy` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/privacy-policy`,
            siteName,
            locale: "bn_BD",
            type: "website",
        },
    };
}

export default async function PrivacyPolicyPage() {
    const siteName = await getSiteName();

    return (
        <div className="min-h-screen bg-gray-50 py-12 md:py-20">
            <div className="container px-4 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-500">
                        How we collect, use, and protect your personal information.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-12">

                    <div className="prose max-w-none text-gray-600 space-y-8 text-[15px] leading-relaxed">
                        <p className="text-gray-800 font-medium text-lg border-l-4 border-gray-900 pl-4 bg-gray-50 py-3 pr-4 rounded-r-xl">
                            Welcome to <strong>{siteName}</strong>. We respect your privacy and are deeply committed to protecting your personal data when you use our services.
                        </p>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                Information We Collect
                            </h2>
                            <p className="pl-10">
                                We collect information you provide directly to us, such as when you create an account, make a purchase, or sign up for our newsletter. This includes your name, email address, phone number, and shipping address.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                How We Use Your Information
                            </h2>
                            <p className="pl-10">
                                We use your information to process your orders, communicate with you, and improve our services. We strictly do not sell, rent, or trade your personal information to third parties.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                                Data Security
                            </h2>
                            <p className="pl-10">
                                We implement appropriate technical, administrative, and organizational security measures to protect your personal data against unauthorized access, theft, or disclosure.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
                                Cookies
                            </h2>
                            <p className="pl-10">
                                We use cookies and similar tracking technologies to improve your browsing experience and keep you securely logged in. You can disable cookies in your browser settings at any time.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100 mt-10">
                            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="bg-gray-100 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
                                Contact Us
                            </h2>
                            <p className="pl-10">
                                If you have any questions or requests regarding this Privacy Policy, please feel free to <Link href="/contact" className="text-red-600 font-semibold hover:underline">contact us</Link>.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
