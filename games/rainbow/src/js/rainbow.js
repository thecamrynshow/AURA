/**
 * Rainbow Painter - Rainbow & Sky System
 */

// Rainbow colors in order
const RAINBOW_COLORS = [
    { name: 'red', hex: '#ff6b6b', hsl: [0, 100, 71] },
    { name: 'orange', hex: '#ffa94d', hsl: [30, 100, 65] },
    { name: 'yellow', hex: '#ffd43b', hsl: [45, 100, 61] },
    { name: 'green', hex: '#69db7c', hsl: [135, 62, 64] },
    { name: 'blue', hex: '#74c0fc', hsl: [210, 95, 72] },
    { name: 'indigo', hex: '#b197fc', hsl: [260, 93, 79] },
    { name: 'violet', hex: '#f783ac', hsl: [330, 87, 74] }
];

class Rainbow {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        this.stripes = [];
        this.isComplete = false;
        this.completionTime = 0;
        this.celebrationPhase = 0;
        
        // Animation
        this.drawProgress = 0;
        this.targetProgress = 0;
        this.glowIntensity = 0;
    }
    
    addStripe(colorIndex) {
        if (colorIndex >= RAINBOW_COLORS.length) return false;
        
        const color = RAINBOW_COLORS[colorIndex];
        this.stripes.push({
            colorIndex,
            color: color.hex,
            hsl: color.hsl,
            progress: 0,
            targetProgress: 1,
            glow: 1
        });
        
        if (this.stripes.length >= RAINBOW_COLORS.length) {
            this.isComplete = true;
            this.completionTime = performance.now();
        }
        
        return true;
    }
    
    update(deltaTime) {
        // Update stripe animations
        this.stripes.forEach(stripe => {
            stripe.progress = Utils.lerp(stripe.progress, stripe.targetProgress, 0.05);
            stripe.glow = Math.max(0, stripe.glow - deltaTime * 0.002);
        });
        
        // Celebration animation
        if (this.isComplete) {
            this.celebrationPhase += deltaTime * 0.003;
            this.glowIntensity = 0.3 + Math.sin(this.celebrationPhase) * 0.2;
        }
    }
    
    render(ctx) {
        if (this.stripes.length === 0) return;
        
        const stripeHeight = this.height / RAINBOW_COLORS.length;
        
        // Draw rainbow arc
        ctx.save();
        
        // Outer glow for complete rainbow
        if (this.isComplete) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 30 + Math.sin(this.celebrationPhase * 2) * 10;
        }
        
        // Draw each stripe as an arc
        this.stripes.forEach((stripe, i) => {
            const radius = this.width / 2 - i * stripeHeight;
            const progress = stripe.progress;
            
            if (progress < 0.01) return;
            
            ctx.beginPath();
            ctx.arc(
                this.x, 
                this.y, 
                radius,
                Math.PI,
                Math.PI + Math.PI * progress
            );
            
            // Gradient for depth
            const gradient = ctx.createRadialGradient(
                this.x, this.y, radius - stripeHeight,
                this.x, this.y, radius
            );
            
            const [h, s, l] = stripe.hsl;
            gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l + 10}%, ${0.9 + stripe.glow * 0.1})`);
            gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${0.95 + stripe.glow * 0.05})`);
            gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l - 5}%, ${0.85})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = stripeHeight - 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Glow effect for newly added stripe
            if (stripe.glow > 0.1) {
                ctx.shadowColor = stripe.color;
                ctx.shadowBlur = 20 * stripe.glow;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
        
        ctx.restore();
    }
    
    getNextColorIndex() {
        return this.stripes.length;
    }
}

class Cloud {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = Utils.random(0.01, 0.03);
        this.bobPhase = Utils.random(0, Math.PI * 2);
        this.bobSpeed = Utils.random(0.001, 0.002);
        this.opacity = Utils.random(0.7, 0.95);
        
        // Cloud shape (multiple circles)
        this.puffs = [];
        const puffCount = Utils.randomInt(3, 5);
        for (let i = 0; i < puffCount; i++) {
            this.puffs.push({
                x: Utils.random(-size * 0.3, size * 0.3),
                y: Utils.random(-size * 0.2, size * 0.2),
                radius: Utils.random(size * 0.4, size * 0.7)
            });
        }
    }
    
    update(deltaTime, canvasWidth) {
        this.x += this.speed * deltaTime;
        this.bobPhase += this.bobSpeed * deltaTime;
        
        // Wrap around
        if (this.x - this.size > canvasWidth) {
            this.x = -this.size * 2;
        }
    }
    
    render(ctx) {
        const bobOffset = Math.sin(this.bobPhase) * 5;
        
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        this.puffs.forEach(puff => {
            const gradient = ctx.createRadialGradient(
                this.x + puff.x, this.y + puff.y + bobOffset, 0,
                this.x + puff.x, this.y + puff.y + bobOffset, puff.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(this.x + puff.x, this.y + puff.y + bobOffset, puff.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
        
        ctx.restore();
    }
}

class Sun {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rayPhase = 0;
        this.pulsePhase = 0;
    }
    
    update(deltaTime) {
        this.rayPhase += deltaTime * 0.001;
        this.pulsePhase += deltaTime * 0.002;
    }
    
    render(ctx) {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3 * pulse
        );
        gradient.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
        gradient.addColorStop(0.3, 'rgba(255, 236, 179, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 236, 179, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Rays
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rayPhase);
        
        const rayCount = 12;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * Math.PI * 2;
            const rayLength = this.radius * 2 * pulse;
            
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * this.radius * 1.1,
                Math.sin(angle) * this.radius * 1.1
            );
            ctx.lineTo(
                Math.cos(angle) * rayLength,
                Math.sin(angle) * rayLength
            );
            ctx.strokeStyle = 'rgba(255, 236, 179, 0.4)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Sun body
        const sunGradient = ctx.createRadialGradient(
            this.x - this.radius * 0.2, this.y - this.radius * 0.2, 0,
            this.x, this.y, this.radius
        );
        sunGradient.addColorStop(0, '#fff9c4');
        sunGradient.addColorStop(0.5, '#ffeb3b');
        sunGradient.addColorStop(1, '#ffc107');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = sunGradient;
        ctx.fill();
    }
}

class Sparkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.decay = Utils.random(0.002, 0.004);
        this.size = Utils.random(2, 6);
        this.color = RAINBOW_COLORS[Utils.randomInt(0, RAINBOW_COLORS.length - 1)].hex;
        this.vx = Utils.random(-0.5, 0.5);
        this.vy = Utils.random(-1, 0);
        this.rotation = Utils.random(0, Math.PI * 2);
        this.rotationSpeed = Utils.random(-0.01, 0.01);
    }
    
    update(deltaTime) {
        this.life -= this.decay * deltaTime;
        this.x += this.vx * deltaTime * 0.1;
        this.y += this.vy * deltaTime * 0.1;
        this.rotation += this.rotationSpeed * deltaTime;
        this.vy += 0.001 * deltaTime; // Slight gravity
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.life;
        
        // Star shape
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * this.size * 2,
                Math.sin(angle) * this.size * 2
            );
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

class Sky {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Sky elements
        this.sun = new Sun(width * 0.85, height * 0.15, 50);
        this.clouds = [];
        this.sparkles = [];
        this.rainbows = [];
        this.currentRainbow = null;
        
        // Stats
        this.rainbowsCompleted = 0;
        this.totalBreaths = 0;
        
        // Generate initial clouds
        this.generateClouds();
    }
    
    generateClouds() {
        const cloudCount = Utils.randomInt(4, 7);
        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push(new Cloud(
                Utils.random(0, this.width),
                Utils.random(this.height * 0.1, this.height * 0.4),
                Utils.random(60, 120)
            ));
        }
    }
    
    startNewRainbow() {
        // Position rainbow - alternate sides
        const isLeft = this.rainbowsCompleted % 2 === 0;
        const x = isLeft ? this.width * 0.3 : this.width * 0.7;
        const y = this.height * 0.9;
        const size = Math.min(this.width, this.height) * 0.7;
        
        this.currentRainbow = new Rainbow(x, y, size, size * 0.4);
        this.rainbows.push(this.currentRainbow);
    }
    
    paintNextColor() {
        if (!this.currentRainbow) {
            this.startNewRainbow();
        }
        
        const colorIndex = this.currentRainbow.getNextColorIndex();
        if (colorIndex >= RAINBOW_COLORS.length) {
            // Current rainbow complete, start new one
            this.rainbowsCompleted++;
            this.startNewRainbow();
            return this.paintNextColor();
        }
        
        this.currentRainbow.addStripe(colorIndex);
        this.totalBreaths++;
        
        // Add celebration sparkles
        this.addSparkles(colorIndex);
        
        // Check if rainbow just completed
        if (this.currentRainbow.isComplete) {
            this.onRainbowComplete();
        }
        
        return colorIndex;
    }
    
    addSparkles(colorIndex) {
        const color = RAINBOW_COLORS[colorIndex];
        const count = 15;
        
        for (let i = 0; i < count; i++) {
            const x = Utils.random(this.width * 0.2, this.width * 0.8);
            const y = Utils.random(this.height * 0.2, this.height * 0.6);
            const sparkle = new Sparkle(x, y);
            sparkle.color = color.hex;
            this.sparkles.push(sparkle);
        }
    }
    
    onRainbowComplete() {
        // Big sparkle burst
        for (let i = 0; i < 50; i++) {
            const angle = Utils.random(0, Math.PI * 2);
            const dist = Utils.random(50, 200);
            const x = this.width / 2 + Math.cos(angle) * dist;
            const y = this.height / 2 + Math.sin(angle) * dist;
            this.sparkles.push(new Sparkle(x, y));
        }
        
        GameEvents.emit('rainbowComplete', { count: this.rainbowsCompleted + 1 });
    }
    
    getNextColor() {
        if (!this.currentRainbow) {
            return RAINBOW_COLORS[0];
        }
        const idx = this.currentRainbow.getNextColorIndex();
        return RAINBOW_COLORS[idx] || RAINBOW_COLORS[0];
    }
    
    getProgress() {
        if (!this.currentRainbow) return 0;
        return this.currentRainbow.stripes.length;
    }
    
    update(deltaTime) {
        // Update sun
        this.sun.update(deltaTime);
        
        // Update clouds
        this.clouds.forEach(cloud => cloud.update(deltaTime, this.width));
        
        // Update rainbows
        this.rainbows.forEach(rainbow => rainbow.update(deltaTime));
        
        // Update and clean sparkles
        this.sparkles.forEach(s => s.update(deltaTime));
        this.sparkles = this.sparkles.filter(s => !s.isDead());
    }
    
    render(ctx) {
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#B4E7F8');
        skyGradient.addColorStop(1, '#E8F5E9');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Ground
        const groundGradient = ctx.createLinearGradient(0, this.height * 0.85, 0, this.height);
        groundGradient.addColorStop(0, '#90EE90');
        groundGradient.addColorStop(1, '#228B22');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.height * 0.85, this.width, this.height * 0.15);
        
        // Grass tufts
        ctx.fillStyle = '#32CD32';
        for (let x = 0; x < this.width; x += 20) {
            const h = Utils.random(5, 15);
            ctx.beginPath();
            ctx.moveTo(x, this.height * 0.85);
            ctx.lineTo(x + 5, this.height * 0.85 - h);
            ctx.lineTo(x + 10, this.height * 0.85);
            ctx.fill();
        }
        
        // Render sun (behind clouds)
        this.sun.render(ctx);
        
        // Render rainbows
        this.rainbows.forEach(rainbow => rainbow.render(ctx));
        
        // Render clouds
        this.clouds.forEach(cloud => cloud.render(ctx));
        
        // Render sparkles
        this.sparkles.forEach(s => s.render(ctx));
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.sun.x = width * 0.85;
        this.sun.y = height * 0.15;
    }
}

