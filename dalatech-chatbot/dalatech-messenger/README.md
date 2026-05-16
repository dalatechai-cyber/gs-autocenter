# DalaTech.ai AI Sales Consultant Chatbot

Professional AI-powered sales consultant chatbot for DalaTech.ai, powered by Google Gemini AI.

## ✨ Quick Embed - Add to Any Website

Add the DalaTech.ai chatbot to your website in seconds! Just paste this code before the closing `</body>` tag:

```html
<!-- DalaTech.ai Chatbot Widget -->
<button id="dalatech-chat-toggle" aria-label="Open chat"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%); border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; overflow: hidden; padding: 0; transition: transform 0.3s ease, box-shadow 0.2s; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #ECECEC;">
  💬
</button>
<div id="dalatech-chatbot-container"
  style="display: none; position: fixed; bottom: 90px; right: 20px; width: 400px; height: 600px; max-height: 80vh; background: #1F1F1F; border-radius: 16px; box-shadow: 0 5px 40px rgba(0,0,0,0.5); z-index: 99999; overflow: hidden; border: 1px solid #333;">
  <iframe src="https://dalatech-chatbot.vercel.app" width="100%" height="100%" frameborder="0" title="DalaTech.ai Chatbot"></iframe>
</div>
<style>
  #dalatech-chat-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }
  @media (max-width: 480px) {
    #dalatech-chatbot-container {
      width: calc(100% - 32px) !important;
      height: 70vh !important;
      bottom: 90px !important;
      right: 16px !important;
    }
  }
</style>
<script>
(function(){const c=document.getElementById('dalatech-chatbot-container'),b=document.getElementById('dalatech-chat-toggle');if(!c||!b)return;b.addEventListener('click',()=>{const h=c.style.display==='none'||c.style.display==='';c.style.display=h?'block':'none';b.style.transform=h?'rotate(45deg)':'rotate(0deg)';b.setAttribute('aria-expanded',h?'true':'false');});})();
</script>
```

📖 **Full Installation Guide:** See [EMBED_GUIDE.md](EMBED_GUIDE.md) for detailed instructions and customization options.

## Features

- 🤖 **Google Gemini AI Integration** - Advanced natural language understanding
- 💼 **B2B Sales Consultant** - Professional business consultant persona
- 🇲🇳 **Mongolian Language Support** - Full native language support with formal tone
- 💰 **Smart Pricing & ROI Logic** - Automatic pricing info and objection handling
- 📱 **Responsive Design** - Mobile and desktop optimized
- 🔒 **Secure Backend** - API keys protected, CORS enabled
- ⚡ **Fast Performance** - Optimized AI responses
- 🌐 **Easy Embedding** - Multiple integration options (iframe widget & React component)
- 📞 **Lead Capture** - Collects email addresses for sales follow-up
- 🎯 **Smart Intent Detection** - Handles technical questions, price objections, and sales inquiries

### 🆕 Professional Features (v1.1.0)

- 🛡️ **Rate Limiting** - 30 requests/minute protection against abuse
- ✅ **Input Validation** - XSS prevention and sanitization
- 📊 **Analytics Dashboard** - Track conversations, intents, and satisfaction
- 💚 **Health Monitoring** - System health checks and uptime tracking
- ⭐ **Feedback System** - Customer satisfaction ratings
- 🔄 **Auto-Retry Logic** - Reliable error handling with exponential backoff
- 🗑️ **Clear Chat** - One-click conversation reset
- 🚀 **Quick Replies** - One-click common queries
- 📖 **Privacy Policy** - GDPR-compliant data handling
- 📈 **Professional Documentation** - Complete deployment and maintenance guides

## Products & Services

1. **Smart Website (750,000₮)**
   - Modern design, 5 core pages
   - Mobile Responsive
   - Admin panel included

2. **AI Chatbot Setup (PROMO: 195,000₮ - 50% OFF)**
   - Trained on company data
   - 24/7 Auto-reply
   - Monthly Fee Comparison:
     * 100,000₮ (Basic): Data updates 1x/month, chat/email support
     * 200,000₮ (Growth): Unlimited updates, priority phone support, weekly monitoring

3. **AI Receptionist / Voice AI (590,000₮)**
   - Answers phone calls 24/7
   - Handles appointment booking & scheduling
   - Trained on company voice data
   - ⚠️ **Note:** Currently in development - not perfect yet
   - Monthly Fee Comparison:
     * 200,000₮ (Standard): Data updates 1x/month, basic support
     * 300,000₮ (Premium): AI fine-tuning, monthly analytics, priority support

4. **COMBO OFFER (945,000₮ - Best Value)**
   - Includes: Smart Website + AI Chatbot Setup

## Quick Start

### 1. Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dalatech-chatbot.git
cd dalatech-chatbot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Run locally with Vercel CLI
npm install -g vercel
vercel dev
```

### 2. Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/dalatech-chatbot.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `GEMINI_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com/app/apikeys)
     - `GOOGLE_SHEET_URL` - Your Google Sheet CSV export URL
   - Redeploy from Deployments tab

4. **Done!** Your chatbot is live at `https://your-project.vercel.app`

## Embedding Options

DalaTech.ai chatbot offers multiple embedding options to suit your needs:

### 1. **Iframe Widget (Recommended for Most Websites)**

Simple copy-paste solution with no dependencies. Perfect for WordPress, Shopify, HTML sites, etc.

```html
<!-- Just paste before </body> tag -->
<button id="dalatech-chat-toggle" aria-label="Open chat"...>💬</button>
<div id="dalatech-chatbot-container">
  <iframe src="https://your-project.vercel.app"></iframe>
</div>
<script>/* Toggle functionality */</script>
```

- ✅ Works on any website
- ✅ No JavaScript framework required
- ✅ Isolated environment, no conflicts
- ✅ Fully customizable styles

📖 **Full Guide:** [EMBED_GUIDE.md](EMBED_GUIDE.md)  
🎮 **Live Demo:** `/embed-demo.html`

### 2. **Vanilla JavaScript Widget**

Dynamic injection via external script (existing widget.js):

```html
<script
  async
  src="https://your-project.vercel.app/widget.js"
  data-dalatech-widget
  data-api-origin="https://your-project.vercel.app"
></script>
```

- ✅ Single line of code
- ✅ Auto-initializes
- ✅ Persistent chat history

### 3. **React Component**

For React/Next.js applications:

```bash
npm run build:react
```

Then import the component:

```jsx
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <>
      {/* Your app content */}
      <ChatWidget />
    </>
  );
}
```

- ✅ React hooks & state management
- ✅ Full TypeScript support ready
- ✅ Customizable via props
- ✅ Built with Vite

**Files:**
- Component: `src/components/ChatWidget.jsx`
- Entry: `src/chat-widget-entry.jsx`
- Build: `npm run build:react`

The chatbot button will appear in the bottom-right corner.

## Project Structure

```
dalatech-chatbot/
├── api/
│   ├── chat.js           # AI chat endpoint
│   └── sheet.js          # Product data endpoint
├── lib/
│   ├── cors.js           # CORS configuration
│   ├── logger.js         # Logging utilities
│   └── products.js       # Product search & formatting
├── public/
│   ├── index.html        # Main chatbot interface
│   ├── app.js            # Frontend application logic
│   ├── custom.css        # Custom styles
│   └── widget.js         # Embeddable widget
├── .env.example          # Environment variables template
├── package.json          # Dependencies
└── vercel.json           # Vercel configuration
```

## API Endpoints

### POST `/api/chat`
Chat with the AI assistant.

**Request:**
```json
{
  "message": "Үнэ хэд вэ?",
  "history": []
}
```

**Response:**
```json
{
  "reply": "AI Chatbot Setup нь 195,000₮ (50% хөнгөлөлт)..."
}
```

**Rate Limit:** 30 requests per minute per IP

### GET `/api/analytics`
Get chatbot usage analytics and metrics.

**Response:**
```json
{
  "overview": {
    "totalConversations": 150,
    "totalMessages": 450,
    "successRate": "98.5%",
    "averageResponseTime": "1234ms"
  },
  "intents": {
    "pricing": 45,
    "technical": 12,
    "purchase_intent": 28
  }
}
```

### GET `/api/health`
System health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "latency": "45ms",
  "uptime": "86400s",
  "checks": {
    "geminiApiKey": "configured",
    "api": "operational"
  }
}
```

### POST `/api/feedback`
Submit customer satisfaction rating.

**Request:**
```json
{
  "rating": 5,
  "feedback": "Маш сайн!"
}
```

**Rate Limit:** 10 requests per 5 minutes

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikeys) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins for security |
| `LOG_WEBHOOK_URL` | No | Webhook URL for external logging (optional) |

## Professional Features

### Security & Protection
- ✅ **Rate Limiting**: 30 req/min for chat, 10 req/5min for feedback
- ✅ **Input Validation**: Max 2000 chars, XSS prevention
- ✅ **Sanitization**: Control character removal, malicious pattern detection
- ✅ **CORS**: Configurable allowed origins

### Monitoring & Analytics
- ✅ **Analytics API**: Track conversations, intents, satisfaction
- ✅ **Health Check**: System monitoring endpoint
- ✅ **Request Logging**: All interactions logged with request IDs
- ✅ **Performance Metrics**: Success rates, response times

### User Experience
- ✅ **Error Handling**: Auto-retry with exponential backoff
- ✅ **Clear Chat**: One-click conversation reset
- ✅ **Quick Replies**: Common query buttons
- ✅ **Persistent History**: LocalStorage with 20-message limit

### Documentation
- 📖 [Professional Features Guide](PROFESSIONAL_FEATURES.md)
- 📖 [Privacy Policy](PRIVACY_POLICY.md)
- 📖 [Production Readiness Checklist](PRODUCTION_READINESS.md)





## Security

✅ API keys stored securely in environment variables  
✅ `.env` excluded from version control  
✅ HTTPS enforced on Vercel  
✅ CORS configured for specific origins  
✅ No sensitive data in client-side code  

## Updating Your Deployment

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
# Vercel automatically redeploys
```



## Support & Contact

For issues or questions:
- Create an issue in this repository
- Contact: 99273339
- Email: dalatech.ai@gmail.com

## License

This project is private and proprietary to DalaTech.ai.

