// Input validation and sanitization utilities

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_LENGTH = 50;
const MAX_HISTORY_ITEM_LENGTH = 5000;

/**
 * Validate and sanitize chat message input
 * @param {string} message - User message
 * @returns {Object} - { valid: boolean, sanitized: string, error: string }
 */
export function validateMessage(message) {
    // Check if message exists
    if (!message || typeof message !== 'string') {
        return {
            valid: false,
            sanitized: '',
            error: 'Message is required and must be a string'
        };
    }
    
    // Trim whitespace
    const trimmed = message.trim();
    
    // Check if empty after trimming
    if (trimmed.length === 0) {
        return {
            valid: false,
            sanitized: '',
            error: 'Message cannot be empty'
        };
    }
    
    // Check length
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
        return {
            valid: false,
            sanitized: '',
            error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed`
        };
    }
    
    // Basic sanitization - remove control characters except newlines and tabs
    const sanitized = trimmed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return {
        valid: true,
        sanitized,
        error: null
    };
}

/**
 * Validate chat history array
 * @param {Array} history - Chat history
 * @returns {Object} - { valid: boolean, sanitized: Array, error: string }
 */
export function validateHistory(history) {
    // Check if array
    if (!Array.isArray(history)) {
        return {
            valid: false,
            sanitized: [],
            error: 'History must be an array'
        };
    }
    
    // Check length
    if (history.length > MAX_HISTORY_LENGTH) {
        return {
            valid: false,
            sanitized: [],
            error: `History too long. Maximum ${MAX_HISTORY_LENGTH} items allowed`
        };
    }
    
    // Validate and sanitize each item
    const sanitized = [];
    for (const item of history) {
        if (!item || typeof item !== 'object') {
            continue; // Skip invalid items
        }
        
        const { role, content } = item;
        
        // Validate role
        if (!role || (role !== 'user' && role !== 'assistant' && role !== 'model')) {
            continue; // Skip items with invalid role
        }
        
        // Validate content
        if (!content || typeof content !== 'string') {
            continue; // Skip items with invalid content
        }
        
        // Check content length
        if (content.length > MAX_HISTORY_ITEM_LENGTH) {
            continue; // Skip items that are too long
        }
        
        // Sanitize content
        const sanitizedContent = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        
        sanitized.push({
            role: role === 'model' ? 'assistant' : role, // Normalize model to assistant
            content: sanitizedContent
        });
    }
    
    return {
        valid: true,
        sanitized,
        error: null
    };
}

/**
 * Validate email address
 * @param {string} email - Email address
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Mongolian format)
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    // Mongolian phone numbers: 8 digits, may start with country code
    const phoneRegex = /^(\+976|976)?[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text that may contain HTML
 * @returns {string} - Sanitized text
 */
export function sanitizeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Check if text contains suspicious patterns (potential injection attempts)
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export function hasSuspiciousPatterns(text) {
    if (!text || typeof text !== 'string') return false;

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /eval\(/i,
        /expression\(/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Heuristic detector for prompt-injection / jailbreak attempts.
 *
 * Returns true for clear-cut manipulation language in English or Mongolian
 * (Cyrillic). Detection is lossy by design — when it fires we don't reject
 * the request outright; the handler returns a canned refusal so the model
 * never sees the manipulated turn. Suspicious-but-ambiguous phrasing falls
 * through and is handled by the hardened system prompt instead.
 */
export function hasPromptInjectionPatterns(text) {
    if (!text || typeof text !== 'string') return false;

    const t = text.toLowerCase();

    const patterns = [
        // English jailbreak / role manipulation
        /ignore (all |any |the |your )?(previous|prior|above|earlier) (instructions?|rules?|prompts?|directives?)/,
        /disregard (all |any |the |your )?(previous|prior|above) (instructions?|rules?|prompts?)/,
        /forget (everything|all|your|the) (instructions?|rules?|prompts?|training)/,
        /you (are|'re) (now|actually) (a|an) /,
        /act as (a|an|if you)/,
        /pretend (to be|you are|that you)/,
        /roleplay as/,
        /\bdan\b.{0,20}(mode|jailbreak|do anything)/,
        /developer mode/,
        /jailbreak/,
        /reveal (your|the) (system|initial|original) (prompt|instructions|message)/,
        /show me (your|the) (system|initial|original) (prompt|instructions)/,
        /what (are|were) your (instructions|rules|system prompt)/,
        /repeat (your|the) (instructions|system prompt|rules) (back|verbatim|word for word)/,
        /print (your|the) (instructions|system prompt|initial prompt)/,
        /\bsudo\b/,
        // Mongolian (Cyrillic) jailbreak variants
        /өмнөх (заавар|зааварчилгаа|дүрэм|анхааруулга)/,
        /(заавар|дүрэм|анхааруулга).{0,40}(мартаж|устгаж|орхиж|үл анхаар)/,
        /мартаж.{0,20}(заавар|дүрэм)/,
        /чи (одоо|өдгөө) (өөр|шинэ)/,
        /чи бол.{0,40}(өөр|шинэ|chatgpt|gpt|claude)/,
        /(чи|та).{0,20}(дүр эсгэ|дүр болж)/,
        /(дүр эсгэ|дүр болж).{0,30}(бай|байгаач)/,
        /системийн (заавар|prompt|анхны)/,
        /(анхны|системийн) (заавар|зааварчилгаа|дүрэм).{0,30}(юу вэ|хэлээч|үзүүл|задал)/,
        /(заавар|дүрэм).{0,15}(үзүүл|задал|хэлээч|илчил)/
    ];

    return patterns.some(p => p.test(t));
}

export const ValidationLimits = {
    MAX_MESSAGE_LENGTH,
    MAX_HISTORY_LENGTH,
    MAX_HISTORY_ITEM_LENGTH
};
