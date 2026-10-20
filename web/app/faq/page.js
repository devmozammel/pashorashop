import { getSiteUrl } from "@/lib/siteUrl";


export async function generateMetadata() {
    const siteUrl = getSiteUrl();
    const title = "সচরাচর জিজ্ঞাসা (FAQ) | Pashora Shop";
    const description = "পাশোরা শপের অর্ডার ট্র্যাকিং, ডেলিভারি সময়, রিটার্ন পলিসি, পেমেন্ট পদ্ধতি সম্পর্কে সাধারণ প্রশ্নের উত্তর পান।";
    return {
        title,
        description,
        keywords: ["FAQ", "পাশোরা শপ FAQ", "অর্ডার ট্র্যাকিং", "ডেলিভারি সময়", "রিটার্ন পলিসি"],
        alternates: { canonical: `${siteUrl}/faq` },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/faq`,
            siteName: "Pashora Shop",
            locale: "bn_BD",
            type: "website",
        },
    };
}

export default function FAQ() {
    const faqs = [
        {
            q: "How do I track my order?",
            a: "Visit the Track Order page and enter your Order ID (ORD-...) along with the email or phone number you used at checkout.",
        },
        {
            q: "What is your return policy?",
            a: "We offer a 7-day return policy on all items. Products must be in original condition with tags attached. Visit our Return Policy page for full details.",
        },
        {
            q: "How long does delivery take?",
            a: "Inside Dhaka: 1–2 business days. Outside Dhaka: 3–5 business days.",
        },
        {
            q: "What payment methods do you accept?",
            a: "We currently accept Cash on Delivery (COD). Online payment via bKash, Nagad, and Cards coming soon.",
        },
        {
            q: "Can I change or cancel my order?",
            a: "You can cancel or change your order within 2 hours of placing it. After that, please contact us via WhatsApp or the contact form.",
        },
        {
            q: "Are the products authentic?",
            a: "Yes, all our products are 100% authentic. We source directly from manufacturers and trusted suppliers.",
        },
    ];

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(item => ({
            "@type": "Question",
            "name": item.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": item.a
            }
        }))
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <h1 className="text-3xl font-extrabold mb-3 text-gray-900">Frequently Asked Questions</h1>
            <p className="text-gray-500 mb-10">Find answers to the most common questions about our store.</p>

            <div className="space-y-4">
                {faqs.map((item, i) => (
                    <details key={i} className="group border rounded-xl bg-white shadow-sm overflow-hidden">
                        <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none">
                            {item.q}
                            <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform duration-200">▾</span>
                        </summary>
                        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t pt-4">
                            {item.a}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}
