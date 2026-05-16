import { randomUUID } from 'node:crypto';
import fetch from 'node-fetch';

import { logInteraction } from '../lib/logger.js';
import { applyCors } from '../lib/cors.js';
import { checkRateLimit, applyRateLimitHeaders } from '../lib/rateLimiter.js';
import { validateMessage, validateHistory, hasSuspiciousPatterns } from '../lib/validator.js';
import { analyticsTracker } from '../lib/analytics.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_TOKENS = 1024;

const CONTACT_NUMBERS = '99273339';
const CONTACT_EMAIL = 'dalatech.ai@gmail.com';
const CONTACT_BLOCK = `Утас: ${CONTACT_NUMBERS}\nИ-мэйл: ${CONTACT_EMAIL}`;

export default async function handler(req, res) {
    const cors = applyCors(req, res, { methods: 'POST,OPTIONS' });

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (!cors.allowed) return res.status(403).json({ error: 'Origin not allowed' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // Rate limiting check
    const rateLimit = checkRateLimit(req, {
        windowMs: 60000, // 1 minute
        maxRequests: 30  // 30 requests per minute
    });
    applyRateLimitHeaders(res, rateLimit);

    if (!rateLimit.allowed) {
        return res.status(429).json({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        });
    }

    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Configuration Error: Missing API Key' });
    }

    const body = coerceBody(req.body);
    const { message = '', history: rawHistory = [] } = parseInput(body);

    // Validate message
    const messageValidation = validateMessage(message);
    if (!messageValidation.valid) {
        return res.status(400).json({ error: messageValidation.error });
    }

    // Check for suspicious patterns
    if (hasSuspiciousPatterns(messageValidation.sanitized)) {
        return res.status(400).json({ error: 'Invalid input detected' });
    }

    // Validate history
    const historyValidation = validateHistory(rawHistory);
    if (!historyValidation.valid) {
        return res.status(400).json({ error: historyValidation.error });
    }

    const sanitizedMessage = messageValidation.sanitized;
    const sanitizedHistory = historyValidation.sanitized;

    const requestId = randomUUID?.() ?? String(Date.now());
    const startedAt = Date.now();

    // Detect intent for analytics
    const intent = analyticsTracker.detectIntent(sanitizedMessage);

    // Check if it's a greeting or asking for contact
    const isGreeting = /^(сайн|байна|уу|hi|hello|hey)/i.test(sanitizedMessage.trim());
    const askingForContact = /(холбогдох|утас|утасны|дугаар|и-?мэйл|email|contact|phone)/i.test(sanitizedMessage);

    // Handle greetings
    if (isGreeting && sanitizedMessage.trim().length < 30 && !sanitizedHistory.length) {
        const greetingResponse = 'Сайн байна уу? 👋 DalaTech.ai-д тавтай морилно уу.\n\nБид таны бизнесийг AI ашиглан автоматжуулж, зардлыг хэмнэнэ.\n\nТа ямар шийдэл сонирхож байна вэ?';
        
        await logInteraction({
            requestId,
            message: sanitizedMessage,
            response: greetingResponse,
            latencyMs: Date.now() - startedAt
        });

        // Track analytics
        analyticsTracker.trackInteraction({
            requestId,
            message: sanitizedMessage,
            response: greetingResponse,
            latencyMs: Date.now() - startedAt,
            intent: 'greeting'
        });
        
        return res.status(200).json({
            reply: greetingResponse,
            matches: []
        });
    }

    // Build system instruction
    let systemInstruction;
    if (askingForContact) {
        systemInstruction = buildContactSystemInstruction(sanitizedMessage);
    } else {
        systemInstruction = buildConversationSystemInstruction(sanitizedMessage);
    }

    // Build Anthropic Claude API payload
    const payload = buildClaudePayload(sanitizedHistory, sanitizedMessage, systemInstruction);

    try {
        const response = await fetch(ANTHROPIC_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': ANTHROPIC_VERSION
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            const errMessage = data?.error?.message || `Claude API error (${response.status})`;
            console.error('Claude API Error:', errMessage);
            await logInteraction({
                requestId,
                message: sanitizedMessage,
                error: errMessage,
                latencyMs: Date.now() - startedAt
            });

            // Track analytics
            analyticsTracker.trackInteraction({
                requestId,
                message: sanitizedMessage,
                error: errMessage,
                latencyMs: Date.now() - startedAt,
                intent
            });

            // Map upstream rate-limit / overload to a graceful client message,
            // never propagate a 401/403 (which would leak our auth state).
            if (response.status === 429 || response.status === 529) {
                return res.status(503).json({
                    error: 'Уучлаарай, систем түр завгүй байна. Та дараа дахин оролдоно уу.'
                });
            }
            return res.status(502).json({ error: 'AI Error' });
        }

        const reply = extractReplyText(data) || 'Уучлаарай, түр зуурын алдаа гарлаа. Та дахин оролдоно уу.';

        await logInteraction({
            requestId,
            message: sanitizedMessage,
            response: reply,
            latencyMs: Date.now() - startedAt
        });

        // Track analytics
        analyticsTracker.trackInteraction({
            requestId,
            message: sanitizedMessage,
            response: reply,
            latencyMs: Date.now() - startedAt,
            intent
        });

        return res.status(200).json({
            reply,
            matches: []
        });
    } catch (error) {
        console.error('Server Error:', error);
        await logInteraction({
            requestId,
            message: sanitizedMessage,
            error: error.message,
            latencyMs: Date.now() - startedAt
        });

        // Track analytics
        analyticsTracker.trackInteraction({
            requestId,
            message: sanitizedMessage,
            error: error.message,
            latencyMs: Date.now() - startedAt,
            intent
        });

        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

function parseInput(body) {
    // Support both new format (message, history) and legacy format (message, previousMessages)
    if (body.message && Array.isArray(body.history)) {
        return {
            message: body.message,
            history: body.history
        };
    }

    if (body.message && Array.isArray(body.previousMessages)) {
        const legacyHistory = body.previousMessages
            .map((msg) => {
                if (!msg?.text) return null;
                const role = msg.sender === 'user' ? 'user' : 'assistant';
                return { role, content: msg.text };
            })
            .filter(Boolean);

        return {
            message: body.message,
            history: legacyHistory
        };
    }

    return { message: body.message || '', history: [] };
}

function coerceBody(body) {
    if (!body) return {};
    if (typeof body === 'object' && !Buffer.isBuffer(body)) return body;

    try {
        const text = Buffer.isBuffer(body) ? body.toString('utf8') : String(body);
        return JSON.parse(text);
    } catch (_) {
        return {};
    }
}

function buildClaudePayload(history = [], message, systemInstruction) {
    const trimmedHistory = history
        .filter((entry) => entry?.content)
        .slice(-10)
        .map((entry) => ({
            role: entry.role === 'assistant' ? 'assistant' : 'user',
            content: String(entry.content)
        }));

    trimmedHistory.push({ role: 'user', content: message });

    return {
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemInstruction,
        messages: trimmedHistory
    };
}

function buildConversationSystemInstruction(userMessage = '') {
    return `Та бол "DalaTech.ai" компанийн Ахлах AI Борлуулалтын Зөвлөх.\n\n` +
        `=== ҮНДСЭН ЗОРИЛГО ===\n` +
        `Таны үндсэн зорилго: Бизнес эзэмшигчидтэй зөвлөлдөж, автоматжуулалтын үнэ цэнийг тайлбарлаж, борлуулалтын гэрээний тулд тэдний утасны дугаарыг авах.\n\n` +
        `=== ДҮРИЙН ОНЦЛОГ ===\n` +
        `- Мэргэжлийн, Албан ёсны, Эелдэг (Корпорат стандарт)\n` +
        `- "Та", "Танд" гэх үг хэрэглэх\n` +
        `- Хэл: Монгол (үндсэн)\n` +
        `- ТОВЧ, ТОДОРХОЙ хариулт өгөх\n\n` +
        `=== БҮТЭЭГДЭХҮҮН & ҮНЭЛГЭЭ ===\n\n` +
        `1. **Smart Website (750,000₮)**\n` +
        `   - Орчин үеийн дизайн, 5 хуудас\n` +
        `   - Mobile Responsive\n` +
        `   - Админ самбар\n\n` +
        `2. **AI Chatbot Setup (195,000₮ - 50% хөнгөлөлт)**\n` +
        `   - Компанийн өгөгдөл дээр сургагдсан\n` +
        `   - 24/7 Автоматаар хариулна\n` +
        `   - *Сарын төлбөр ялгаа:*\n` +
        `     • 100,000₮ (Суурь): Сард 1 удаа өгөгдөл шинэчлэх, чат/имэйл тусламж\n` +
        `     • 200,000₮ (Бизнес): Хязгааргүй шинэчлэлт, утсаар шууд тусламж, долоо хоног бүр нарийвчилсан хяналт\n\n` +
        `3. **AI Receptionist / Voice AI (590,000₮)**\n` +
        `   - 24/7 утасны дуудлагад хариулна\n` +
        `   - Уулзалтын цаг товлох, захиалга авах\n` +
        `   - ⚠️ *Анхааруулга:* Одоогоор хөгжүүлэлтийн явцад байгаа тул төгс биш\n` +
        `   - *Сарын төлбөр ялгаа:*\n` +
        `     • 200,000₮ (Standard): Сард 1 удаа мэдээлэл шинэчлэх, үндсэн тусламж\n` +
        `     • 300,000₮ (Premium): AI сайжруулалт, сар бүрийн нарийвчилсан тайлан, тэргүүн эгнээний тусламж\n\n` +
        `4. **COMBO OFFER (945,000₮)**\n` +
        `   - Smart Website + AI Chatbot Setup\n\n` +
        `=== ТӨЛБӨР & НӨХЦӨЛ ===\n` +
        `- 50% Урьдчилгаа, 50% дууссаны дараа\n` +
        `- Хугацаа: 7-14 ажлын өдөр\n\n` +
        `=== ҮЙЛДЛИЙН ЗААВАР ===\n\n` +
        `**1. ЗОРИЛГО:**\n` +
        `Хэрэглэгч сонирхож байвал: "Та ${CONTACT_EMAIL} хаягт и-мэйл илгээж, ХАРИЛЦАГЧИЙН МЭДЭЭЛЭЛ БҮРДҮҮЛЭХ ХУУДАС-г бөглөж өгнө үү. Манай баг тантай холбогдох болно."\n\n` +
        `**2. ҮНИЙН ЭСЭРГҮҮЦЭЛ:**\n` +
        `"Хүний ажилтан сард 1,000,000₮+ (цалин, даатгал, хоол). AI систем ~200,000₮, 24/7 ажиллана, 80%+ хэмнэлт."\n\n` +
        `**3. ТЕХНИКИЙН АСУУЛТ:**\n` +
        `"Энэ техникийн асуулт байна. Манай ахлах хөгжүүлэгч тантай холбогдож дэлгэрэнгүй хариулна. Та ${CONTACT_EMAIL} руу и-мэйл илгээнэ үү."\n\n` +
        `**4. САРЫН ТӨЛБӨР ЯЛГАА АСУУВАЛ:**\n` +
        `Chatbot: Суурь (100k) - сард 1 шинэчлэлт, чат тусламж. Бизнес (200k) - хязгааргүй шинэчлэлт, утас тусламж, долоо хоног тутмын хяналт.\n` +
        `Receptionist: Standard (200k) - сард 1 шинэчлэлт, үндсэн тусламж. Premium (300k) - AI сайжруулалт, сар бүрийн тайлан, эргэн тойрон дахь тусламж.\n\n` +
        `**5. ХАРИЛЦАГЧИЙН МЭДЭЭЛЭЛ ХУУДАС:**\n` +
        `Хэрэв хэрэглэгч худалдан авах/эхлүүлэхийг хүсвэл:\n` +
        `"${CONTACT_EMAIL} хаягруу дараах мэдээллийг илгээнэ үү:\n\n` +
        `ХАРИЛЦАГЧИЙН МЭДЭЭЛЭЛ:\n` +
        `1. БРЭНДИНГ: Лого (PNG/AI), Өнгө, Зураг\n` +
        `2. AI МЭДЛЭГ: Компанийн танилцуулга, Бүтээгдэхүүний жагсаалт+үнэ, 10 түгээмэл асуулт+хариулт, Холбоо барих мэдээлэл (утас, и-мэйл)\n` +
        `3. ТЕХНИКИЙН ЭРХ: Домэйн нэр (хэрэв байгаа бол)\n` +
        `4. ХАРИЛЦААНЫ ХЭВ: Албан ёсны буюу Найрсаг\n\n` +
        `DalaTech.ai баг"\n\n` +
        `=== ХОЛБОО БАРИХ ===\n${CONTACT_BLOCK}\n\n` +
        `=== ХАРИУЛАХ ДҮРЭМ ===\n` +
        `1. ТОВЧ, ТОДОРХОЙ хариулт өгөх (урт тайлбар бичихгүй)\n` +
        `2. Үнэ, онцлогийг тодорхой хэлэх\n` +
        `3. Үнийн эсэргүүцэлд ROI логик\n` +
        `4. Сонирхож байвал и-мэйл хаягт мэдээлэл илгээлгэх\n` +
        `5. Үнийг мянгатын таслал, ₮ тэмдэгттэй бичих\n`;
}

function buildContactSystemInstruction(userMessage = '') {
    return `Та бол "DalaTech.ai" компанийн AI Борлуулалтын Зөвлөх.\n\n` +
        `=== Холбоо барих мэдээлэл ===\n${CONTACT_BLOCK}\n\n` +
        `=== ДҮРЭМ ===\n` +
        `1. Хэрэглэгч холбоо барих мэдээлэл асууж байна.\n` +
        `2. ТОВЧ, тодорхой хариулт өгнө.\n` +
        `3. Утас: 99273339\n` +
        `4. И-мэйл: dalatech.ai@gmail.com\n`;
}

function extractReplyText(data) {
    if (!Array.isArray(data?.content)) return '';
    return data.content
        .filter((block) => block?.type === 'text')
        .map((block) => block.text || '')
        .join('\n')
        .trim();
}
