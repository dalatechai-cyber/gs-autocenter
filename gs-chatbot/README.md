# GS Auto Center · AI Chatbot

Mongolian-language AI assistant for **GS Auto Center** (Гранд Сутай ХХК) — TOYOTA & LEXUS service workshop and JAPAN TOK official distributor.

Built as a standalone Vercel project so it can be deployed independently of the main GS Next.js site and embedded with a single `<script>` tag.

---

## What it knows

The system prompt in `api/chat.js` is loaded with verified GS knowledge:

- **Company** — Гранд Сутай ХХК, founded 2011, rebranded as GS Auto Center in 2025
- **Services** — 6 core areas: inspection/diagnostics, engine repair, suspension repair, electrical, lubrication, OEM parts ordering
- **JAPAN TOK** — official Mongolia distributor since 2019; 2,000+ SKUs; 70+ UB sales points + 10+ aimags
- **Brands serviced** — TOYOTA & LEXUS jeep class (Land Cruiser, Prado, LX, GX, etc.)
- **Standard** — MNS 5025:2010
- **Address** — Улаанбаатар, Баянгол дүүрэг, 3-р хороо, Нарны зам 6/2
- **Hours** — Даваа–Ням, 09:00–19:00
- **Phone** — +976 77-200-570
- **Stats** — 13+ years, 8,000+ customers, 40+ specialists

The bot **always responds in Mongolian**, refuses to fabricate prices, and routes booking / detailed questions to the phone line.

---

## Architecture

```
gs-chatbot/
├── api/                     # Vercel serverless functions
│   ├── chat.js              # POST /api/chat → Claude Haiku 4.5
│   ├── analytics.js         # GET  /api/analytics
│   ├── feedback.js          # POST /api/feedback
│   └── health.js            # GET  /api/health
├── lib/                     # Server-side utilities
│   ├── cors.js              # ALLOWED_ORIGINS env-driven CORS
│   ├── rateLimiter.js       # 30 req/min/IP
│   ├── validator.js         # message + history sanitisation
│   ├── analytics.js         # in-memory intent metrics
│   └── logger.js            # structured logs
├── public/                  # Static landing + embeddable widget
│   ├── index.html           # Full-page chatbot UI (lang=mn)
│   ├── app.js               # Landing-page chat logic
│   ├── custom.css           # GS brand palette (red #DC0D01)
│   ├── widget.js            # Drop-in embed widget
│   ├── react-chat-widget.js # Vite-built React variant
│   └── logo.png             # GS horizontal white logo
├── src/                     # React widget source
│   ├── chat-widget-entry.jsx
│   └── components/ChatWidget.jsx
├── package.json
├── vercel.json
└── README.md
```

**Stack:** Vercel Functions (Node 20) · Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) · Vite + React 19 · Tailwind 3 · vanilla JS for embed.

---

## Deploy to Vercel (one-time setup)

### 1. Create the Vercel project

The `gs-chatbot/` folder lives inside the main GS site repo. Add a separate Vercel project pointing to the same repo, with **Root Directory** set to `gs-chatbot/`.

```bash
cd gs-chatbot
npx vercel link        # creates .vercel/project.json
npx vercel --prod      # first production deploy
```

Or via the dashboard: **New Project → Import Git → set Root Directory = `gs-chatbot`**.

### 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Scope |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production + Preview |
| `ALLOWED_ORIGINS` | `https://gs-autocenter.vercel.app,https://www.gsautocenter.mn` | Production |

> **CORS:** if `ALLOWED_ORIGINS` is empty, the API accepts every origin. Set it once the public chatbot domain is known.

### 3. Verify

After the first deploy, hit:

- `https://YOUR-CHATBOT.vercel.app/` — full-page chat UI
- `https://YOUR-CHATBOT.vercel.app/api/health` — `{ "ok": true }`
- `https://YOUR-CHATBOT.vercel.app/widget.js` — the embed script

Try a few Mongolian prompts:
- *"Та ямар үйлчилгээ үзүүлдэг вэ?"*
- *"JAPAN TOK сэлбэг авмаар байна"*
- *"Та хаана байрладаг вэ?"*
- *"Цаг захиалмаар байна"*

---

## Embedding on the GS site

The GS Next.js site loads the widget via a `<Script>` tag in `src/app/layout.tsx`, controlled by an env var:

```tsx
// src/app/layout.tsx (already wired)
{process.env.NEXT_PUBLIC_CHATBOT_URL ? (
  <Script
    src={`${process.env.NEXT_PUBLIC_CHATBOT_URL}/widget.js`}
    strategy="afterInteractive"
  />
) : null}
```

In the GS site's Vercel project, set:

```
NEXT_PUBLIC_CHATBOT_URL=https://YOUR-CHATBOT.vercel.app
```

…then redeploy the GS site. The widget will appear bottom-right on every page.

To turn the bot off, unset that env var and redeploy. No code changes.

### Embedding on a non-Next.js page

```html
<script async src="https://YOUR-CHATBOT.vercel.app/widget.js"></script>
```

The widget self-mounts after `DOMContentLoaded`. State persists in `localStorage` under the `gs-chat-*` prefix.

---

## Local development

```bash
cd gs-chatbot
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev            # vercel dev (api + static)
```

Open `http://localhost:3000/` for the full-page UI, or any HTML demo under `public/`.

Other scripts:
- `npm run build:react` — bundle React widget to `public/react-chat-widget.js`
- `npm run build:css`   — Tailwind output to `public/styles.css`
- `npm run check`       — Node syntax check on `api/chat.js`, `public/app.js`, `public/widget.js`

---

## Brand tokens

Pulled from the official GS Brand Guideline (`docs/brand-extracted/brand-colors.txt` in the main repo):

| Token | Hex | Role |
| --- | --- | --- |
| Primary red | `#DC0D01` | Signature, CTA, send button |
| Deep maroon | `#5B0702` | Header gradient end |
| Charcoal | `#131313` | Widget background |
| Surface | `#1A1A1A` | Message bubbles, input |
| Off-white | `#F3F3F3` | Body text |
| Muted | `#8A8A8A` | Helper text, placeholders |

Logo: white horizontal mark (`public/logo.png`) — chosen because the widget surface is dark.

---

## Customisation

| Want to change… | Edit |
| --- | --- |
| Bot's knowledge / tone | `api/chat.js` → `buildConversationSystemInstruction()` |
| Greeting message | `api/chat.js` → `greetingResponse` constant |
| Embed widget look | `public/widget.js` → `styles` template literal |
| Landing page look | `public/index.html` + `public/custom.css` |
| Allowed embed origins | Vercel env var `ALLOWED_ORIGINS` |
| Rate limit (default 30/min) | `lib/rateLimiter.js` or `api/chat.js` call site |
| Anthropic model | `api/chat.js` → `ANTHROPIC_MODEL` |

---

## Security notes

- **API key never reaches the browser** — Anthropic calls are made server-side from Vercel Functions.
- **Rate limit** — 30 requests/minute/IP via `lib/rateLimiter.js`. Tune in production if needed.
- **Input validation** — message length, suspicious patterns, and history shape are all checked in `lib/validator.js` before the Anthropic call.
- **CORS** — restrict to known origins via `ALLOWED_ORIGINS` before going public.
- **No PII storage** — analytics is in-memory only; resets on every cold start. No persistent DB.

---

## Contact

Service questions: **+976 77-200-570** · Даваа–Ням 09:00–19:00 · Нарны зам 6/2, Улаанбаатар.
