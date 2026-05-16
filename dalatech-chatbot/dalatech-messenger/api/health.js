// Health check endpoint for monitoring system status
import { applyCors } from '../lib/cors.js';

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'GET,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const startTime = Date.now();
    
    try {
        // Check environment variables
        const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;

        // Calculate uptime
        const uptime = process.uptime ? process.uptime() : 0;

        // Memory usage
        const memoryUsage = process.memoryUsage ? {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
        } : null;

        const latency = Date.now() - startTime;

        const health = {
            status: hasAnthropicKey ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            latency: `${latency}ms`,
            uptime: `${Math.round(uptime)}s`,
            version: '1.0.0',
            checks: {
                anthropicApiKey: hasAnthropicKey ? 'configured' : 'missing',
                api: 'operational',
                memory: memoryUsage
            }
        };

        const statusCode = hasAnthropicKey ? 200 : 503;
        
        return res.status(statusCode).json(health);
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
}
