/**
 * Bounce Sync - Classroom Breathing Game
 * Everyone breathes together to bounce a shared ball
 * Creates haptic feedback and synchronized calm
 */

class BounceSyncGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Role
        this.isHost = false;
        this.sessionCode = null;
        this.playerName = '';
        
        // Game state
        this.state = 'role'; // role, join, lobby, playing, ended
        this.isRunning = false;
        
        // Ball physics
        this.ball = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 60,
            baseRadius: 60,
            color: { h: 260, s: 70, l: 60 },
            glow: 0,
            bounceStretch: 1,
            trail: []
        };
        
        // Sync tracking
        this.syncLevel = 0;
        this.bounceCount = 0;
        this.bestSync = 0;
        this.participants = new Map();
        this.recentBreaths = []; // Track recent breath events for sync calculation
        
        // Breath detection
        this.breathDetector = null;
        this.isBreathing = false;
        this.lastBreathTime = 0;
        this.breathCooldown = 400;
        
        // Visual effects
        this.ripples = [];
        this.particles = [];
        this.stars = [];
        
        // Haptic feedback
        this.canVibrate = 'vibrate' in navigator;
        
        // Audio
        this.audioContext = null;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        this.init();
    }
    
    init() {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        this.setupScreens();
        this.generateStars();
        
        // Start background animation
        requestAnimationFrame(this.gameLoop);
        
        console.log('🏀 Bounce Sync initialized');
    }
    
    setupScreens() {
        // Role selection
        document.getElementById('host-btn').addEventListener('click', () => this.startAsHost());
        document.getElementById('join-btn').addEventListener('click', () => this.showJoinScreen());
        
        // Join screen
        document.getElementById('join-back-btn').addEventListener('click', () => this.showScreen('role-screen'));
        document.getElementById('join-submit').addEventListener('click', () => this.joinSession());
        
        // Allow enter key to join
        document.getElementById('join-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('join-name').focus();
        });
        document.getElementById('join-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinSession();
        });
        
        // Host lobby
        document.getElementById('start-session-btn').addEventListener('click', () => this.startBouncing());
        
        // Game controls
        document.getElementById('end-session-btn').addEventListener('click', () => this.endSession());
        
        // End screen
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }
    
    // ==================== HOST FLOW ====================
    
    async startAsHost() {
        this.isHost = true;
        
        // Connect to sync server
        const connected = await SyncClient.connect();
        if (!connected) {
            alert('Could not connect to sync server. Please try again.');
            return;
        }
        
        // Create session
        const result = await SyncClient.createSession('bounce-sync', 'Teacher', 'SYNC');
        if (!result.success) {
            alert('Could not create session. Please try again.');
            return;
        }
        
        this.sessionCode = result.code;
        document.getElementById('session-code').textContent = result.code;
        
        // Listen for participants
        SyncClient.onParticipantJoined((data) => this.onParticipantJoined(data));
        SyncClient.onParticipantLeft((data) => this.onParticipantLeft(data));
        
        this.showScreen('host-lobby');
    }
    
    onParticipantJoined(data) {
        this.participants.set(data.participantId, data.name);
        this.updateParticipantsList();
        
        // Enable start button when we have participants
        const startBtn = document.getElementById('start-session-btn');
        startBtn.disabled = this.participants.size === 0;
    }
    
    onParticipantLeft(data) {
        this.participants.delete(data.participantId);
        this.updateParticipantsList();
    }
    
    updateParticipantsList() {
        const list = document.getElementById('participants-list');
        const count = document.getElementById('participant-count');
        
        count.textContent = this.participants.size;
        
        if (this.participants.size === 0) {
            list.innerHTML = '<p class="waiting-msg">Waiting for students to join...</p>';
        } else {
            list.innerHTML = '';
            this.participants.forEach(name => {
                const chip = document.createElement('div');
                chip.className = 'participant-chip';
                chip.textContent = name;
                list.appendChild(chip);
            });
        }
    }
    
    // ==================== JOIN FLOW ====================
    
    showJoinScreen() {
        this.showScreen('join-screen');
        document.getElementById('join-code').focus();
    }
    
    async joinSession() {
        const code = document.getElementById('join-code').value.trim().toUpperCase();
        const name = document.getElementById('join-name').value.trim() || 'Student';
        
        if (!code || code.length < 4) {
            this.showJoinError('Please enter a valid session code');
            return;
        }
        
        this.playerName = name;
        
        // Connect to sync server
        const connected = await SyncClient.connect();
        if (!connected) {
            this.showJoinError('Could not connect. Please try again.');
            return;
        }
        
        // Join session
        const result = await SyncClient.joinSession(code, name);
        if (!result.success) {
            this.showJoinError(result.error || 'Could not join session');
            return;
        }
        
        this.sessionCode = code;
        this.isHost = false;
        
        // Listen for game events
        SyncClient.onExerciseStart((data) => this.onExerciseStart(data));
        SyncClient.onBreathSync((data) => this.onRemoteBreath(data));
        SyncClient.onSessionEnded(() => this.onSessionEnded());
        
        // Show waiting message
        this.showScreen('game-screen');
        this.showMessage('Waiting for teacher to start...', 0);
        
        // Update HUD
        document.getElementById('live-code').textContent = code;
    }
    
    showJoinError(msg) {
        const errorEl = document.getElementById('join-error');
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 3000);
    }
    
    // ==================== GAME START ====================
    
    async startBouncing() {
        // Initialize audio
        this.initAudio();
        
        // Initialize breath detection
        await this.initBreathDetection();
        
        // Show game screen
        this.showScreen('game-screen');
        document.getElementById('host-game-controls').classList.remove('hidden');
        document.getElementById('rhythm-indicator').classList.remove('hidden');
        
        // Update HUD
        document.getElementById('live-code').textContent = this.sessionCode;
        document.getElementById('live-count').textContent = `${this.participants.size} synced`;
        
        // Broadcast game start
        SyncClient.startExercise('bounce-sync', { started: true });
        
        // Start game
        this.startGame();
        
        this.showMessage('Breathe together!', 2000);
    }
    
    onExerciseStart(data) {
        // Participant received start signal
        this.initAudio();
        this.initBreathDetection();
        this.startGame();
        this.hideMessage();
        this.showMessage('Breathe together!', 2000);
    }
    
    startGame() {
        this.state = 'playing';
        this.isRunning = true;
        
        // Reset ball
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height * 0.4;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.radius = this.ball.baseRadius;
        
        // Reset stats
        this.bounceCount = 0;
        this.syncLevel = 0;
        this.bestSync = 0;
    }
    
    // ==================== BREATH DETECTION ====================
    
    async initBreathDetection() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: true
                } 
            });
            
            this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            
            const mic = this.audioContext.createMediaStreamSource(stream);
            mic.connect(analyser);
            
            this.breathDetector = {
                analyser,
                dataArray: new Uint8Array(analyser.frequencyBinCount),
                noiseFloor: 0.03,
                threshold: 0.08,
                volume: 0,
                smoothedVolume: 0
            };
            
            // Calibrate for 1.5 seconds
            setTimeout(() => this.calibrateBreath(), 1500);
            
            console.log('🎤 Breath detection ready');
        } catch (err) {
            console.error('Microphone error:', err);
        }
    }
    
    calibrateBreath() {
        if (this.breathDetector) {
            // Use current smoothed volume as noise floor
            this.breathDetector.noiseFloor = this.breathDetector.smoothedVolume * 1.5;
            this.breathDetector.threshold = this.breathDetector.noiseFloor + 0.05;
        }
    }
    
    updateBreathDetection() {
        if (!this.breathDetector) return;
        
        const { analyser, dataArray } = this.breathDetector;
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const n = dataArray[i] / 255;
            sum += n * n;
        }
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const mult = isMobile ? 3.0 : 1.5;
        this.breathDetector.volume = Math.sqrt(sum / dataArray.length) * mult;
        
        // Smooth
        this.breathDetector.smoothedVolume = this.breathDetector.smoothedVolume * 0.7 + 
                                              this.breathDetector.volume * 0.3;
        
        // Detect breath
        const now = performance.now();
        const adjusted = this.breathDetector.smoothedVolume - this.breathDetector.noiseFloor;
        
        if (adjusted > this.breathDetector.threshold && 
            now - this.lastBreathTime > this.breathCooldown) {
            this.onLocalBreath();
            this.lastBreathTime = now;
        }
    }
    
    onLocalBreath() {
        // Bounce the ball!
        this.triggerBounce();
        
        // Broadcast to others
        if (this.sessionCode) {
            SyncClient.sendBreathPhase('bounce', this.playerName || 'host');
        }
        
        // Track for sync calculation
        this.recentBreaths.push({ time: performance.now(), local: true });
    }
    
    onRemoteBreath(data) {
        // Another participant breathed - track for sync
        this.recentBreaths.push({ time: performance.now(), local: false });
        
        // Visual feedback - add extra glow
        this.ball.glow = Math.min(1, this.ball.glow + 0.2);
        
        // More particles when synced
        this.addParticleBurst(3);
    }
    
    // ==================== BOUNCE MECHANICS ====================
    
    triggerBounce() {
        // Give ball upward velocity
        this.ball.vy = -15;
        this.ball.vx += (Math.random() - 0.5) * 2;
        
        // Squash effect
        this.ball.bounceStretch = 0.6;
        
        // Increase glow
        this.ball.glow = 1;
        
        // Increment counter
        this.bounceCount++;
        this.updateBounceCount();
        
        // Add visual effects
        this.addRipple(this.ball.x, this.ball.y);
        this.addParticleBurst(8);
        
        // Haptic feedback
        this.vibrate([30]);
        
        // Sound
        this.playBounceSound();
        
        // Shift color slightly
        this.ball.color.h = (this.ball.color.h + 5) % 360;
    }
    
    addRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: this.ball.radius,
            maxRadius: 200,
            alpha: 0.8
        });
    }
    
    addParticleBurst(count) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            this.particles.push({
                x: this.ball.x,
                y: this.ball.y,
                vx: Math.cos(angle) * (3 + Math.random() * 3),
                vy: Math.sin(angle) * (3 + Math.random() * 3),
                radius: 3 + Math.random() * 4,
                alpha: 1,
                color: this.ball.color.h
            });
        }
    }
    
    vibrate(pattern) {
        if (this.canVibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    // ==================== SYNC CALCULATION ====================
    
    calculateSync() {
        const now = performance.now();
        const windowMs = 2000; // 2 second window
        
        // Filter recent breaths
        this.recentBreaths = this.recentBreaths.filter(b => now - b.time < windowMs);
        
        if (this.recentBreaths.length < 2) {
            this.syncLevel = Math.max(0, this.syncLevel - 0.02);
            return;
        }
        
        // Count local and remote breaths
        const localCount = this.recentBreaths.filter(b => b.local).length;
        const remoteCount = this.recentBreaths.filter(b => !b.local).length;
        
        // Sync is based on balance of local and remote
        const total = localCount + remoteCount;
        const balance = Math.min(localCount, remoteCount) / Math.max(localCount, remoteCount);
        
        // Also check timing proximity
        let timingScore = 0;
        for (let i = 1; i < this.recentBreaths.length; i++) {
            const gap = this.recentBreaths[i].time - this.recentBreaths[i-1].time;
            if (gap < 300) timingScore += 0.2; // Close together = more sync
        }
        timingScore = Math.min(1, timingScore);
        
        // Combined sync
        const rawSync = (balance * 0.6 + timingScore * 0.4);
        this.syncLevel = this.syncLevel * 0.9 + rawSync * 0.1;
        
        // Track best
        this.bestSync = Math.max(this.bestSync, this.syncLevel);
        
        // Update UI
        this.updateSyncUI();
        
        // High sync rewards
        if (this.syncLevel > 0.7) {
            this.ball.glow = Math.min(1, this.ball.glow + 0.05);
            
            // Big vibration burst at high sync
            if (Math.random() < 0.1) {
                this.vibrate([10, 20, 10]);
            }
        }
    }
    
    updateSyncUI() {
        const fill = document.getElementById('sync-fill');
        const percent = document.getElementById('sync-percent');
        const liveCount = document.getElementById('live-count');
        
        const pct = Math.round(this.syncLevel * 100);
        fill.style.width = `${pct}%`;
        percent.textContent = `${pct}%`;
        
        // Color based on sync level
        if (this.syncLevel > 0.7) {
            fill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
            percent.style.color = '#10b981';
        } else if (this.syncLevel > 0.4) {
            fill.style.background = 'linear-gradient(90deg, #667eea, #10b981)';
            percent.style.color = '#667eea';
        } else {
            fill.style.background = 'linear-gradient(90deg, #667eea, #764ba2)';
            percent.style.color = '#a78bfa';
        }
        
        liveCount.textContent = `${this.participants.size + 1} synced`;
    }
    
    updateBounceCount() {
        const countEl = document.querySelector('.count-num');
        if (countEl) {
            countEl.textContent = this.bounceCount;
        }
    }
    
    // ==================== AUDIO ====================
    
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    playBounceSound() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        // Base frequency varies with sync level
        const baseFreq = 200 + this.syncLevel * 200;
        osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, this.audioContext.currentTime + 0.3);
        
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
    
    // ==================== GAME LOOP ====================
    
    gameLoop(currentTime) {
        this.deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        if (this.state === 'playing') {
            this.updateBreathDetection();
            this.calculateSync();
        }
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(dt) {
        // Ball physics
        if (this.state === 'playing') {
            // Gravity
            this.ball.vy += 0.3;
            
            // Apply velocity
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // Friction
            this.ball.vx *= 0.99;
            
            // Floor bounce
            const floor = this.canvas.height - 100;
            if (this.ball.y + this.ball.radius > floor) {
                this.ball.y = floor - this.ball.radius;
                this.ball.vy *= -0.4;
                this.ball.bounceStretch = 1.3;
                this.vibrate([15]); // Small vibration on floor hit
            }
            
            // Walls
            if (this.ball.x - this.ball.radius < 0) {
                this.ball.x = this.ball.radius;
                this.ball.vx *= -0.8;
            }
            if (this.ball.x + this.ball.radius > this.canvas.width) {
                this.ball.x = this.canvas.width - this.ball.radius;
                this.ball.vx *= -0.8;
            }
            
            // Ceiling
            if (this.ball.y - this.ball.radius < 100) {
                this.ball.y = 100 + this.ball.radius;
                this.ball.vy *= -0.5;
            }
            
            // Stretch recovery
            this.ball.bounceStretch += (1 - this.ball.bounceStretch) * 0.15;
            
            // Glow decay
            this.ball.glow *= 0.97;
            
            // Size pulses with sync
            this.ball.radius = this.ball.baseRadius + this.syncLevel * 20;
            
            // Trail
            this.ball.trail.push({ x: this.ball.x, y: this.ball.y, alpha: 0.5 });
            if (this.ball.trail.length > 15) this.ball.trail.shift();
            this.ball.trail.forEach(t => t.alpha *= 0.9);
        }
        
        // Update ripples
        this.ripples = this.ripples.filter(r => {
            r.radius += 4;
            r.alpha -= 0.02;
            return r.alpha > 0;
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.alpha -= 0.02;
            p.radius *= 0.98;
            return p.alpha > 0;
        });
        
        // Update stars
        this.stars.forEach(s => {
            s.twinkle += 0.02;
        });
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0f0f1a');
        bgGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Stars
        this.stars.forEach(s => {
            const alpha = 0.3 + Math.sin(s.twinkle) * 0.3;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        });
        
        // Floor
        const floorGrad = ctx.createLinearGradient(0, h - 100, 0, h);
        floorGrad.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
        floorGrad.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, h - 100, w, 100);
        
        // Floor line
        ctx.beginPath();
        ctx.moveTo(0, h - 100);
        ctx.lineTo(w, h - 100);
        ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Ripples
        this.ripples.forEach(r => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(167, 139, 250, ${r.alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        });
        
        // Ball trail
        this.ball.trail.forEach((t, i) => {
            const size = (i / this.ball.trail.length) * this.ball.radius * 0.5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.ball.color.h}, ${this.ball.color.s}%, ${this.ball.color.l}%, ${t.alpha * 0.3})`;
            ctx.fill();
        });
        
        // Ball glow
        if (this.ball.glow > 0.1) {
            const glowGrad = ctx.createRadialGradient(
                this.ball.x, this.ball.y, 0,
                this.ball.x, this.ball.y, this.ball.radius * 3
            );
            glowGrad.addColorStop(0, `hsla(${this.ball.color.h}, ${this.ball.color.s}%, ${this.ball.color.l}%, ${this.ball.glow * 0.5})`);
            glowGrad.addColorStop(1, `hsla(${this.ball.color.h}, ${this.ball.color.s}%, ${this.ball.color.l}%, 0)`);
            
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();
        }
        
        // Ball
        ctx.save();
        ctx.translate(this.ball.x, this.ball.y);
        ctx.scale(1 / this.ball.bounceStretch, this.ball.bounceStretch);
        
        const ballGrad = ctx.createRadialGradient(
            -this.ball.radius * 0.3, -this.ball.radius * 0.3, 0,
            0, 0, this.ball.radius
        );
        
        const { h: hue, s: sat, l: light } = this.ball.color;
        ballGrad.addColorStop(0, `hsl(${hue}, ${sat}%, ${light + 20}%)`);
        ballGrad.addColorStop(0.5, `hsl(${hue}, ${sat}%, ${light}%)`);
        ballGrad.addColorStop(1, `hsl(${hue}, ${sat - 10}%, ${light - 15}%)`);
        
        ctx.beginPath();
        ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();
        
        // Highlight
        ctx.beginPath();
        ctx.arc(-this.ball.radius * 0.3, -this.ball.radius * 0.3, this.ball.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
        
        ctx.restore();
        
        // Particles
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.color}, 70%, 60%, ${p.alpha})`;
            ctx.fill();
        });
    }
    
    generateStars() {
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight * 0.7,
                size: Math.random() * 2 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.state === 'playing') {
            // Keep ball in bounds
            this.ball.x = Math.min(this.ball.x, this.canvas.width - this.ball.radius);
            this.ball.y = Math.min(this.ball.y, this.canvas.height - 100 - this.ball.radius);
        }
    }
    
    // ==================== SESSION MANAGEMENT ====================
    
    onSessionEnded() {
        this.showEndScreen();
    }
    
    endSession() {
        SyncClient.endSession(this.sessionCode);
        this.showEndScreen();
    }
    
    showEndScreen() {
        this.state = 'ended';
        this.isRunning = false;
        
        document.getElementById('stat-bounces').textContent = this.bounceCount;
        document.getElementById('stat-sync').textContent = `${Math.round(this.bestSync * 100)}%`;
        
        this.showScreen('end-screen');
    }
    
    restart() {
        window.location.reload();
    }
    
    showMessage(text, duration = 2000) {
        const msgEl = document.getElementById('message-display');
        const textEl = document.getElementById('message-text');
        
        textEl.textContent = text;
        msgEl.classList.remove('hidden');
        
        if (duration > 0) {
            setTimeout(() => this.hideMessage(), duration);
        }
    }
    
    hideMessage() {
        document.getElementById('message-display').classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new BounceSyncGame();
});

