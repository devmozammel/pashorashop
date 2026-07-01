/**
 * Unified client IP resolver.
 * Parses headers from Next.js request objects to extract the real client IP.
 * Prioritizes Cloudflare and Vercel real IP headers, and parses x-forwarded-for lists safely.
 *
 * @param {Request} request - Next.js Request object
 * @returns {string} Client IP address
 */
export function getClientIP(request) {
    if (!request) return "127.0.0.1";

    try {
        // Cloudflare real IP
        const cfConnectingIp = request.headers.get("cf-connecting-ip");
        if (cfConnectingIp) {
            return cfConnectingIp.trim();
        }

        // Vercel real IP
        const xRealIp = request.headers.get("x-real-ip");
        if (xRealIp) {
            return xRealIp.trim();
        }

        // Standard x-forwarded-for (can contain proxies: client, proxy1, proxy2)
        const xForwardedFor = request.headers.get("x-forwarded-for");
        if (xForwardedFor) {
            const firstIp = xForwardedFor.split(",")[0];
            if (firstIp) {
                return firstIp.trim();
            }
        }
    } catch (err) {
        console.error("[IP Resolver] Error resolving client IP:", err);
    }

    return "127.0.0.1";
}
