import { prisma } from "@/lib/prisma";
import ContactClient from "./ContactClient";

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
    return {
        title: `Contact Us | ${siteName} - Get in Touch`,
        description: `Have questions about products, shipping, or returns? Contact ${siteName} support. We are here to help you 24/7.`,
        alternates: {
            canonical: "/contact"
        }
    };
}

export default function ContactPage() {
    return <ContactClient />;
}
