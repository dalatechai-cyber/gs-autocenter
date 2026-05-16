// Customer feedback and satisfaction rating API
import { applyCors } from '../lib/cors.js';
import { analyticsTracker } from '../lib/analytics.js';
import { checkRateLimit, applyRateLimitHeaders } from '../lib/rateLimiter.js';

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'POST,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // Rate limiting
    const rateLimit = checkRateLimit(req, {
        windowMs: 300000, // 5 minutes
        maxRequests: 10   // 10 feedback submissions per 5 minutes
    });
    applyRateLimitHeaders(res, rateLimit);

    if (!rateLimit.allowed) {
        return res.status(429).json({ 
            error: 'Too many feedback submissions. Please try again later.'
        });
    }

    try {
        const { rating, feedback = '' } = req.body || {};

        // Validate rating
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({ 
                error: 'Invalid rating. Must be a number between 1 and 5.' 
            });
        }

        // Validate feedback (optional)
        if (feedback && typeof feedback !== 'string') {
            return res.status(400).json({ 
                error: 'Feedback must be a string' 
            });
        }

        // Limit feedback length
        const sanitizedFeedback = feedback ? feedback.slice(0, 1000) : '';

        // Track satisfaction
        analyticsTracker.trackSatisfaction(rating, sanitizedFeedback);

        return res.status(200).json({
            success: true,
            message: 'Thank you for your feedback!',
            rating,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Feedback error:', error);
        return res.status(500).json({ 
            error: 'Failed to submit feedback',
            message: error.message 
        });
    }
}
