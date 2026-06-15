# PNEUOMA Server

Real-time multiplayer sync + AI companions + authentication + payments for the PNEUOMA platform.

[![Deployed](https://img.shields.io/badge/Deployed-Render-06b6d4)](https://pneuoma.onrender.com)
[![Node](https://img.shields.io/badge/Node-18%2B-green)]()
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-blue)]()
[![Claude](https://img.shields.io/badge/AI-Claude_3.5-a855f7)]()

## Features

### 🤖 AI Companions (NEW!)

Four therapeutic AI companions powered by Claude 3.5 Sonnet:

| Companion | Endpoint | For |
|-----------|----------|-----|
| 🛡️ **Bully Buddy** | `bully-buddy` | Kids/teens experiencing bullying |
| 🎖️ **Valor** | `valor` | Veterans with PTSD |
| 🌱 **Anchor** | `anchor` | Addiction recovery |
| 🕊️ **Haven** | `haven` | Trauma survivors |

**Features:**
- Context-aware conversations (tracks history)
- Anti-repetition system (never asks same question twice)
- Crisis detection with automatic hotline resources
- Fallback responses when API unavailable
- Stage-based responses (initial → continued → tools)

### 🔗 Real-time Multiplayer
- WebSocket connections via Socket.io
- Session codes for easy joining (e.g., `CALM-1234`)
- Supports 6 multiplayer modes:
  - 🏫 Classroom Sync
  - 👨‍👩‍👧 Parent + Child
  - 💑 Partners
  - 👨‍👩‍👧‍👦 Family Circle
  - 🩺 Therapy Circle
  - 📱 Remote Sync

### 🔐 Authentication
- Email/password signup & login (SQLite-persisted)
- JWT token-based sessions (id/email/role; no stale subscription baked in)
- Password hashing with bcryptjs
- Server-side master **role** (no client-side master password)

### 💳 Stripe Payments
- Subscription management (Premium, Family) — **Stripe is the source of truth**
- Checkout with userId/email/plan metadata + customer reuse
- Signature-verified webhook handling (full lifecycle incl. cancellation & failed payments)
- 7-day free trials
- Authoritative entitlement endpoint (`/api/me/subscription`)

---

## Quick Start

### Local Development

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### Production

```bash
npm start
```

---

## API Endpoints

### Health & Info

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server info + status |
| `/health` | GET | Health check for uptime monitors |
| `/api/sessions` | GET | List active multiplayer sessions |
| `/api/sessions/:code` | GET | Get specific session details |

### AI Companions

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/companion/chat` | POST | `{ companion, message, history }` | Chat with AI companion |

**Example Request:**
```javascript
const response = await fetch('https://pneuoma.onrender.com/api/companion/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        companion: 'bully-buddy', // or 'valor', 'anchor', 'haven'
        message: "I'm being bullied at school",
        history: [
            { role: 'user', content: 'hi' },
            { role: 'companion', content: 'Hey there! 💙' }
        ]
    })
});
const { response: aiResponse, fallback } = await response.json();
```

**Companion IDs:**
- `bully-buddy` — Kids/teens anti-bullying
- `valor` — Veterans PTSD support
- `anchor` — Addiction recovery
- `haven` — Trauma survivors

**Response:**
```json
{
    "response": "That sounds really hard. What happened? 💙",
    "fallback": false
}
```

If `fallback: true`, the response came from local fallback (API unavailable).

### Authentication

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | `{ email, password, firstName, lastName }` | Create new account (DB-backed) |
| `/api/auth/login` | POST | `{ email, password }` | Login, returns JWT |
| `/api/auth/me` | GET | Header: `Authorization: Bearer <token>` | Get current user + entitlement |
| `/api/auth/subscription` | POST | — | **Locked (403).** Plan is Stripe-driven; clients can no longer self-assign. |
| `/api/auth/forgot-password` | POST | `{ email }` | Request password reset (placeholder) |

### Stripe Payments

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/stripe/create-checkout` | POST | `{ priceId, plan }` | Create Stripe checkout session (auth required) |
| `/api/stripe/subscription` | GET | Header: `Authorization: Bearer <token>` | Authoritative entitlement |
| `/api/me/subscription` | GET | Header: `Authorization: Bearer <token>` | Alias of the above |
| `/api/stripe/webhook` | POST | Stripe signature | Verified webhook handler |

**Entitlement response shape:**
```json
{ "isPremium": true, "status": "active", "plan": "premium", "currentPeriodEnd": "2026-07-15T00:00:00.000Z", "cancelAtPeriodEnd": false }
```

### Leads

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/leads` | POST | `{ email, source, page }` | Capture a toolkit/newsletter lead (no auth; rate-limited per IP) |

---

## Stripe Webhook Setup

The webhook **requires a verified signature** (no insecure fallback).

1. In the Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL:
   ```
   https://pneuoma.onrender.com/api/stripe/webhook
   ```
3. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Signing secret** (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` on Render and redeploy.
5. Test locally with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

The webhook route is mounted with `express.raw()` **before** `express.json()`, so the raw body is available for signature verification.

---

## iOS / App Store note

⚠️ **Stripe Checkout here is for WEB subscriptions only.** Apple requires **In-App Purchase (IAP)** for digital subscriptions sold inside an iOS app. Do **not** ship the Capacitor iOS build pointing users to Stripe Checkout for digital goods — implement Apple IAP on that platform before App Store distribution. (This pass intentionally does not implement iOS IAP.)

---

## Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `create_session` | `{ type, name, prefix }` | Create new session (returns code) |
| `join_session` | `{ code, name, role }` | Join existing session |
| `start_exercise` | `{ code, exercise, exerciseData }` | Host starts exercise |
| `stop_exercise` | `{ code }` | Host stops exercise |
| `breath_phase` | `{ code, phase, instruction }` | Sync breath phase to all |
| `update_state` | `{ code, state }` | Update participant state |
| `end_session` | `{ code }` | End session (host only) |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `session_update` | `{ participants, state }` | Session state changed |
| `participant_joined` | `{ id, name, participants }` | Someone joined |
| `participant_left` | `{ id, participants }` | Someone left |
| `exercise_start` | `{ exercise, exerciseData }` | Exercise started |
| `exercise_stop` | `{}` | Exercise stopped |
| `breath_sync` | `{ phase, instruction }` | Breath phase update |
| `session_ended` | `{ message }` | Session ended by host |

---

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://pneuoma.com

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Persistence (SQLite). Point this at a Render Persistent Disk in production,
# otherwise the database is wiped on every deploy/cold start (see below).
SQLITE_DB_PATH=/var/data/pneuoma.db

# AI Companions (Required for full functionality)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Stripe (Live keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# MeterFlow Usage Tracking (optional — tracks API calls, sessions, active users)
METERFLOW_API_URL=https://signalmeter.onrender.com
METERFLOW_ORG_ID=1e4a956f-3e3d-4a4b-8695-079a17ac95ba
METERFLOW_INGESTION_KEY=your-ingestion-api-key
```

### Required in production

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | ✅ for payments | Server-side Stripe API key (never exposed to frontend) |
| `STRIPE_WEBHOOK_SECRET` | ✅ for payments | Verifies webhook signatures. **The webhook refuses to process events if this is missing — there is no insecure fallback.** |
| `JWT_SECRET` | ✅ | Signs auth tokens (a warning is logged if unset in production) |
| `SQLITE_DB_PATH` | ✅ for durable data | Path to the SQLite file; must live on a persistent disk |
| `FRONTEND_URL` | recommended | Used for Stripe `success_url`/`cancel_url` (defaults to request origin, then `https://pneuoma.com`) |

**Note:** If `ANTHROPIC_API_KEY` is not set, AI companions will use intelligent fallback responses.

**Note:** If the `METERFLOW_*` variables are not set, usage tracking is silently disabled — no errors, no impact on request performance.

**Note:** Price IDs are mapped to plan names in `index.js` (`PRICE_TO_PLAN`). Keep this in sync with `auth/subscribe.html`.

---

## Database & Persistence

Users, subscriptions, and leads are stored in **SQLite** via `better-sqlite3` (see `db.js`). Stripe is the **source of truth** for subscription status; the DB caches the latest Stripe state, updated by verified webhooks.

> ⚠️ **Render's default filesystem is ephemeral.** It is wiped on every deploy and on cold start. Without durable storage, all accounts and subscriptions are lost on restart. You **must** do one of:
> 1. **Attach a Render Persistent Disk** (e.g. mount at `/var/data`) and set `SQLITE_DB_PATH=/var/data/pneuoma.db`, **or**
> 2. **Migrate to Render Postgres** (recommended at scale). `db.js` is the single storage seam — swapping it for Postgres only touches that one file.

**Tables:** `users`, `subscriptions`, `leads`. Subscription period fields are stored as epoch seconds (matching Stripe); account timestamps are epoch ms.

**Valid premium statuses:** `active`, `trialing`. Any other status (`canceled`, `past_due`, `unpaid`, `incomplete`, `incomplete_expired`, `paused`) does **not** grant premium access.

---

## AI Companion System

### System Prompts

Each companion has a detailed system prompt that includes:
- Personality traits
- Capabilities and tools
- Critical safety rules
- Crisis detection keywords
- **CONVERSATION_RULES** — Anti-repetition directives

### Anti-Repetition System

The server tracks conversation history and:
1. Identifies questions already asked
2. Identifies topics already covered
3. Sends this context to Claude with explicit "DO NOT REPEAT" instructions
4. Uses temperature=0.8 for response variety

### Crisis Detection

All companions detect crisis keywords and respond with appropriate hotlines:

| Companion | Crisis Hotlines |
|-----------|----------------|
| Bully Buddy | 988, Crisis Text Line 741741 |
| Valor | Veterans Crisis Line 1-800-273-8255 (Press 1) |
| Anchor | SAMHSA 1-800-662-4357, 988 |
| Haven | 988, Domestic Violence 1-800-799-7233, RAINN 1-800-656-4673 |

### Fallback Responses

When API is unavailable, companions use:
- Stage-based responses (initial, continued, tools)
- Multiple response options per stage
- History-aware selection (won't repeat last response)
- Companion-specific voice and tools

---

## Deployment

### Render (Currently Used)

1. Connect GitHub repo to [render.com](https://render.com)
2. Create new Web Service
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18+
4. **Attach a Persistent Disk** (Settings → Disks): e.g. mount path `/var/data`, then set `SQLITE_DB_PATH=/var/data/pneuoma.db`. Without this, the SQLite DB (users + subscriptions) is wiped on every deploy/cold start. *(Alternatively, migrate `db.js` to Render Postgres.)*
5. Add environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `SQLITE_DB_PATH`, `FRONTEND_URL`, `NODE_ENV=production`, plus `ANTHROPIC_API_KEY` and `METERFLOW_*`.
6. Add the Stripe webhook endpoint (see **Stripe Webhook Setup** above).
7. Deploy

Live URL: `https://pneuoma.onrender.com`

### MeterFlow Integration

The server automatically sends usage events to [MeterFlow](https://signalmeter.onrender.com) (our usage metering platform) when the `METERFLOW_*` env vars are set.

**What gets tracked:**

| Event | Trigger | Meter |
|-------|---------|-------|
| API calls | Every `/api/*` request (middleware) | `api_calls` |
| Active users | User login (deduplicated per user per day) | `active_users` |
| Sessions | Multiplayer session created (Socket.io) | `sessions_played` |
| Multiplayer | Multiplayer session created (Socket.io) | `multiplayer_sessions` |

Tracking is fire-and-forget — failures are logged but never block the response. The SDK lives at `server/meterflow-client.js`.

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### DigitalOcean App Platform

1. Create app from GitHub
2. Set source directory to `/server`
3. Add environment variables
4. Deploy

---

## Frontend Integration

### AI Companion Integration

```javascript
// Chat with a companion
async function chat(companion, message, history) {
    const response = await fetch('https://pneuoma.onrender.com/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companion, message, history })
    });
    return await response.json();
}

// Example usage
const history = [];

// User sends message
history.push({ role: 'user', content: "I'm being bullied at school" });
const { response } = await chat('bully-buddy', "I'm being bullied at school", history);
history.push({ role: 'companion', content: response });

// Continue conversation
history.push({ role: 'user', content: "They posted about me on Snapchat" });
const { response: response2 } = await chat('bully-buddy', "They posted about me on Snapchat", history);
// AI will acknowledge the specific Snapchat mention and not repeat previous questions
```

### Socket.io Integration

```javascript
const socket = io('https://pneuoma.onrender.com');

// Create session (host)
socket.emit('create_session', { 
    type: 'classroom', 
    name: 'Ms. Johnson',
    prefix: 'CALM'
}, (response) => {
    console.log('Session code:', response.code);
});

// Join session (participant)
socket.emit('join_session', { 
    code: 'CALM-1234', 
    name: 'Alex'
}, (response) => {
    if (response.success) console.log('Joined!');
});

// Listen for breath sync
socket.on('breath_sync', ({ phase, instruction }) => {
    updateUI(phase, instruction);
});
```

---

## Testing

```bash
# Run with auto-reload
npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Test AI companion
curl -X POST http://localhost:3001/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{"companion":"bully-buddy","message":"hi","history":[]}'
```

---

## License

Part of the PNEUOMA platform. Proprietary.

For inquiries: camrynjackson@pneuoma.com
