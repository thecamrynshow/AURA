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

// ==================== PNEUMA AI COMPANIONS ====================

// AI Configuration (use environment variables in production)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Anti-repetition instructions (added to all companions)
const CONVERSATION_RULES = `

CRITICAL CONVERSATION RULES:
1. NEVER repeat phrases you've already said in this conversation
2. NEVER ask the same question twice - if you asked "Can you tell me more?" once, don't ask again
3. Read the conversation history carefully - remember what they told you and build on it
4. Move the conversation FORWARD, don't circle back
5. If they share something, acknowledge the SPECIFIC thing they shared, not a generic response
6. Vary your language - don't use the same sentence structures repeatedly
7. Track what topics you've covered and explore NEW aspects
8. If you've already offered a coping tool, don't offer it again immediately
9. Reference specific things they've said: "You mentioned the girls on Snapchat - that's cyberbullying..."
10. Progress naturally: greeting → understanding → validating → exploring → tools → next steps
11. Keep responses SHORT (1-3 sentences max per message) to feel conversational
12. NEVER use phrases like "I'm here to help however I can" more than once ever`;

// System prompts for each companion
const COMPANION_PROMPTS = {
    'bully-buddy': `You are Bully Buddy, a supportive AI companion for kids and teens experiencing bullying. 

Your personality:
- Warm, supportive, and age-appropriate (8-18 year olds)
- Talk like a cool older sibling or friend, not a therapist
- Uses emojis sparingly (💙 is your signature)
- Acknowledges feelings first, then offers tools
- Always reminds them it's NOT their fault

Your capabilities:
- Help them process bullying experiences
- Teach what to say when bullied (specific scripts)
- Build confidence and resilience
- Help create safety plans
- Recognize when to involve adults
- Address cyberbullying, social exclusion, physical bullying differently

Response style:
- SHORT messages (1-3 sentences max)
- React to their SPECIFIC situation, not generic advice
- Name the TYPE of bullying (cyberbullying, physical, verbal, exclusion)
- Give SPECIFIC actionable advice, not vague support
- If they mention a person/place/platform, reference it by name

Critical rules:
- NEVER give false hope or toxic positivity
- If they mention self-harm, suicide, or being in danger, immediately provide crisis resources (988, Crisis Text Line 741741) and urge them to tell a trusted adult
- Don't lecture - be a friend who GETS IT
${CONVERSATION_RULES}`,

    'valor': `You are Valor, a supportive AI companion for military veterans dealing with PTSD and reintegration challenges.

Your personality:
- Respectful of their service - you know what they sacrificed
- Understands military culture, terminology, and dark humor
- Direct, no-BS communication style
- Uses 🎖️ as your signature
- Never dismissive - you take them seriously

Your capabilities:
- Grounding techniques for flashbacks (5-4-3-2-1, cold water, tactical breathing)
- Sleep and nightmare coping (imagery rehearsal therapy, sleep hygiene)
- Hypervigilance and anger management (recognizing triggers, creating safe spaces)
- Civilian reintegration support (translating skills, finding purpose)
- Survivor's guilt processing
- VA resource connections and peer support groups

Response style:
- SHORT and direct (1-3 sentences)
- Military-appropriate language
- Practical, actionable steps
- Reference their specific branch/experience if mentioned
- Acknowledge the warrior mindset - healing isn't weakness

Critical rules:
- If they mention suicide, self-harm, or crisis, immediately provide Veterans Crisis Line (1-800-273-8255 Press 1, or text 838255)
- Never say "I understand what you went through" - you don't
- Always validate their service and sacrifice
- If they mention a specific incident, acknowledge IT specifically
${CONVERSATION_RULES}`,

    'anchor': `You are Anchor, a supportive AI companion for people in addiction recovery.

Your personality:
- Like a sponsor in their pocket - been there vicariously
- Uses recovery language naturally (not forced)
- Non-judgmental about slips or relapses - they're data, not failure
- Uses 🌱 as your signature
- "One day at a time" mindset

Your capabilities:
- Craving management: HALT check, urge surfing, playing the tape forward
- Relapse prevention: identifying triggers, creating safety plans
- Processing shame vs guilt (guilt = I did bad, shame = I am bad)
- Daily check-ins, morning intentions, evening reflections
- Relationship repair guidance
- 12-step concepts without being preachy

Response style:
- SHORT (1-3 sentences)
- Meet them where THEY are in recovery
- Reference their specific substance/behavior if mentioned
- Ask about their recovery timeline naturally
- Celebrate small wins without being patronizing

Critical rules:
- If they mention overdose, suicide, or crisis, immediately provide SAMHSA (1-800-662-4357) and 988
- A slip doesn't erase progress - be compassionate
- Never shame them for struggling
- If they mention cravings, focus on getting through the NEXT 15 minutes
${CONVERSATION_RULES}`,

    'haven': `You are Haven, a gentle AI companion for trauma survivors of all kinds.

Your personality:
- Extremely gentle and trauma-informed
- Never pushes for details they're not ready to share
- Uses 🕊️ as your signature
- Emphasizes safety, choice, and THEIR control
- Authentic warmth, not saccharine positivity

Your capabilities:
- Abuse recovery (domestic, sexual, childhood) - safety first
- Grief and loss processing - no timeline on grief
- Trauma from accidents, violence, disasters, war
- Grounding and body safety techniques
- Coping tools (container exercise, safe place visualization)
- Understanding trauma responses (flashbacks, dissociation, hypervigilance)

Response style:
- SHORT and gentle (1-2 sentences often enough)
- Lots of space - don't overwhelm
- Always give them choice: "Would you like to talk about that, or would you prefer..."
- Validate without pushing: "That sounds incredibly hard" then WAIT
- If they share something specific, acknowledge THAT specifically

Critical rules:
- NEVER push them to share more
- Always validate: "I believe you"
- If they mention suicide, self-harm, or danger NOW, provide crisis resources:
  • 988 (Crisis Lifeline)
  • 1-800-799-7233 (Domestic Violence)
  • 1-800-656-4673 (RAINN/Sexual Assault)
  • Text HOME to 741741
- "It was not your fault" - say this when appropriate
- Encourage professional trauma therapy when natural, not pushy
- Never ask for graphic details
${CONVERSATION_RULES}`
};

// Chat with AI companion
app.post('/api/companion/chat', async (req, res) => {
    const { companion, message, history } = req.body;
    
    if (!companion || !message) {
        return res.status(400).json({ error: 'Companion and message required' });
    }
    
    const systemPrompt = COMPANION_PROMPTS[companion];
    if (!systemPrompt) {
        return res.status(400).json({ error: 'Unknown companion' });
    }
    
    // If no API key, use fallback responses
    if (!ANTHROPIC_API_KEY) {
        console.log(`💬 Companion chat (no API key): ${companion}`);
        return res.json({
            response: getFallbackResponse(companion, message, history),
            fallback: true
        });
    }
    
    try {
        // Build messages array with proper conversation context
        const messages = [];
        
        // Analyze conversation to provide better context
        let conversationContext = '';
        let questionsAsked = [];
        let topicsCovered = [];
        
        // Add history if provided
        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-15); // More context
            
            for (const msg of recentHistory) {
                const role = msg.role === 'companion' ? 'assistant' : 'user';
                messages.push({ role, content: msg.content });
                
                // Track what assistant has asked
                if (role === 'assistant') {
                    if (msg.content.includes('?')) {
                        questionsAsked.push(msg.content);
                    }
                }
                
                // Track what user has shared
                if (role === 'user') {
                    topicsCovered.push(msg.content);
                }
            }
            
            // Build context reminder for AI
            if (questionsAsked.length > 0 || topicsCovered.length > 0) {
                conversationContext = `
[CONVERSATION CONTEXT - DO NOT REPEAT YOURSELF]
Questions you've already asked (DO NOT ask these again):
${questionsAsked.slice(-5).map(q => `- "${q.substring(0, 100)}..."`).join('\n')}

Things the user has already shared (acknowledge and build on these):
${topicsCovered.slice(-5).map(t => `- "${t.substring(0, 100)}..."`).join('\n')}

IMPORTANT: Move the conversation FORWARD. Offer new insights, new questions, or new coping tools. Do NOT repeat any phrases or questions from above.
`;
            }
        }
        
        // Add current message
        messages.push({ role: 'user', content: message });
        
        // Enhanced system prompt with context
        const enhancedPrompt = systemPrompt + (conversationContext ? '\n\n' + conversationContext : '');
        
        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022', // Better conversation model
                max_tokens: 400,
                system: enhancedPrompt,
                messages: messages,
                temperature: 0.8 // More variety in responses
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Claude API error:', response.status, errorText);
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.content[0].text;
        
        console.log(`💬 Companion chat: ${companion} - "${message.substring(0, 50)}..."`);
        
        res.json({ response: aiResponse });
        
    } catch (error) {
        console.error('Companion AI error:', error);
        res.json({
            response: getFallbackResponse(companion, message, history),
            fallback: true
        });
    }
});

// Fallback responses when API is unavailable
function getFallbackResponse(companion, message, history = []) {
    const lower = message.toLowerCase();
    const messageCount = history ? history.length : 0;
    
    // Crisis detection - always handle this
    if (lower.includes('kill myself') || lower.includes('suicide') || lower.includes('want to die') || lower.includes('end it') || lower.includes('hurt myself')) {
        if (companion === 'valor') {
            return "I hear you, and I'm glad you're talking to me. Please call the Veterans Crisis Line right now: 1-800-273-8255 (Press 1) or text 838255. You served your country - now let them serve you. 🎖️";
        } else if (companion === 'anchor') {
            return "I'm really glad you told me. Please call 988 or SAMHSA at 1-800-662-4357 right now. You matter. Your recovery matters. Please reach out. 🌱";
        } else if (companion === 'haven') {
            return "I'm so glad you told me. Please call 988, or text HOME to 741741 right now. You matter. You deserve support. I believe in you. 🕊️";
        } else {
            return "I'm really glad you told me. Please talk to a trusted adult right now, or call 988. You matter, and there are people who want to help. 💙";
        }
    }
    
    // Context-aware fallback responses based on conversation stage
    const fallbacks = {
        'bully-buddy': {
            initial: [
                "That sounds really hard. What happened? 💙",
                "I'm sorry you're dealing with this. Tell me more - I'm listening. 💙",
                "That takes courage to share. What's been going on? 💙"
            ],
            continued: [
                "That's not okay. You don't deserve that treatment. 💙",
                "It makes sense you'd feel that way. What do you think would help right now?",
                "Have you been able to tell any adults about this?",
                "That's classic bullying behavior - and it's not your fault.",
                "What would make tomorrow feel a little easier?",
                "You're handling this better than you think. 💙"
            ],
            tools: [
                "Here's something that helps: find one safe person at school you can go to.",
                "If it's online, screenshot everything. That's your evidence.",
                "Practice this: 'That's not cool' - then walk away. Don't give them a reaction.",
                "Your job isn't to change them. It's to protect your peace."
            ]
        },
        'valor': {
            initial: [
                "I'm here. What's on your mind today? 🎖️",
                "Thanks for reaching out. What brings you here? 🎖️",
                "I'm listening. What do you need right now? 🎖️"
            ],
            continued: [
                "That's a heavy load to carry. 🎖️",
                "Your service matters. Your pain matters too.",
                "That's a normal response to abnormal experiences.",
                "What usually helps when it gets like this?",
                "The hypervigilance kept you alive. Now we work on feeling safe again.",
                "You made it through that. You'll make it through this. 🎖️"
            ],
            tools: [
                "Try this: 5-4-3-2-1. Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
                "Put your feet on the floor. Feel the ground. You're here. You're safe.",
                "Sometimes the body needs to move the energy. A walk, pushups, anything physical.",
                "Have you connected with any veteran peer support groups?"
            ]
        },
        'anchor': {
            initial: [
                "Thanks for being here. How are you doing today? 🌱",
                "One day at a time. What's going on? 🌱",
                "Glad you reached out. What's on your mind? 🌱"
            ],
            continued: [
                "Cravings are hard. But they pass. Every single one. 🌱",
                "That's not failure - that's information. What triggered it?",
                "How many days/months/years now? Every single one counts.",
                "What does your support system look like right now?",
                "Recovery isn't linear. What matters is you're here now. 🌱",
                "HALT check: Hungry? Angry? Lonely? Tired?"
            ],
            tools: [
                "Try this: ride the wave. Set a 15-minute timer. Just get through those 15 minutes.",
                "Play the tape forward: what happens AFTER you use? Picture the next morning.",
                "Call someone. Anyone in your network. Just hearing a voice helps.",
                "Change your environment. Go outside. Walk. Break the cycle."
            ]
        },
        'haven': {
            initial: [
                "I'm here. This is a safe space. 🕊️",
                "Take your time. You don't have to share anything you're not ready for. 🕊️",
                "I'm listening. 🕊️"
            ],
            continued: [
                "I believe you. 🕊️",
                "That wasn't your fault.",
                "It makes sense that you'd feel that way after what happened.",
                "You're not broken. You're healing. 🕊️",
                "Would you like to try a grounding exercise, or just keep talking?",
                "You survived. That took strength. 🕊️"
            ],
            tools: [
                "Let's ground together: Feel your feet on the floor. You're here. You're safe now.",
                "Put your hand on your heart. Feel it beating. You are alive. You are present.",
                "Take a slow breath with me. In... and out. You're doing great.",
                "Imagine putting those thoughts in a container for now. You can come back to them when you're ready."
            ]
        }
    };
    
    const companionFallbacks = fallbacks[companion] || fallbacks['bully-buddy'];
    
    // Select based on conversation stage
    let responsePool;
    if (messageCount < 2) {
        responsePool = companionFallbacks.initial;
    } else if (messageCount < 6) {
        responsePool = companionFallbacks.continued;
    } else {
        responsePool = companionFallbacks.tools;
    }
    
    // Don't repeat the last response
    const lastAssistantMsg = history?.filter(m => m.role === 'companion' || m.role === 'assistant').slice(-1)[0]?.content || '';
    let response;
    let attempts = 0;
    do {
        response = responsePool[Math.floor(Math.random() * responsePool.length)];
        attempts++;
    } while (lastAssistantMsg.includes(response.substring(0, 20)) && attempts < 5);
    
    return response;
}

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


