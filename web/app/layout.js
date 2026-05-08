
import { Inter } from "next/font/google"; 
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";
// import StoreLayoutWrapper from "@/components/layout/StoreLayoutWrapper";
import FacebookPixel from "@/components/analytics/FacebookPixel";
import AffiliateTracker from "@/components/analytics/AffiliateTracker";
import WhatsAppButton from "@/components/storefront/WhatsAppButton";
import Script from "next/script";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import ScrollToTop from "@/components/ui/ScrollToTop";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://authenticbazar.com"),
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
};

export const viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({ children }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://authenticbazar.com";

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

    return (
        <html lang="en" suppressHydrationWarning>
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
                <AuthProvider>
                    <Suspense fallback={null}>
                        <FacebookPixel />
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
