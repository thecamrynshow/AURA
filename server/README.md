# PNEUOMA Server

Real-time multiplayer sync + AI companions + authentication + payments for the PNEUOMA platform.

[![Deployed](https://img.shields.io/badge/Deployed-Render-06b6d4)](https://pneuoma-server.onrender.com)
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
- Email/password signup & login
- JWT token-based sessions
- Password hashing with bcryptjs
- Master account support

### 💳 Stripe Payments
- Subscription management (Premium, Family)
- Checkout session creation
- Webhook handling
- 7-day free trials

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
const response = await fetch('https://pneuoma-server.onrender.com/api/companion/chat', {
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
| `/api/auth/signup` | POST | `{ email, password, firstName, lastName }` | Create new account |
| `/api/auth/login` | POST | `{ email, password }` | Login, returns JWT |
| `/api/auth/me` | GET | Header: `Authorization: Bearer <token>` | Get current user |
| `/api/auth/subscription` | POST | `{ subscription }` | Update subscription |
| `/api/auth/forgot-password` | POST | `{ email }` | Request password reset |

### Stripe Payments

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/stripe/create-checkout` | POST | `{ priceId, plan }` | Create Stripe checkout session |
| `/api/stripe/subscription` | GET | Header: `Authorization: Bearer <token>` | Get subscription details |
| `/api/stripe/webhook` | POST | Stripe signature | Handle Stripe webhooks |

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

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# AI Companions (Required for full functionality)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Stripe (Live keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_PREMIUM_PRICE=price_xxx
STRIPE_FAMILY_PRICE=price_xxx

# MeterFlow Usage Tracking (optional — tracks API calls, sessions, active users)
METERFLOW_API_URL=https://signalmeter.onrender.com
METERFLOW_ORG_ID=1e4a956f-3e3d-4a4b-8695-079a17ac95ba
METERFLOW_INGESTION_KEY=your-ingestion-api-key
```

**Note:** If `ANTHROPIC_API_KEY` is not set, AI companions will use intelligent fallback responses.

**Note:** If the `METERFLOW_*` variables are not set, usage tracking is silently disabled — no errors, no impact on request performance.

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
4. Add environment variables (including `ANTHROPIC_API_KEY` and `METERFLOW_*` keys)
5. Deploy

Live URL: `https://pneuoma-server.onrender.com`

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
    const response = await fetch('https://pneuoma-server.onrender.com/api/companion/chat', {
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
const socket = io('https://pneuoma-server.onrender.com');

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
