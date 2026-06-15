// app/robots.js — Next.js App Router robots.txt generator
export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.authenticbazar.shop";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin/", "/api/", "/checkout", "/account/"],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
