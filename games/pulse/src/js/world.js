/* ============================================
   Pulse — World Renderer
   Visual effects and rendering
   ============================================ */

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;
        
        // Visual state
        this.pulsePhase = 0;
        this.flow = 0;
        this.breathLevel = 0;
        
        // Colors
        this.colors = {
            bg: '#0a0612',
            primary: '#ff6b9d',
            secondary: '#c084fc',
            tertiary: '#818cf8',
            text: '#f8f0ff'
        };
        
        // Particles for ambient effect
        this.particles = [];
        this.initParticles();
        
        // Ring effects
        this.rings = [];
        
        // Hit effects
        this.hitEffects = [];
        
        this.resize();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Reinitialize particles on resize
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        const count = Math.floor((this.width * this.height) / 15000);
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Utils.random(1, 3),
                speed: Utils.random(0.2, 0.8),
                opacity: Utils.random(0.2, 0.6),
                hue: Utils.random(280, 340) // Purple to pink range
            });
        }
    }

    update(deltaTime, rhythmEngine, breathLevel) {
        this.pulsePhase += deltaTime * 0.002;
        this.flow = rhythmEngine.getFlow();
        this.breathLevel = breathLevel;
        
        // Update particles
        this.particles.forEach(p => {
            // Drift upward with slight horizontal wobble
            p.y -= p.speed * (1 + this.flow * 0.5);
            p.x += Math.sin(this.pulsePhase + p.y * 0.01) * 0.3;
            
            // Wrap around
            if (p.y < -10) {
                p.y = this.height + 10;
                p.x = Math.random() * this.width;
            }
            
            // Pulse opacity with music
            p.opacity = Utils.lerp(p.opacity, 0.3 + this.flow * 0.4, 0.1);
        });
        
        // Update hit effects
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.life -= deltaTime;
            effect.radius += deltaTime * 0.3;
            effect.opacity = effect.life / effect.maxLife;
            return effect.life > 0;
        });
    }

    render(rhythmEngine, breathLevel) {
        const ctx = this.ctx;
        
        // Clear with gradient background
        this.renderBackground(ctx);
        
        // Render particles
        this.renderParticles(ctx);
        
        // Render beat track circles
        this.renderBeatTracks(ctx);
        
        // Render incoming beats
        this.renderBeats(ctx, rhythmEngine.getBeats());
        
        // Render central pulse
        this.renderPulse(ctx, rhythmEngine, breathLevel);
        
        // Render hit effects
        this.renderHitEffects(ctx);
    }

    renderBackground(ctx) {
        // Deep gradient background
        const gradient = ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, Math.max(this.width, this.height) * 0.7
        );
        
        gradient.addColorStop(0, '#12081a');
        gradient.addColorStop(0.5, '#0a0612');
        gradient.addColorStop(1, '#050308');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Add glow based on flow
        if (this.flow > 0.2) {
            const glowGradient = ctx.createRadialGradient(
                this.centerX, this.centerY, 0,
                this.centerX, this.centerY, 300
            );
            glowGradient.addColorStop(0, `rgba(255, 107, 157, ${this.flow * 0.15})`);
            glowGradient.addColorStop(0.5, `rgba(192, 132, 252, ${this.flow * 0.08})`);
            glowGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    renderParticles(ctx) {
        this.particles.forEach(p => {
            const [r, g, b] = Utils.hslToRgb(p.hue / 360, 0.6, 0.6);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
            ctx.fill();
        });
    }

    renderBeatTracks(ctx) {
        // Concentric circles showing beat track
        const trackRadius = 300;
        
        // Outer guide ring
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, trackRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 157, ${0.1 + this.flow * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Inner guide ring (target zone)
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 80, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(192, 132, 252, ${0.2 + this.flow * 0.2})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    renderBeats(ctx, beats) {
        beats.forEach(beat => {
            if (beat.hit) {
                // Render hit beat (fading out)
                const fadeProgress = (Date.now() - beat.targetTime) / 500;
                if (fadeProgress < 1) {
                    ctx.save();
                    ctx.globalAlpha = 1 - fadeProgress;
                    ctx.translate(beat.x, beat.y);
                    ctx.scale(1 + fadeProgress * 0.5, 1 + fadeProgress * 0.5);
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, beat.radius * beat.scale * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = this.colors.primary;
                    ctx.fill();
                    
                    ctx.restore();
                }
                return;
            }
            
            // Determine beat color based on type
            let beatColor = this.colors.primary;
            switch (beat.type) {
                case 'inhale':
                    beatColor = this.colors.secondary;
                    break;
                case 'exhale':
                    beatColor = this.colors.tertiary;
                    break;
                case 'hold':
                    beatColor = this.colors.primary;
                    break;
            }
            
            ctx.save();
            ctx.globalAlpha = beat.opacity;
            ctx.translate(beat.x, beat.y);
            
            // Outer ring
            const ringRadius = beat.radius * beat.scale;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = beatColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Inner glow
            const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, ringRadius * 0.8);
            innerGradient.addColorStop(0, `rgba(255, 107, 157, 0.3)`);
            innerGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = innerGradient;
            ctx.fill();
            
            // Core dot
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = beatColor;
            ctx.fill();
            
            ctx.restore();
        });
    }

    renderPulse(ctx, rhythmEngine, breathLevel) {
        const baseRadius = 60;
        const pulseAmount = Math.sin(this.pulsePhase * Math.PI) * 0.15;
        const breathAmount = breathLevel * 0.2;
        const flowAmount = this.flow * 0.1;
        
        const radius = baseRadius * (1 + pulseAmount + breathAmount + flowAmount);
        
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        
        // Outer glow rings
        for (let i = 3; i >= 1; i--) {
            const ringRadius = radius + i * 20;
            const opacity = (0.1 + this.flow * 0.1) * (1 - i * 0.2);
            
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 107, 157, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Main pulse gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, `rgba(255, 107, 157, ${0.9 + this.flow * 0.1})`);
        gradient.addColorStop(0.5, `rgba(192, 132, 252, ${0.6 + this.flow * 0.2})`);
        gradient.addColorStop(1, `rgba(129, 140, 248, ${0.3})`);
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Inner bright core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.5);
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        coreGradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = coreGradient;
        ctx.fill();
        
        // Beat indicator (pulsing ring at edge of target zone)
        const bpm = rhythmEngine.getBPM();
        const beatPhase = (Date.now() % (60000 / bpm)) / (60000 / bpm);
        const beatPulse = Math.sin(beatPhase * Math.PI * 2);
        
        ctx.beginPath();
        ctx.arc(0, 0, 80 + beatPulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 107, 157, ${0.5 + beatPulse * 0.3})`;
        ctx.lineWidth = 2 + beatPulse;
        ctx.stroke();
        
        ctx.restore();
    }

    renderHitEffects(ctx) {
        this.hitEffects.forEach(effect => {
            ctx.save();
            ctx.globalAlpha = effect.opacity;
            ctx.translate(effect.x, effect.y);
            
            // Expanding ring
            ctx.beginPath();
            ctx.arc(0, 0, effect.radius, 0, Math.PI * 2);
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3 * effect.opacity;
            ctx.stroke();
            
            ctx.restore();
        });
    }

    addHitEffect(x, y, accuracy) {
        let color = this.colors.primary;
        let maxLife = 300;
        
        switch (accuracy) {
            case 'perfect':
                color = '#ffffff';
                maxLife = 400;
                break;
            case 'good':
                color = this.colors.secondary;
                maxLife = 350;
                break;
            case 'ok':
                color = this.colors.tertiary;
                maxLife = 300;
                break;
        }
        
        this.hitEffects.push({
            x: x,
            y: y,
            radius: 30,
            opacity: 1,
            life: maxLife,
            maxLife: maxLife,
            color: color
        });
    }

    getCenterX() {
        return this.centerX;
    }

    getCenterY() {
        return this.centerY;
    }
}


