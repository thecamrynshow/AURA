# PNEUOMA Server

Real-time multiplayer sync server + authentication + payments for the PNEUOMA platform.

[![Deployed](https://img.shields.io/badge/Deployed-Render-06b6d4)](https://pneuoma.onrender.com)
[![Node](https://img.shields.io/badge/Node-18%2B-green)]()
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-blue)]()

## Features

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

### Authentication

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | `{ email, password }` | Create new account |
| `/api/auth/login` | POST | `{ email, password }` | Login, returns JWT |
| `/api/auth/subscription` | GET | Header: `Authorization: Bearer <token>` | Get subscription status |

### Stripe Payments

| Endpoint | Method | Body | Description |
|----------|--------|------|-------------|
| `/api/stripe/create-checkout` | POST | `{ priceId, email }` | Create Stripe checkout session |
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
| `session_created` | `{ code, sessionId }` | Session created successfully |
| `session_joined` | `{ sessionId, participants }` | Joined session |
| `session_update` | `{ participants, state }` | Session state changed |
| `participant_joined` | `{ id, name, participants }` | Someone joined |
| `participant_left` | `{ id, participants }` | Someone left |
| `exercise_start` | `{ exercise, exerciseData }` | Exercise started |
| `exercise_stop` | `{}` | Exercise stopped |
| `breath_sync` | `{ phase, instruction }` | Breath phase update |
| `session_ended` | `{ message }` | Session ended by host |
| `error` | `{ message }` | Error occurred |

---

## Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=3001

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this

# Master Account (full access)
MASTER_EMAIL=camrynjackson@pneuoma.com

# Stripe (Live keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_PREMIUM_PRICE=price_1SlVBM2MMMhk8Zv1PhNtRqdJ
STRIPE_FAMILY_PRICE=price_1SlVC22MMMhk8Zv1PRzVTRkw
```

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
4. Add environment variables
5. Deploy

Live URL: `https://pneuoma.onrender.com`

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Heroku

```bash
cd server
heroku create pneuoma-server
git subtree push --prefix server heroku main
```

### DigitalOcean App Platform

1. Create app from GitHub
2. Set source directory to `/server`
3. Add environment variables
4. Deploy

---

## Frontend Integration

### Add Socket.io Client

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

### Connect and Use

```javascript
// Connect to server
const socket = io('https://pneuoma.onrender.com');

// Create session (host/teacher)
socket.emit('create_session', { 
    type: 'classroom', 
    name: 'Ms. Johnson',
    prefix: 'CALM'
}, (response) => {
    if (response.success) {
        console.log('Session code:', response.code); // e.g., CALM-1234
    }
});

// Join session (student/participant)
socket.emit('join_session', { 
    code: 'CALM-1234', 
    name: 'Alex',
    role: 'student'
}, (response) => {
    if (response.success) {
        console.log('Joined session!');
    } else {
        console.error(response.message);
    }
});

// Listen for exercises
socket.on('exercise_start', (data) => {
    console.log('Starting:', data.exercise);
    startBreathingExercise(data.exerciseData);
});

// Listen for breath sync
socket.on('breath_sync', (data) => {
    updateBreathUI(data.phase, data.instruction);
});

// Listen for participants
socket.on('participant_joined', (data) => {
    console.log(`${data.name} joined! Total: ${data.participants.length}`);
});
```

### Authentication Example

```javascript
// Signup
const response = await fetch('https://pneuoma.onrender.com/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'secure123' })
});
const { token, user } = await response.json();
localStorage.setItem('pneuoma_token', token);

// Check subscription
const subResponse = await fetch('https://pneuoma.onrender.com/api/auth/subscription', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const { subscription, isPremium } = await subResponse.json();
```

---

## Session Management

Sessions are automatically cleaned up:
- Empty sessions removed after 5 minutes
- Inactive sessions removed after 2 hours
- When host disconnects, session ends

Session codes are 4-digit numbers with optional prefix:
- Default: `SESS-1234`
- Classroom: `CALM-5678`
- Family: `FAM-9012`

---

## Error Handling

All errors return consistent format:

```json
{
    "success": false,
    "message": "Session not found"
}
```

Common errors:
- `Session not found` — Invalid or expired code
- `Session is full` — Max participants reached
- `Not authorized` — Invalid or missing JWT
- `Invalid credentials` — Wrong email/password

---

## Testing

```bash
# Run with auto-reload
npm run dev

# Test health endpoint
curl http://localhost:3001/health

# Test WebSocket (use browser console or wscat)
wscat -c ws://localhost:3001
```

---

## License

Part of the PNEUOMA platform. Proprietary.

For inquiries: camrynjackson@pneuoma.com
