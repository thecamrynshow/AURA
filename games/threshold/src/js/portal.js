/* ============================================
   THRESHOLD — Portal Visualization
   Visual representation of state transition
   ============================================ */

class Portal {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Portal state
        this.progress = 0;
        this.fromColor = '#ef4444';
        this.toColor = '#06b6d4';
        
        // Particles
        this.particles = [];
        this.numParticles = 100;
        
        // Animation
        this.time = 0;
        this.animationFrame = null;
        
        // Breath state
        this.breathPhase = 'idle';
        this.breathIntensity = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setStates(fromState, toState) {
        this.fromColor = STATES[fromState]?.color || '#6b7280';
        this.toColor = STATES[toState]?.color || '#06b6d4';
        this.progress = 0;
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: randomFloat(0, this.width),
                y: randomFloat(0, this.height),
                size: randomFloat(1, 3),
                speed: randomFloat(0.5, 2),
                angle: randomFloat(0, Math.PI * 2),
                opacity: randomFloat(0.2, 0.6),
                pulseOffset: randomFloat(0, Math.PI * 2)
            });
        }
    }

    setProgress(value) {
        this.progress = clamp(value, 0, 1);
    }

    setBreathPhase(phase) {
        this.breathPhase = phase;
    }

    update() {
        this.time++;
        
        // Update breath intensity
        const targetIntensity = this.breathPhase === 'inhale' ? 1 : 
                               this.breathPhase === 'hold' ? 0.8 : 0.3;
        this.breathIntensity = lerp(this.breathIntensity, targetIntensity, 0.05);
        
        // Update particles
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.particles.forEach(p => {
            // Move toward center as progress increases
            const targetX = centerX;
            const targetY = centerY;
            
            const pullStrength = this.progress * 0.02 * this.breathIntensity;
            
            const dx = targetX - p.x;
            const dy = targetY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 50) {
                p.x += (dx / dist) * pullStrength * dist * 0.01;
                p.y += (dy / dist) * pullStrength * dist * 0.01;
            }
            
            // Add some drift
            p.x += Math.cos(p.angle) * p.speed * 0.5;
            p.y += Math.sin(p.angle) * p.speed * 0.5;
            
            // Slowly rotate angle
            p.angle += 0.01;
            
            // Wrap around
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;
        });
    }

    draw() {
        // Clear with fade
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Draw portal rings
        this.drawPortalRings(centerX, centerY);
        
        // Draw particles
        this.drawParticles();
        
        // Draw central glow
        this.drawCentralGlow(centerX, centerY);
    }

    drawPortalRings(cx, cy) {
        const maxRadius = Math.min(this.width, this.height) * 0.35;
        const numRings = 5;
        
        for (let i = 0; i < numRings; i++) {
            const baseRadius = (maxRadius / numRings) * (i + 1);
            const pulse = Math.sin(this.time * 0.02 + i * 0.5) * 10 * this.breathIntensity;
            const radius = baseRadius + pulse;
            
            // Color transition based on progress
            const ringProgress = clamp((this.progress - i * 0.15) * 2, 0, 1);
            const color = this.lerpColor(this.fromColor, this.toColor, ringProgress);
            
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2 - i * 0.3;
            this.ctx.globalAlpha = 0.3 + ringProgress * 0.4;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            // Particle color based on progress
            const color = this.lerpColor(this.fromColor, this.toColor, this.progress);
            
            // Pulse size
            const pulse = Math.sin(this.time * 0.05 + p.pulseOffset) * 0.5 + 1;
            const size = p.size * pulse * (1 + this.breathIntensity * 0.5);
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = p.opacity * (0.5 + this.progress * 0.5);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    drawCentralGlow(cx, cy) {
        const glowRadius = 100 + this.progress * 50 + this.breathIntensity * 30;
        
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        const color = this.lerpColor(this.fromColor, this.toColor, this.progress);
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.hexToRgba(color, 0.3));
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // Helper: interpolate between two hex colors
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(lerp(c1.r, c2.r, t));
        const g = Math.round(lerp(c1.g, c2.g, t));
        const b = Math.round(lerp(c1.b, c2.b, t));
        
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    hexToRgba(hex, alpha) {
        const rgb = this.hexToRgb(hex);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }

    start() {
        this.animate();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        this.update();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

console.log('Threshold Portal loaded');


