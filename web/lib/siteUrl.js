/**
 * Returns the authoritative public site URL for Pashora Shop.
 * Prevents using non-working vercel.app or legacy authenticbazar domains in canonicals/sitemaps.
 */
export function getSiteUrl() {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!raw || raw.includes("vercel.app") || raw.includes("authenticbazar.shop")) {
        return "https://www.pashorashop.com";
    }
    return raw.replace(/\/$/, "");
}

export const SITE_URL = getSiteUrl();
