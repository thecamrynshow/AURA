# PNEUOMA Sync Server

Real-time multiplayer sync server for PNEUOMA classroom, family, and therapy sessions.

## Features

- 🔗 **Real-time sync** across any device via WebSockets
- 🏫 **Classroom Sync** - Teacher leads, students follow
- 👨‍👩‍👧 **Family Circle** - Family regulation together
- 💑 **Partners** - Couples co-regulation
- 🩺 **Therapy Circle** - Group therapy sessions
- 📱 **Cross-device** - Works on phones, tablets, laptops

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

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server info |
| `/health` | GET | Health check |
| `/api/sessions` | GET | List active sessions |
| `/api/sessions/:code` | GET | Get session details |

## Socket.io Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `create_session` | `{ type, name, prefix }` | Create new session |
| `join_session` | `{ code, name, role }` | Join existing session |
| `start_exercise` | `{ code, exercise, exerciseData }` | Host starts exercise |
| `stop_exercise` | `{ code }` | Host stops exercise |
| `breath_phase` | `{ code, phase, instruction }` | Sync breath phase |
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
| `session_ended` | `{ message }` | Session ended |

## Deployment Options

### Railway (Recommended)
1. Create account at [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy the `/server` directory
4. Set `PORT` environment variable if needed

### Render
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect repo
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`

### Heroku
```bash
cd server
heroku create pneuoma-sync
git subtree push --prefix server heroku main
```

### DigitalOcean App Platform
1. Create app from GitHub
2. Set source directory to `/server`
3. Deploy

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |

## Frontend Integration

Add Socket.io client to your HTML:

```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
```

Connect in JavaScript:

```javascript
const socket = io('https://your-server-url.com');

// Create session (host)
socket.emit('create_session', { 
    type: 'classroom', 
    name: 'Teacher Name' 
}, (response) => {
    console.log('Session code:', response.code);
});

// Join session (participant)
socket.emit('join_session', { 
    code: 'CALM-1234', 
    name: 'Student Name' 
}, (response) => {
    if (response.success) {
        console.log('Joined!');
    }
});

// Listen for exercises
socket.on('exercise_start', (data) => {
    console.log('Exercise started:', data.exercise);
});
```

## License

Part of the PNEUOMA platform.


