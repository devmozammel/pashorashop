import { getSiteUrl } from "@/lib/siteUrl";

import { Inter } from "next/font/google"; 
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
import FacebookPixel from "@/components/analytics/FacebookPixel";
import TikTokPixel from "@/components/analytics/TikTokPixel";
import AffiliateTracker from "@/components/analytics/AffiliateTracker";
import { prisma } from "@/lib/prisma";
import WhatsAppButton from "@/components/storefront/WhatsAppButton";
import Script from "next/script";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import ScrollToTop from "@/components/ui/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    metadataBase: new URL(getSiteUrl()),
    alternates: {
        canonical: "./",
    },
    title: {
        default: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং",
        template: "%s | Pashora Shop"
    },
    description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন। সারাদেশে ক্যাশ অন ডেলিভারি, দ্রুত ডেলিভারি ও সেরা মানের পণ্য পাওয়া যায়।",
    keywords: ["pashora shop", "পাশোরা শপ", "অনলাইন শপিং", "বাংলাদেশ শপিং", "গ্যাজেট", "ফ্যাশন", "লাইফস্টাইল", "ক্যাশ অন ডেলিভারি"],
    manifest: "/favicon_io/site.webmanifest",
    openGraph: {
        title: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং",
        description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন। সারাদেশে ক্যাশ অন ডেলিভারি সুবিধায় সেরা মানের পণ্য পাবেন।",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Pashora Shop Logo" }],
        siteName: "Pashora Shop",
        locale: "bn_BD",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pashora Shop | বাংলাদেশের প্রিমিয়াম অনলাইন শপিং",
        description: "পাশোরা শপে বিশ্বস্ত ও ট্রেন্ডি পণ্য কিনুন।",
        images: ["/logo.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        google: "cunNvAKdRRA4uHaheMDxeUvnu9KRRQD0fQnOigmrWcA",
    },
};

export const viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default async function RootLayout({ children }) {
    const siteUrl = getSiteUrl();

    let facebookPixelId = "";
    let tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "DBDR6KJC77UASCMGHUAG";
    let whatsappNumber = "8801620778044";
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            facebookPixelId = parsed.facebookPixelId || "";
            tiktokPixelId = parsed.tiktokPixelId || tiktokPixelId;
            if (parsed.whatsapp) {
                let clean = parsed.whatsapp.replace(/\D/g, "");
                if (clean.includes("01337744458") || clean.includes("01613134043")) clean = "8801620778044";
                if (clean.startsWith("0")) clean = "88" + clean;
                if (!clean.startsWith("88")) clean = "88" + clean;
                whatsappNumber = clean;
            }
        }
    } catch (e) {
        console.error("Error reading pixel IDs in RootLayout:", e);
    }

    const orgJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Pashora Shop",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "sameAs": [
            "https://www.facebook.com/pashorashop",
            "https://www.instagram.com/pashorashop"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+8801620778044",
            "contactType": "customer service",
            "areaServed": "BD",
            "availableLanguage": ["en", "bn"]
        }
    };

    const searchBoxJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/shop?search={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    const localBusinessJsonLd = {
        "@context": "https://schema.org",
        "@type": "ClothingStore",
        "name": "Pashora Shop",
        "image": `${siteUrl}/logo.png`,
        "@id": `${siteUrl}/#organization`,
        "url": siteUrl,
        "telephone": "+8801620778044",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Dhaka",
            "addressLocality": "Dhaka",
            "addressRegion": "Dhaka",
            "postalCode": "1200",
            "addressCountry": "BD"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 23.8103,
            "longitude": 90.4125
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday"
            ],
            "opens": "00:00",
            "closes": "23:59"
        },
        "sameAs": [
            "https://www.facebook.com/pashorashop",
            "https://www.instagram.com/pashorashop"
        ]
    };

    return (
        <html lang="bn-BD" suppressHydrationWarning>
            <head>
                {tiktokPixelId && (
                    <script
                        id="tiktok-pixel-base"
                        dangerouslySetInnerHTML={{
                            __html: `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${tiktokPixelId}');
  ttq.page();
}(window, document, 'ttq');`
                        }}
                    />
                )}
            </head>
            <body className={inter.className} suppressHydrationWarning>
                <NextTopLoader color="#000000" height={3} showSpinner={false} shadow="0 0 10px #000000,0 0 5px #000000" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(searchBoxJsonLd) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
                />
                <AuthProvider>
                    <Suspense fallback={null}>
                        <FacebookPixel id={facebookPixelId} />
                        <TikTokPixel id={tiktokPixelId} />
                        <AffiliateTracker />
                    </Suspense>

                    {/* Google Analytics Script */}
                    {process.env.NEXT_PUBLIC_GA_ID && (
                        <>
                            <Script
                                strategy="afterInteractive"
                                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                            />
                            <Script
                                id="google-analytics"
                                strategy="afterInteractive"
                                dangerouslySetInnerHTML={{
                                    __html: `
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                        gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                                            page_path: window.location.pathname,
                                        });
                                    `,
                                }}
                            />
                        </>
                    )}

                    {children}

                    {/* User Engagement Utilities */}
                    <WhatsAppButton waNumber={whatsappNumber} />
                    <ScrollToTop />

                    <Toaster position="top-right" richColors />
                </AuthProvider>
            </body>
        </html>
    );
}
