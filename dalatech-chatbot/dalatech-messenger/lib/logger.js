import fetch from 'node-fetch';

const webhookUrl = process.env.LOG_WEBHOOK_URL;

export async function logInteraction(event = {}) {
    const payload = buildPayload(event);

    try {
        console.log('[dalatech-chatbot]', JSON.stringify(payload));
    } catch (error) {
        console.error('Failed to write chatbot log', error);
    }

    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error('Failed to send webhook log', error);
    }
}

function buildPayload(event) {
    return {
        requestId: event.requestId,
        matchCount: event.matchCount ?? (event.matchedProductIds?.length || 0),
        latencyMs: event.latencyMs,
        matchedProductIds: event.matchedProductIds,
        messagePreview: truncate(event.message),
        replyPreview: truncate(event.response),
        error: event.error,
        timestamp: new Date().toISOString()
    };
}

function truncate(text) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= 180) return str;
    return `${str.slice(0, 177)}...`;
}
