const DEFAULT_METHODS = 'GET,POST,OPTIONS';
const DEFAULT_HEADERS = 'Content-Type, Authorization';

export function applyCors(req, res, options = {}) {
    const origin = req.headers.origin || '';
    const allowedMethods = options.methods || DEFAULT_METHODS;
    const allowedHeaders = options.headers || DEFAULT_HEADERS;
    const allowCredentials = options.credentials || false;

    const envOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    const configuredOrigins = Array.isArray(options.origins) ? options.origins : [];
    const allowedOrigins = [...new Set([...envOrigins, ...configuredOrigins])];

    const allowAnyOrigin = allowedOrigins.length === 0;
    const originAllowed = allowAnyOrigin || !origin || allowedOrigins.includes(origin);
    const allowHeader = allowAnyOrigin ? origin || '*' : origin;

    if (originAllowed && allowHeader) {
        res.setHeader('Access-Control-Allow-Origin', allowHeader);
    }
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', allowedMethods);
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
    res.setHeader('Access-Control-Max-Age', '86400');

    if (allowCredentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    return {
        allowed: originAllowed,
        origin
    };
}
