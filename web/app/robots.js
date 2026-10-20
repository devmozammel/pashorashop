// app/robots.js — Next.js App Router robots.txt generator
export default function robots() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pashorashop.com";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/api/",
                    "/checkout",
                    "/account/",
                    "/cart",
                    "/wishlist",
                    "/my-orders",
                    "/order/",
                    "/order-success/",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
