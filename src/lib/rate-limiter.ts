/**
 * Simple in-memory rate limiter for Next.js API routes.
 *
 * This implementation uses a sliding window algorithm:
 * - It tracks the timestamps of recent requests per IP address.
 * - If an IP exceeds the allowed number of requests within the time window,
 *   it is temporarily blocked and receives a 429 response.
 *
 * NOTE: This is a single-process, in-memory solution — suitable for a single
 * Docker container. If you ever scale to multiple containers, replace this
 * with a Redis-backed solution (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
    // Timestamps (ms) of each request made within the current window
    timestamps: number[];
}

// Global store: maps IP address → request history
// Using a Map on the global object ensures it persists across hot-reloads in dev.
declare global {
    var __RATE_LIMIT_STORE__: Map<string, RateLimitEntry> | undefined;
}

const getStore = (): Map<string, RateLimitEntry> => {
    if (!global.__RATE_LIMIT_STORE__) {
        global.__RATE_LIMIT_STORE__ = new Map();
    }
    return global.__RATE_LIMIT_STORE__;
};

interface RateLimitOptions {
    /** Maximum number of requests allowed within the window. Default: 10 */
    limit?: number;
    /** Time window in milliseconds. Default: 60_000 (1 minute) */
    windowMs?: number;
}

interface RateLimitResult {
    /** True if the request is allowed, false if the limit has been exceeded */
    allowed: boolean;
    /** How many requests the client has left in the current window */
    remaining: number;
    /** Unix timestamp (ms) when the oldest request in the window expires */
    resetAt: number;
}

/**
 * Check whether a given IP address is within the rate limit.
 *
 * @param ip      - The client's IP address (use request headers in Next.js)
 * @param options - Optional limit and window configuration
 * @returns       - { allowed, remaining, resetAt }
 *
 * @example
 * const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
 * const { allowed } = checkRateLimit(ip, { limit: 5, windowMs: 60_000 });
 * if (!allowed) return new Response('Too Many Requests', { status: 429 });
 */
export function checkRateLimit(
    ip: string,
    options: RateLimitOptions = {}
): RateLimitResult {
    const limit = options.limit ?? 10;
    const windowMs = options.windowMs ?? 60_000;

    const store = getStore();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Retrieve or create the entry for this IP
    const entry = store.get(ip) ?? { timestamps: [] };

    // Sliding window: discard timestamps that are outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const allowed = entry.timestamps.length < limit;

    if (allowed) {
        // Record this request
        entry.timestamps.push(now);
        store.set(ip, entry);
    }

    const remaining = Math.max(0, limit - entry.timestamps.length);
    // The window resets when the oldest recorded request falls out of the window
    const resetAt = entry.timestamps.length > 0 ? entry.timestamps[0] + windowMs : now + windowMs;

    return { allowed, remaining, resetAt };
}
