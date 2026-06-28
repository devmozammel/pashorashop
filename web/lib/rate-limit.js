/**
 * Rate Limiter — In-Memory LRU Cache
 *
 * ⚠️ IMPORTANT FOR PRODUCTION (VERCEL / SERVERLESS):
 * This rate limiter uses in-memory storage. In serverless environments,
 * each invocation may get a fresh instance — rate limits may not persist.
 *
 * For production-grade rate limiting, migrate to:
 * → Upstash Redis: https://upstash.com/
 * → @upstash/ratelimit: npm install @upstash/ratelimit @upstash/redis
 *
 * Example migration:
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "60 s") });
 */
import { LRUCache } from "lru-cache";

const tokenCache = new LRUCache({
    max: 500,
    ttl: 60 * 1000, // 1 minute window
});

/**
 * Simple in-memory rate limiter.
 * @param {string} identifier - Usually IP address
 * @param {number} limit - Max requests per minute
 * @returns {{ success: boolean, remaining: number }}
 */
export function rateLimit(identifier, limit = 10) {
    if (!identifier) return { success: true, remaining: limit };

    const tokenCount = tokenCache.get(identifier) || [0];
    if (tokenCount[0] === 0) {
        tokenCache.set(identifier, [1]);
    } else {
        tokenCount[0] += 1;
        tokenCache.set(identifier, tokenCount);
    }

    return {
        remaining: limit - tokenCount[0],
        success: tokenCount[0] <= limit,
    };
}
