import { prisma } from "@/lib/prisma";

async function getSiteName() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: "store_settings" } });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            return parsed.siteName || "Our Store";
        }
    } catch (_) { }
    return "Our Store";
}

export async function generateMetadata() {
    const siteName = await getSiteName();
    return {
        title: `Terms & Conditions | ${siteName}`,
        description: "Terms and conditions of use.",
    };
}

export default async function TermsPage() {
    const siteName = await getSiteName();

    return (
        <div className="container px-4 py-12 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
            <div className="prose max-w-none text-gray-700 space-y-6">
                <p>Welcome to {siteName}. By accessing our website, you agree to be bound by these Terms and Conditions.</p>

                <h2 className="text-xl font-semibold text-gray-900">1. General</h2>
                <p>We reserve the right to modify these terms at any time. Please review them periodically.</p>

                <h2 className="text-xl font-semibold text-gray-900">2. Products and Pricing</h2>
                <p>All products are subject to availability. We reserve the right to discontinue any product at any time. Prices are subject to change without notice.</p>

                <h2 className="text-xl font-semibold text-gray-900">3. Orders</h2>
                <p>We reserve the right to refuse any order you place with us. We will not be held responsible for any typographical errors on our website.</p>

                <h2 className="text-xl font-semibold text-gray-900">4. Intellectual Property</h2>
                <p>All content on this site, including images, text, and logos, is the property of {siteName} and may not be used without permission.</p>

                <h2 className="text-xl font-semibold text-gray-900">5. Liability</h2>
                <p>We shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of our website or products.</p>
            </div>
        </div>
    );
}
