/**
 * PNEUOMA Sync Server
 * Real-time multiplayer sync for classroom, family, and therapy sessions
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:8080',
            'http://localhost:8888',
            'http://localhost:3000',
            'https://pneuoma.com',
            'https://www.pneuoma.com',
            'https://thecamrynshow.github.io'
        ],
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// ==================== SESSION STORAGE ====================

const sessions = new Map();

class Session {
    constructor(code, type, hostId) {
        this.code = code;
        this.type = type; // 'classroom', 'family', 'therapy', 'partners', 'parent-child'
        this.hostId = hostId;
        this.participants = new Map();
        this.state = {
            active: true,
            exercise: null,
            exerciseData: null,
            breathPhase: null,
            startTime: Date.now()
        };
        this.createdAt = Date.now();
    }

    addParticipant(socketId, data) {
        this.participants.set(socketId, {
            id: socketId,
            name: data.name || 'Anonymous',
            role: data.role || 'participant',
            state: 'ready',
            joinedAt: Date.now()
        });
    }

    removeParticipant(socketId) {
        this.participants.delete(socketId);
    }

    getParticipantCount() {
        return this.participants.size;
    }

    isHost(socketId) {
        return this.hostId === socketId;
    }
}

// ==================== UTILITY FUNCTIONS ====================

function generateSessionCode(prefix = 'SYNC') {
    const prefixes = ['CALM', 'HEAL', 'SYNC', 'FLOW', 'ZONE', 'RISE'];
    const word = prefix || prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${word}-${num}`;
}

function cleanupSessions() {
    const now = Date.now();
    const maxAge = 4 * 60 * 60 * 1000; // 4 hours

    for (const [code, session] of sessions) {
        if (now - session.createdAt > maxAge || session.participants.size === 0) {
            sessions.delete(code);
            console.log(`🧹 Cleaned up session: ${code}`);
        }
    }
}

// Run cleanup every 30 minutes
setInterval(cleanupSessions, 30 * 60 * 1000);

// ==================== API ROUTES ====================

app.get('/', (req, res) => {
    res.json({
        name: 'PNEUOMA Sync Server',
        version: '1.0.0',
        status: 'running',
        activeSessions: sessions.size,
        endpoints: {
            health: '/health',
            sessions: '/api/sessions'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/sessions', (req, res) => {
    const sessionList = Array.from(sessions.values()).map(s => ({
        code: s.code,
        type: s.type,
        participants: s.getParticipantCount(),
        active: s.state.active,
        createdAt: s.createdAt
    }));
    res.json(sessionList);
});

app.get('/api/sessions/:code', (req, res) => {
    const session = sessions.get(req.params.code.toUpperCase());
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
        code: session.code,
        type: session.type,
        participants: session.getParticipantCount(),
        state: session.state
    });
});

// ==================== SOCKET.IO HANDLERS ====================

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ========== CREATE SESSION ==========
    socket.on('create_session', (data, callback) => {
        const { type, name, prefix } = data;
        const code = generateSessionCode(prefix);
        
        const session = new Session(code, type || 'general', socket.id);
        session.addParticipant(socket.id, { name, role: 'host' });
        
        sessions.set(code, session);
        socket.join(code);
        
        console.log(`✨ Session created: ${code} by ${name || socket.id}`);
        
        if (callback) {
            callback({ success: true, code, session: session.state });
        }
        
        // Notify room of update
        io.to(code).emit('session_update', {
            participants: session.getParticipantCount(),
            state: session.state
        });
    });

    // ========== JOIN SESSION ==========
    socket.on('join_session', (data, callback) => {
        const { code, name, role } = data;
        const sessionCode = code.toUpperCase();
        const session = sessions.get(sessionCode);
        
        if (!session) {
            if (callback) {
                callback({ success: false, error: 'Session not found' });
            }
            return;
        }
        
        if (!session.state.active) {
            if (callback) {
                callback({ success: false, error: 'Session has ended' });
            }
            return;
        }
        
        session.addParticipant(socket.id, { name, role: role || 'participant' });
        socket.join(sessionCode);
        
        console.log(`👋 ${name || socket.id} joined session: ${sessionCode}`);
        
        if (callback) {
            callback({ 
                success: true, 
                code: sessionCode,
                session: session.state,
                participants: session.getParticipantCount()
            });
        }
        
        // Notify everyone in the room
        io.to(sessionCode).emit('participant_joined', {
            participantId: socket.id,
            name: name || 'Anonymous',
            participants: session.getParticipantCount()
        });
        
        io.to(sessionCode).emit('session_update', {
            participants: session.getParticipantCount(),
            state: session.state
        });
    });

    // ========== EXERCISE CONTROL ==========
    socket.on('start_exercise', (data) => {
        const { code, exercise, exerciseData } = data;
        const session = sessions.get(code);
        
        if (!session || !session.isHost(socket.id)) {
            return;
        }
        
        session.state.exercise = exercise;
        session.state.exerciseData = exerciseData;
        session.state.exerciseStartTime = Date.now();
        
        console.log(`🏃 Exercise started in ${code}: ${exercise}`);
        
        io.to(code).emit('exercise_start', {
            exercise,
            exerciseData,
            startTime: session.state.exerciseStartTime
        });
    });

    socket.on('stop_exercise', (data) => {
        const { code } = data;
        const session = sessions.get(code);
        
        if (!session || !session.isHost(socket.id)) {
            return;
        }
        
        session.state.exercise = null;
        session.state.exerciseData = null;
        
        console.log(`⏹️ Exercise stopped in ${code}`);
        
        io.to(code).emit('exercise_stop', {});
    });

    // ========== BREATH SYNC ==========
    socket.on('breath_phase', (data) => {
        const { code, phase, instruction } = data;
        const session = sessions.get(code);
        
        if (!session || !session.isHost(socket.id)) {
            return;
        }
        
        session.state.breathPhase = { phase, instruction };
        
        io.to(code).emit('breath_sync', { phase, instruction });
    });

    // ========== PARTICIPANT STATE ==========
    socket.on('update_state', (data) => {
        const { code, state } = data;
        const session = sessions.get(code);
        
        if (!session) return;
        
        const participant = session.participants.get(socket.id);
        if (participant) {
            participant.state = state;
            
            // Notify host of state change
            io.to(session.hostId).emit('participant_state', {
                id: socket.id,
                name: participant.name,
                state
            });
        }
    });

    // ========== END SESSION ==========
    socket.on('end_session', (data) => {
        const { code } = data;
        const session = sessions.get(code);
        
        if (!session || !session.isHost(socket.id)) {
            return;
        }
        
        session.state.active = false;
        
        console.log(`🔚 Session ended: ${code}`);
        
        io.to(code).emit('session_ended', {
            message: 'The session has ended. Thanks for participating!'
        });
        
        // Remove session after a delay
        setTimeout(() => {
            sessions.delete(code);
        }, 5000);
    });

    // ========== GENERIC MESSAGE ==========
    socket.on('broadcast', (data) => {
        const { code, event, payload } = data;
        const session = sessions.get(code);
        
        if (!session) return;
        
        io.to(code).emit(event, payload);
    });

    // ========== DISCONNECT ==========
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        // Remove from all sessions
        for (const [code, session] of sessions) {
            if (session.participants.has(socket.id)) {
                const participant = session.participants.get(socket.id);
                const wasHost = session.isHost(socket.id);
                session.removeParticipant(socket.id);
                
                io.to(code).emit('participant_left', {
                    participantId: socket.id,
                    name: participant?.name || 'Anonymous',
                    participants: session.getParticipantCount()
                });
                
                // If host left, end session
                if (wasHost) {
                    session.state.active = false;
                    io.to(code).emit('session_ended', {
                        message: 'The host has disconnected. Session ended.'
                    });
                }
                
                console.log(`👋 ${participant?.name || socket.id} left session: ${code}`);
            }
        }
    });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🧘 PNEUOMA Sync Server                              ║
║                                                       ║
║   Running on port ${PORT}                               ║
║   Ready for real-time multiplayer sync!               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});


