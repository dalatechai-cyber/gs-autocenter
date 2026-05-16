// Analytics and metrics tracking for chatbot interactions

/**
 * Track conversation metrics
 */
class AnalyticsTracker {
    constructor() {
        this.metrics = {
            totalConversations: 0,
            totalMessages: 0,
            averageResponseTime: 0,
            errorCount: 0,
            successCount: 0,
            intentCategories: {},
            customerSatisfaction: []
        };
    }

    /**
     * Track a chat interaction
     */
    trackInteraction(data) {
        const {
            requestId,
            message,
            response,
            latencyMs,
            error,
            intent = 'general'
        } = data;

        if (error) {
            this.metrics.errorCount++;
        } else {
            this.metrics.successCount++;
        }

        this.metrics.totalMessages++;
        
        // Update average response time
        const currentTotal = this.metrics.averageResponseTime * (this.metrics.totalMessages - 1);
        this.metrics.averageResponseTime = (currentTotal + latencyMs) / this.metrics.totalMessages;
        
        // Track intent categories
        if (intent) {
            this.metrics.intentCategories[intent] = (this.metrics.intentCategories[intent] || 0) + 1;
        }

        return {
            tracked: true,
            requestId,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Track a new conversation start
     */
    trackConversationStart(sessionId) {
        this.metrics.totalConversations++;
        return {
            sessionId,
            startedAt: new Date().toISOString()
        };
    }

    /**
     * Track customer satisfaction rating
     */
    trackSatisfaction(rating, feedback = '') {
        this.metrics.customerSatisfaction.push({
            rating,
            feedback,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Detect intent from user message
     */
    detectIntent(message) {
        const lowercaseMsg = message.toLowerCase();
        
        // Price inquiry
        if (/үнэ|төлбөр|хэд|price|cost/i.test(message)) {
            return 'pricing';
        }
        
        // Technical questions
        if (/backend|код|программ|технологи|хэрэгжүүлэлт/i.test(message)) {
            return 'technical';
        }
        
        // Purchase intent
        if (/авъя|худалдаж|захиалах|эхлүүл|buy|purchase/i.test(message)) {
            return 'purchase_intent';
        }
        
        // Contact request
        if (/холбогдох|утас|и-?мэйл|contact|phone/i.test(message)) {
            return 'contact_request';
        }
        
        // Product inquiry
        if (/(chatbot|website|receptionist|ai|вебсайт|чатбот)/i.test(message)) {
            return 'product_inquiry';
        }
        
        // Greeting
        if (/^(сайн|байна|уу|hi|hello|hey)/i.test(lowercaseMsg) && message.length < 30) {
            return 'greeting';
        }
        
        return 'general';
    }

    /**
     * Get analytics summary
     */
    getSummary() {
        const successRate = this.metrics.totalMessages > 0
            ? ((this.metrics.successCount / this.metrics.totalMessages) * 100).toFixed(2)
            : 0;

        const avgSatisfaction = this.metrics.customerSatisfaction.length > 0
            ? (this.metrics.customerSatisfaction.reduce((sum, item) => sum + item.rating, 0) / 
               this.metrics.customerSatisfaction.length).toFixed(2)
            : null;

        return {
            overview: {
                totalConversations: this.metrics.totalConversations,
                totalMessages: this.metrics.totalMessages,
                successRate: `${successRate}%`,
                errorCount: this.metrics.errorCount,
                averageResponseTime: `${Math.round(this.metrics.averageResponseTime)}ms`
            },
            intents: this.metrics.intentCategories,
            satisfaction: {
                averageRating: avgSatisfaction,
                totalRatings: this.metrics.customerSatisfaction.length,
                recent: this.metrics.customerSatisfaction.slice(-10)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            totalConversations: 0,
            totalMessages: 0,
            averageResponseTime: 0,
            errorCount: 0,
            successCount: 0,
            intentCategories: {},
            customerSatisfaction: []
        };
    }
}

// Singleton instance
const analyticsTracker = new AnalyticsTracker();

export { analyticsTracker };
