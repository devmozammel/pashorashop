
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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop"),
    alternates: {
        canonical: "./",
    },
    title: {
        default: "Authentic Bazar | Premium Fashion Store in Bangladesh",
        template: "%s | Authentic Bazar"
    },
    description: "Discover premium fashion at Authentic Bazar. We offer a curated collection of authentic, high-quality clothing and accessories for men and women.",
    keywords: ["fashion", "clothing", "authentic bazar", "premium brands", "bangladesh fashion", "online shopping"],
    manifest: "/favicon_io/site.webmanifest",
    openGraph: {
        title: "Authentic Bazar | Premium Fashion",
        description: "Official Authentic Bazar Store - Quality Meets Elegance.",
        images: ["/logo.png"],
        siteName: "Authentic Bazar",
        locale: "en_BD",
        type: "website",
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";

    let facebookPixelId = "";
    let tiktokPixelId = "";
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { key: "store_settings" }
        });
        if (setting) {
            const parsed = JSON.parse(setting.value);
            facebookPixelId = parsed.facebookPixelId || "";
            tiktokPixelId = parsed.tiktokPixelId || "";
        }
    } catch (e) {
        console.error("Error reading pixel IDs in RootLayout:", e);
    }

    const orgJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Authentic Bazar",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "sameAs": [
            "https://www.facebook.com/authenticbazar",
            "https://www.instagram.com/authenticbazar"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+8801613134043",
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
        "name": "Authentic Bazar",
        "image": `${siteUrl}/logo.png`,
        "@id": `${siteUrl}/#organization`,
        "url": siteUrl,
        "telephone": "+8801613134043",
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
            "https://www.facebook.com/authenticbazar",
            "https://www.instagram.com/authenticbazar"
        ]
    };

    return (
        <html lang="en" suppressHydrationWarning>
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
                    <WhatsAppButton />
                    <ScrollToTop />

                    <Toaster position="top-right" richColors />
                </AuthProvider>
            </body>
        </html>
    );
}
