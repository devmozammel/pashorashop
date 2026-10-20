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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pashorashop.com";
    const title = `যোগাযোগ করুন | ${siteName}`;
    const description = `পণ্য, শিপিং বা রিটার্ন সম্পর্কে প্রশ্ন আছে? ${siteName}-এর সাথে যোগাযোগ করুন। আমরা ২৪/৭ সাহায্য করতে প্রস্তুত।`;
    return {
        title,
        description,
        alternates: { canonical: `${siteUrl}/contact` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/contact`,
            siteName,
            locale: "bn_BD",
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default function ContactPage() {
    return <ContactClient />;
}
