/* Star Catcher - Light Net */

class LightNet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseRadius = 30;
        this.currentRadius = this.baseRadius;
        this.maxRadius = 120;
        this.targetRadius = this.baseRadius;
        
        // Animation
        this.pulsePhase = 0;
        this.glowIntensity = 0;
        this.particles = [];
        
        // Ring segments for visual effect
        this.segments = 12;
        this.segmentOffsets = [];
        for (let i = 0; i < this.segments; i++) {
            this.segmentOffsets.push(Utils.random(0, Math.PI * 2));
        }
        
        // Colors
        this.innerColor = '#64d8ff';
        this.outerColor = '#b794f6';
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setBreathLevel(level) {
        // Map breath level to net size
        const normalizedLevel = Utils.clamp(level * 5, 0, 1);
        this.targetRadius = this.baseRadius + (this.maxRadius - this.baseRadius) * normalizedLevel;
        this.glowIntensity = normalizedLevel;
        
        // Spawn particles when expanding
        if (normalizedLevel > 0.3 && Math.random() < normalizedLevel * 0.3) {
            this.spawnParticle();
        }
    }

    spawnParticle() {
        const angle = Utils.random(0, Math.PI * 2);
        const dist = this.currentRadius * 0.9;
        this.particles.push({
            x: this.x + Math.cos(angle) * dist,
            y: this.y + Math.sin(angle) * dist,
            vx: Math.cos(angle) * Utils.random(1, 3),
            vy: Math.sin(angle) * Utils.random(1, 3) - 1,
            size: Utils.random(2, 5),
            alpha: 1,
            hue: Utils.random(180, 280)
        });
    }

    update(deltaTime) {
        // Smooth radius transition
        this.currentRadius = Utils.lerp(this.currentRadius, this.targetRadius, 0.15);
        
        // Pulse animation
        this.pulsePhase += deltaTime * 0.003;
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * (deltaTime / 16);
            p.y += p.vy * (deltaTime / 16);
            p.alpha -= 0.02;
            p.size *= 0.98;
            return p.alpha > 0;
        });
        
        // Cap particles
        if (this.particles.length > 50) {
            this.particles.shift();
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const pulse = Math.sin(this.pulsePhase) * 5;
        const radius = this.currentRadius + pulse;
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 1.5);
        glowGradient.addColorStop(0, `rgba(100, 216, 255, ${this.glowIntensity * 0.2})`);
        glowGradient.addColorStop(0.5, `rgba(183, 148, 246, ${this.glowIntensity * 0.1})`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Net web pattern
        ctx.strokeStyle = `rgba(100, 216, 255, ${0.3 + this.glowIntensity * 0.4})`;
        ctx.lineWidth = 1;
        
        // Radial lines
        for (let i = 0; i < this.segments; i++) {
            const angle = (i / this.segments) * Math.PI * 2;
            const wobble = Math.sin(this.pulsePhase + this.segmentOffsets[i]) * 3;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * (radius + wobble),
                Math.sin(angle) * (radius + wobble)
            );
            ctx.stroke();
        }
        
        // Concentric rings
        for (let r = 0.3; r <= 1; r += 0.35) {
            ctx.beginPath();
            ctx.arc(0, 0, radius * r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Main ring
        const ringGradient = ctx.createLinearGradient(-radius, 0, radius, 0);
        ringGradient.addColorStop(0, this.innerColor);
        ringGradient.addColorStop(0.5, this.outerColor);
        ringGradient.addColorStop(1, this.innerColor);
        
        ctx.strokeStyle = ringGradient;
        ctx.lineWidth = 3 + this.glowIntensity * 2;
        ctx.shadowColor = this.innerColor;
        ctx.shadowBlur = 15 + this.glowIntensity * 10;
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center point
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 4 + this.glowIntensity * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw particles outside of translate
        this.particles.forEach(p => {
            ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    getRadius() {
        return this.currentRadius;
    }
}

console.log('Light Net loaded');


