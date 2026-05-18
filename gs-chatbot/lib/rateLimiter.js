// Simple in-memory rate limiter for API protection
// For production, consider Redis-based solution for distributed systems

const requestCounts = new Map();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.resetTime > data.windowMs) {
            requestCounts.delete(key);
        }
    }
}, CLEANUP_INTERVAL);

/**
 * Rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @param {number} options.maxRequests - Maximum requests per window (default: 30)
 * @param {Function} options.keyGenerator - Function to generate rate limit key (default: uses IP)
 * @returns {Object} - { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(req, options = {}) {
    const {
        windowMs = 60000, // 1 minute default
        maxRequests = 30, // 30 requests per minute default
        keyGenerator = defaultKeyGenerator
    } = options;

    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = requestCounts.get(key);
    
    // Initialize or reset if window expired
    if (!record || now - record.resetTime >= windowMs) {
        record = {
            count: 0,
            resetTime: now,
            windowMs
        };
        requestCounts.set(key, record);
    }
    
    record.count++;
    
    const allowed = record.count <= maxRequests;
    const remaining = Math.max(0, maxRequests - record.count);
    const resetTime = record.resetTime + windowMs;
    
    return {
        allowed,
        remaining,
        resetTime,
        limit: maxRequests
    };
}

/**
 * Default key generator uses IP address
 */
function defaultKeyGenerator(req) {
    // Try to get real IP behind proxies
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           'unknown';
}

/**
 * Apply rate limit headers to response
 */
export function applyRateLimitHeaders(res, rateLimitResult) {
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
}
