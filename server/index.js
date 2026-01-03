/**
 * PNEUOMA Server
 * Real-time multiplayer sync + Authentication + Subscriptions
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'pneuoma-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

// Master accounts with full access
const MASTER_EMAILS = [
    'camrynjackson@pneuoma.com',
    'camryn@pneuoma.com'
];

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

// ==================== USER STORAGE ====================
// In production, replace with database (PostgreSQL/MongoDB)

const users = new Map();
const subscriptions = new Map();

// User class
class User {
    constructor(data) {
        this.id = data.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.email = data.email.toLowerCase();
        this.passwordHash = data.passwordHash;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.accountType = data.accountType || 'individual';
        this.subscription = MASTER_EMAILS.includes(this.email) ? 'master' : 'free';
        this.createdAt = data.createdAt || Date.now();
        this.lastLogin = Date.now();
    }
    
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            accountType: this.accountType,
            subscription: this.subscription,
            createdAt: this.createdAt
        };
    }
}

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, subscription: user.subscription },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
}

// Verify JWT token middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

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

// ==================== AUTH ROUTES ====================

// Sign up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, firstName, lastName, accountType } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        const normalizedEmail = email.toLowerCase();
        
        // Check if user exists
        if (users.has(normalizedEmail)) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            email: normalizedEmail,
            passwordHash,
            firstName,
            lastName,
            accountType
        });
        
        users.set(normalizedEmail, user);
        
        // Generate token
        const token = generateToken(user);
        
        console.log(`✨ New user registered: ${normalizedEmail}`);
        
        res.json({
            success: true,
            user: user.toJSON(),
            token
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Could not create account' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const normalizedEmail = email.toLowerCase();
        const user = users.get(normalizedEmail);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Update last login
        user.lastLogin = Date.now();
        
        // Generate token
        const token = generateToken(user);
        
        console.log(`🔐 User logged in: ${normalizedEmail}`);
        
        res.json({
            success: true,
            user: user.toJSON(),
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Could not log in' });
    }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.get(req.user.email);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user.toJSON() });
});

// Update subscription
app.post('/api/auth/subscription', authenticateToken, (req, res) => {
    const { subscription } = req.body;
    const user = users.get(req.user.email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't allow downgrading master accounts
    if (MASTER_EMAILS.includes(user.email)) {
        return res.json({ user: user.toJSON() });
    }
    
    user.subscription = subscription;
    
    res.json({ user: user.toJSON() });
});

// Forgot password (placeholder - would send email in production)
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    // In production, send password reset email
    console.log(`📧 Password reset requested for: ${email}`);
    res.json({ 
        success: true, 
        message: 'If an account exists, a reset link has been sent.' 
    });
});

// ==================== STRIPE INTEGRATION ====================

// Stripe configuration (use environment variables in production)
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
let stripe;
if (STRIPE_SECRET) {
    stripe = require('stripe')(STRIPE_SECRET);
}

// Create checkout session
app.post('/api/stripe/create-checkout', authenticateToken, async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
    }
    
    const { priceId, plan } = req.body;
    const user = users.get(req.user.email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: `${req.headers.origin}/auth/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/auth/subscribe.html`,
            customer_email: user.email,
            metadata: {
                userId: user.id,
                plan
            },
            subscription_data: {
                trial_period_days: 7
            }
        });
        
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: 'Could not create checkout session' });
    }
});

// Get subscription status
app.get('/api/stripe/subscription', authenticateToken, async (req, res) => {
    const user = users.get(req.user.email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        subscription: user.subscription,
        isPremium: user.subscription === 'premium' || user.subscription === 'family' || user.subscription === 'master'
    });
});

// Stripe webhook for subscription updates
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' });
    }
    
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            event = JSON.parse(req.body);
        }
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle subscription events
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const userEmail = session.customer_email;
            const plan = session.metadata?.plan || 'premium';
            
            const user = users.get(userEmail);
            if (user) {
                user.subscription = plan;
                console.log(`🎉 Subscription activated for ${userEmail}: ${plan}`);
            }
            break;
            
        case 'customer.subscription.updated':
            // Handle subscription changes
            break;
            
        case 'customer.subscription.deleted':
            // Handle cancellation - downgrade to free
            const subscription = event.data.object;
            // In production, look up user by Stripe customer ID
            break;
            
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
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


