import { getSiteUrl } from "@/lib/siteUrl";
// app/robots.js — Next.js App Router robots.txt generator
export default function robots() {
    const siteUrl = getSiteUrl();
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
