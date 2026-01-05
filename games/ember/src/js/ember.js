/**
 * Ember — A Warm Presence in Your Hands
 * Touch-based, haptic-focused calming experience
 * No microphone needed
 */

class EmberApp {
    constructor() {
        this.canvas = document.getElementById('ember-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.isActive = false;
        this.sessionStart = 0;
        this.sessionTime = 0;
        
        // Ember (the glowing orb)
        this.ember = {
            x: 0,
            y: 0,
            baseRadius: 80,
            radius: 80,
            targetRadius: 80,
            
            // Breathing cycle (10 seconds = 6 breaths per minute)
            breathPhase: 0,
            breathSpeed: 0.0006283, // 2*PI / 10000ms
            
            // Colors
            hue: 25, // Warm orange
            saturation: 100,
            lightness: 55,
            
            // Glow
            glowIntensity: 0.6,
            glowTarget: 0.6,
            
            // Touch response
            touchScale: 1,
            touchGlow: 0,
            isBeingHeld: false,
            holdDuration: 0
        };
        
        // Touch trails
        this.trails = [];
        this.maxTrailLength = 50;
        
        // Particles (ambient warmth)
        this.particles = [];
        
        // Ripples from touch
        this.ripples = [];
        
        // Haptic - SIMPLE approach like Bounce Sync
        this.canVibrate = 'vibrate' in navigator;
        this.lastVibration = 0;
        this.vibrationInterval = 100; // ms between vibrations
        
        // Audio context for sounds AND haptic fallback
        this.audioContext = null;
        this.hapticGain = null;
        this.audioInitialized = false;
        
        // Breath phase tracking for vibration
        this.wasInhale = false;
        this.wasExhale = false;
        
        // Debug
        console.log('🔥 Vibration API available:', this.canVibrate);
        
        // Timing
        this.lastTime = 0;
        
        // Bind
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        this.init();
    }
    
    init() {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        this.setupUI();
        this.setupTouch();
        
        // Start animation loop
        requestAnimationFrame(this.animate);
        
        console.log('🔥 Ember initialized');
    }
    
    setupUI() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('exit-btn').addEventListener('click', () => this.end());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }
    
    setupTouch() {
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e));
        
        // Mouse fallback for desktop testing
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        
        this.isMouseDown = false;
    }
    
    // ==================== TOUCH HANDLING ====================
    
    onTouchStart(e) {
        e.preventDefault();
        if (!this.isActive) return;
        
        const touch = e.touches[0];
        this.handleTouchStart(touch.clientX, touch.clientY);
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (!this.isActive) return;
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            this.handleTouchMove(touch.clientX, touch.clientY);
        }
    }
    
    onTouchEnd(e) {
        if (!this.isActive) return;
        this.handleTouchEnd();
    }
    
    onMouseDown(e) {
        if (!this.isActive) return;
        this.isMouseDown = true;
        this.handleTouchStart(e.clientX, e.clientY);
    }
    
    onMouseMove(e) {
        if (!this.isActive || !this.isMouseDown) return;
        this.handleTouchMove(e.clientX, e.clientY);
    }
    
    onMouseUp(e) {
        if (!this.isActive) return;
        this.isMouseDown = false;
        this.handleTouchEnd();
    }
    
    handleTouchStart(x, y) {
        const dist = this.distanceToEmber(x, y);
        
        // Check if touching the ember
        if (dist < this.ember.radius * 2) {
            this.ember.isBeingHeld = true;
            this.ember.holdDuration = 0;
            this.ember.touchGlow = 0.8;
            this.ember.touchScale = 1.15;
            
            // Strong haptic pulse when touching ember
            this.vibrate([50, 30, 50]);
            
            // Start continuous pulse while holding
            this.startHoldPulse();
            
            // Ripple
            this.addRipple(this.ember.x, this.ember.y);
            
            // Extra particles burst
            for (let i = 0; i < 8; i++) {
                this.addParticle();
            }
        } else {
            // Touching screen but not orb - light vibration
            this.vibrate([20]);
        }
        
        // Add to trail
        this.trails.push({ x, y, alpha: 1, radius: 4 });
    }
    
    startHoldPulse() {
        // Clear any existing pulse
        if (this.holdPulseInterval) {
            clearInterval(this.holdPulseInterval);
        }
        
        // Continuous heartbeat pulse while holding - 60 BPM feel
        this.holdPulseInterval = setInterval(() => {
            if (this.ember.isBeingHeld) {
                // Heartbeat pattern: lub-dub
                this.vibrate([30, 50, 20]);
                
                // Visual pulse
                this.ember.touchGlow = 0.6;
                this.addRipple(this.ember.x, this.ember.y);
            } else {
                clearInterval(this.holdPulseInterval);
            }
        }, 1000); // Every second = 60 BPM
    }
    
    handleTouchMove(x, y) {
        // Add to trail (creates light painting effect)
        this.trails.push({ 
            x, y, 
            alpha: 1, 
            radius: 3 + Math.random() * 3,
            hue: this.ember.hue + Math.random() * 20 - 10
        });
        
        // Trim trail
        while (this.trails.length > this.maxTrailLength) {
            this.trails.shift();
        }
        
        // Check if still on ember while moving
        const dist = this.distanceToEmber(x, y);
        if (dist < this.ember.radius * 2 && this.ember.isBeingHeld) {
            // Stroking the ember - warm vibration
            const now = performance.now();
            if (now - this.lastVibration > 150) {
                this.vibrate([15]);
                this.lastVibration = now;
                this.ember.touchGlow = Math.min(1, this.ember.touchGlow + 0.1);
            }
        } else {
            // Drawing on screen - light feedback
            const now = performance.now();
            if (now - this.lastVibration > 100) {
                this.vibrate([10]);
                this.lastVibration = now;
            }
        }
    }
    
    handleTouchEnd() {
        if (this.ember.isBeingHeld) {
            this.ember.isBeingHeld = false;
            this.ember.touchScale = 1;
            
            // Stop the pulse interval
            if (this.holdPulseInterval) {
                clearInterval(this.holdPulseInterval);
            }
            
            // Release vibration
            this.vibrate([30, 20, 10]);
            
            // Gentle ripple on release
            this.addRipple(this.ember.x, this.ember.y);
        }
    }
    
    distanceToEmber(x, y) {
        return Math.sqrt(
            Math.pow(x - this.ember.x, 2) + 
            Math.pow(y - this.ember.y, 2)
        );
    }
    
    // ==================== HAPTIC ====================
    
    initAudio() {
        // Simple init like Bounce Sync
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.audioInitialized = true;
        console.log('🔊 Audio context ready');
    }
    
    vibrate(pattern) {
        // SIMPLE - just like Bounce Sync
        if (this.canVibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    updateBreathVibration() {
        // Calculate breath phase (0 to 1, where 0.5 is peak inhale)
        const breathCycle = (Math.sin(this.ember.breathPhase) + 1) / 2;
        
        // Vibrate on breath transitions
        const isInhale = breathCycle > 0.6;
        const isExhale = breathCycle < 0.4;
        
        if (!this.wasExhale && isExhale) {
            // Just started exhale - gentle pulse
            this.vibrate([25]);
        }
        
        if (!this.wasInhale && isInhale) {
            // Just started inhale - gentle pulse
            this.vibrate([15]);
        }
        
        this.wasInhale = isInhale;
        this.wasExhale = isExhale;
    }
    
    // ==================== VISUAL EFFECTS ====================
    
    addRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: 20,
            maxRadius: 150,
            alpha: 0.6
        });
    }
    
    addParticle() {
        if (this.particles.length > 30) return;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = this.ember.radius * (1.5 + Math.random());
        
        this.particles.push({
            x: this.ember.x + Math.cos(angle) * dist,
            y: this.ember.y + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 0.3,
            vy: -Math.random() * 0.5 - 0.2,
            radius: Math.random() * 3 + 1,
            alpha: 0.6,
            hue: this.ember.hue + Math.random() * 30 - 15
        });
    }
    
    // ==================== GAME LOOP ====================
    
    start() {
        this.isActive = true;
        this.sessionStart = performance.now();
        
        // Initialize audio (like Bounce Sync)
        this.initAudio();
        
        // Center ember
        this.ember.x = this.canvas.width / 2;
        this.ember.y = this.canvas.height / 2;
        
        // Show ember screen
        this.showScreen('ember-screen');
        
        // Welcoming vibration
        this.vibrate([30, 50, 30]);
        
        console.log('🔥 Ember awakened - haptics active');
    }
    
    end() {
        this.isActive = false;
        
        // Calculate session time
        const totalMs = performance.now() - this.sessionStart;
        const minutes = Math.round(totalMs / 60000);
        
        document.getElementById('total-time').textContent = minutes || '<1';
        
        // Show end screen
        this.showScreen('end-screen');
    }
    
    restart() {
        this.trails = [];
        this.ripples = [];
        this.particles = [];
        this.start();
    }
    
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }
    
    animate(currentTime) {
        const deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.animate);
    }
    
    update(dt) {
        if (!this.isActive) return;
        
        // Update session time display
        this.sessionTime = performance.now() - this.sessionStart;
        const seconds = Math.floor(this.sessionTime / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('time-display').textContent = 
            `${mins}:${secs.toString().padStart(2, '0')}`;
        
        // Update breath phase
        this.ember.breathPhase += this.ember.breathSpeed * dt;
        
        // Calculate breath-based size
        const breathScale = Math.sin(this.ember.breathPhase);
        const breathSize = 1 + breathScale * 0.15;
        
        // Target radius based on breath and touch
        this.ember.targetRadius = this.ember.baseRadius * breathSize * this.ember.touchScale;
        
        // Smooth radius transition
        this.ember.radius += (this.ember.targetRadius - this.ember.radius) * 0.1;
        
        // Glow intensity follows breath
        this.ember.glowTarget = 0.5 + breathScale * 0.3 + this.ember.touchGlow;
        this.ember.glowIntensity += (this.ember.glowTarget - this.ember.glowIntensity) * 0.1;
        
        // Decay touch glow
        this.ember.touchGlow *= 0.95;
        
        // Hold duration
        if (this.ember.isBeingHeld) {
            this.ember.holdDuration += dt;
            
            // Warm up color slightly while held
            this.ember.lightness = Math.min(65, 55 + this.ember.holdDuration / 1000);
        } else {
            this.ember.lightness = 55;
        }
        
        // Update breath text
        const breathText = document.getElementById('breath-text');
        if (breathScale > 0.3) {
            breathText.textContent = 'breathe in';
        } else if (breathScale < -0.3) {
            breathText.textContent = 'breathe out';
        } else {
            breathText.textContent = 'breathe with me';
        }
        
        // Haptic feedback tied to breath
        this.updateBreathVibration();
        
        // Update trails
        this.trails.forEach(t => {
            t.alpha *= 0.96;
            t.radius *= 0.98;
        });
        this.trails = this.trails.filter(t => t.alpha > 0.05);
        
        // Update ripples
        this.ripples.forEach(r => {
            r.radius += 2;
            r.alpha -= 0.02;
        });
        this.ripples = this.ripples.filter(r => r.alpha > 0);
        
        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.008;
        });
        this.particles = this.particles.filter(p => p.alpha > 0);
        
        // Occasionally add ambient particles
        if (Math.random() < 0.1) {
            this.addParticle();
        }
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear with dark background
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, w, h);
        
        // Ambient warmth in background
        const bgGlow = ctx.createRadialGradient(
            this.ember.x, this.ember.y, 0,
            this.ember.x, this.ember.y, h * 0.8
        );
        bgGlow.addColorStop(0, `hsla(${this.ember.hue}, 80%, 15%, ${this.ember.glowIntensity * 0.3})`);
        bgGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bgGlow;
        ctx.fillRect(0, 0, w, h);
        
        // Draw trails (light painting)
        this.trails.forEach(t => {
            const gradient = ctx.createRadialGradient(
                t.x, t.y, 0,
                t.x, t.y, t.radius * 3
            );
            const hue = t.hue || this.ember.hue;
            gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${t.alpha})`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
            
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        
        // Draw ripples
        this.ripples.forEach(r => {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${this.ember.hue}, 80%, 60%, ${r.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Draw particles
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
            ctx.fill();
        });
        
        // Draw ember glow layers
        const glowLayers = [
            { scale: 4, alpha: 0.1 },
            { scale: 3, alpha: 0.15 },
            { scale: 2, alpha: 0.2 },
            { scale: 1.5, alpha: 0.3 }
        ];
        
        glowLayers.forEach(layer => {
            const gradient = ctx.createRadialGradient(
                this.ember.x, this.ember.y, 0,
                this.ember.x, this.ember.y, this.ember.radius * layer.scale
            );
            gradient.addColorStop(0, `hsla(${this.ember.hue}, ${this.ember.saturation}%, ${this.ember.lightness}%, ${layer.alpha * this.ember.glowIntensity})`);
            gradient.addColorStop(0.5, `hsla(${this.ember.hue + 10}, 90%, 50%, ${layer.alpha * 0.5 * this.ember.glowIntensity})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(this.ember.x, this.ember.y, this.ember.radius * layer.scale, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        
        // Draw ember core
        const coreGradient = ctx.createRadialGradient(
            this.ember.x - this.ember.radius * 0.2,
            this.ember.y - this.ember.radius * 0.2,
            0,
            this.ember.x,
            this.ember.y,
            this.ember.radius
        );
        coreGradient.addColorStop(0, `hsl(${this.ember.hue - 5}, 100%, ${this.ember.lightness + 20}%)`);
        coreGradient.addColorStop(0.5, `hsl(${this.ember.hue}, ${this.ember.saturation}%, ${this.ember.lightness}%)`);
        coreGradient.addColorStop(1, `hsl(${this.ember.hue + 10}, 90%, ${this.ember.lightness - 15}%)`);
        
        ctx.beginPath();
        ctx.arc(this.ember.x, this.ember.y, this.ember.radius, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Inner highlight
        const highlightGradient = ctx.createRadialGradient(
            this.ember.x - this.ember.radius * 0.3,
            this.ember.y - this.ember.radius * 0.3,
            0,
            this.ember.x - this.ember.radius * 0.3,
            this.ember.y - this.ember.radius * 0.3,
            this.ember.radius * 0.5
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(this.ember.x, this.ember.y, this.ember.radius, 0, Math.PI * 2);
        ctx.fillStyle = highlightGradient;
        ctx.fill();
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Keep ember centered
        this.ember.x = this.canvas.width / 2;
        this.ember.y = this.canvas.height / 2;
        
        // Adjust base radius for screen size
        this.ember.baseRadius = Math.min(80, Math.min(this.canvas.width, this.canvas.height) * 0.15);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.ember = new EmberApp();
});

