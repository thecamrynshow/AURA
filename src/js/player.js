/**
 * Project AURA - Player Controller
 * Movement tied to breath state
 */

class Player {
    constructor(world) {
        this.world = world;
        
        // Position
        this.x = 400;
        this.y = 400;
        this.targetX = this.x;
        this.targetY = this.y;
        
        // Velocity
        this.vx = 0;
        this.vy = 0;
        
        // Movement properties
        this.baseSpeed = 2;
        this.currentSpeed = this.baseSpeed;
        this.acceleration = 0.15;
        this.friction = 0.92;
        
        // Jump/float
        this.isFloating = false;
        this.floatHeight = 0;
        this.floatVelocity = 0;
        this.maxFloatHeight = 30;
        
        // Breath-based modifiers
        this.breathPower = 0.5;
        this.coherence = 0.5;
        this.regulationState = 'neutral';
        
        // Visual properties
        this.size = 20;
        this.glowSize = 40;
        this.pulsePhase = 0;
        this.trailParticles = [];
        
        // Input
        this.inputX = 0;
        this.inputY = 0;
        
        // Gravity modifier based on breath
        this.baseGravity = 0.3;
        this.currentGravity = this.baseGravity;
        
        // Setup input handlers
        this.setupInput();
    }

    setupInput() {
        // Listen to joystick events
        GameEvents.on('joystick', (value) => {
            this.inputX = value.x;
            this.inputY = value.y;
        });
        
        // Keyboard support for testing
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update(deltaTime, breathState) {
        // Update breath-related state
        this.breathPower = breathState.level || 0.5;
        this.coherence = (breathState.coherence || 50) / 100;
        this.regulationState = breathState.stability > 60 ? 'calm' : 
                               breathState.stability < 30 ? 'dysregulated' : 'neutral';
        
        // Adjust movement based on breath state
        this.updateMovementModifiers();
        
        // Process input
        this.processInput();
        
        // Apply physics
        this.applyPhysics(deltaTime);
        
        // Update visual effects
        this.updateVisuals(deltaTime);
        
        // Update trail
        this.updateTrail();
        
        // Clamp to world bounds
        this.x = Utils.clamp(this.x, 50, this.world.worldWidth - 50);
        this.y = Utils.clamp(this.y, 50, this.world.worldHeight - 50);
    }

    updateMovementModifiers() {
        // When breath is calm: glide farther, move smoother
        // When dysregulated: gravity increases, movement slows
        
        switch (this.regulationState) {
            case 'calm':
                this.currentSpeed = this.baseSpeed * 1.5;
                this.friction = 0.96; // Glide more
                this.currentGravity = this.baseGravity * 0.5;
                break;
            case 'dysregulated':
                this.currentSpeed = this.baseSpeed * 0.6;
                this.friction = 0.85; // Stop faster
                this.currentGravity = this.baseGravity * 2;
                break;
            default:
                this.currentSpeed = this.baseSpeed;
                this.friction = 0.92;
                this.currentGravity = this.baseGravity;
        }
        
        // Breath power affects speed directly
        this.currentSpeed *= 0.7 + this.breathPower * 0.6;
    }

    processInput() {
        let inputX = this.inputX;
        let inputY = this.inputY;
        
        // Keyboard fallback
        if (this.keys['w'] || this.keys['arrowup']) inputY = -1;
        if (this.keys['s'] || this.keys['arrowdown']) inputY = 1;
        if (this.keys['a'] || this.keys['arrowleft']) inputX = -1;
        if (this.keys['d'] || this.keys['arrowright']) inputX = 1;
        
        // Normalize if keyboard input
        const magnitude = Math.sqrt(inputX ** 2 + inputY ** 2);
        if (magnitude > 1) {
            inputX /= magnitude;
            inputY /= magnitude;
        }
        
        // Apply acceleration
        this.vx += inputX * this.acceleration * this.currentSpeed;
        this.vy += inputY * this.acceleration * this.currentSpeed;
    }

    applyPhysics(deltaTime) {
        const dt = deltaTime / 16; // Normalize to ~60fps
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Speed limit
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        const maxSpeed = this.currentSpeed * 3;
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
        
        // Apply velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Float mechanics (breath-powered lift)
        if (this.coherence > 0.6 && this.breathPower > 0.4) {
            // Rising on deep breaths
            this.floatVelocity += (this.maxFloatHeight - this.floatHeight) * 0.02;
        } else {
            // Gentle descent
            this.floatVelocity -= this.currentGravity * 0.1;
        }
        
        this.floatVelocity *= 0.95; // Damping
        this.floatHeight += this.floatVelocity;
        this.floatHeight = Utils.clamp(this.floatHeight, 0, this.maxFloatHeight);
    }

    updateVisuals(deltaTime) {
        // Pulse phase for glow effect
        this.pulsePhase += deltaTime * 0.003;
        
        // Size varies slightly with breath
        this.glowSize = 35 + this.breathPower * 20 + Math.sin(this.pulsePhase) * 5;
    }

    updateTrail() {
        // Leave trail particles when moving
        const speed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
        
        if (speed > 0.5 && Math.random() < 0.3) {
            this.trailParticles.push({
                x: this.x + Utils.random(-5, 5),
                y: this.y + this.floatHeight + Utils.random(-5, 5),
                size: Utils.random(2, 4),
                alpha: 0.6,
                life: 1
            });
        }
        
        // Update existing particles
        this.trailParticles = this.trailParticles.filter(p => {
            p.alpha -= 0.02;
            p.size *= 0.98;
            p.y -= 0.3;
            return p.alpha > 0;
        });
        
        // Limit particles
        if (this.trailParticles.length > 50) {
            this.trailParticles.shift();
        }
    }

    render(ctx, camera) {
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y - this.floatHeight;
        
        // Draw trail
        this.trailParticles.forEach(p => {
            const px = p.x - camera.x;
            const py = p.y - camera.y;
            
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 255, 218, ${p.alpha * 0.5})`;
            ctx.fill();
        });
        
        // Draw shadow
        const shadowSize = this.size * (1 - this.floatHeight / this.maxFloatHeight * 0.3);
        ctx.beginPath();
        ctx.ellipse(screenX, this.y - camera.y + 5, shadowSize, shadowSize * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();
        
        // Draw outer glow
        const glowAlpha = 0.2 + this.coherence * 0.3;
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, this.glowSize
        );
        
        const glowColor = this.regulationState === 'calm' ? '100, 255, 218' :
                         this.regulationState === 'dysregulated' ? '255, 100, 100' :
                         '150, 200, 255';
        
        gradient.addColorStop(0, `rgba(${glowColor}, ${glowAlpha})`);
        gradient.addColorStop(0.5, `rgba(${glowColor}, ${glowAlpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${glowColor}, 0)`);
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw core
        const pulse = Math.sin(this.pulsePhase * 2) * 0.1 + 1;
        const coreSize = this.size * pulse;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, coreSize, 0, Math.PI * 2);
        
        const coreGradient = ctx.createRadialGradient(
            screenX - coreSize * 0.3, screenY - coreSize * 0.3, 0,
            screenX, screenY, coreSize
        );
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGradient.addColorStop(0.5, `rgba(${glowColor}, 0.8)`);
        coreGradient.addColorStop(1, `rgba(${glowColor}, 0.6)`);
        
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Inner bright spot
        ctx.beginPath();
        ctx.arc(screenX - coreSize * 0.2, screenY - coreSize * 0.2, coreSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }

    // Get position for camera following
    getPosition() {
        return { x: this.x, y: this.y };
    }

    // Set position (for teleporting)
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }

    // Check collision with a point/circle
    collidesWithCircle(cx, cy, radius) {
        return Utils.distance(this.x, this.y, cx, cy) < radius + this.size;
    }

    // Get current speed magnitude
    getSpeed() {
        return Math.sqrt(this.vx ** 2 + this.vy ** 2);
    }

    // Check if player is mostly still
    isStill() {
        return this.getSpeed() < 0.2;
    }
}
