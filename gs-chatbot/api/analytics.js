// Analytics API endpoint for monitoring chatbot performance
import { applyCors } from '../lib/cors.js';
import { analyticsTracker } from '../lib/analytics.js';

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'GET,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const summary = analyticsTracker.getSummary();
        
        return res.status(200).json({
            status: 'success',
            data: summary
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({ 
            error: 'Failed to retrieve analytics',
            message: error.message 
        });
    }
}
