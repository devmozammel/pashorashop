import { LRUCache } from "lru-cache";

const tokenCache = new LRUCache({
    max: 500,
    ttl: 60 * 1000, // 1 minute
});

export function rateLimit(identifier, limit = 10) {
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
