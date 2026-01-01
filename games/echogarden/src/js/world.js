/**
 * Echo Garden - World Renderer
 * Mystical garden environment
 */

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Visual state
        this.time = 0;
        this.harmonyLevel = 0;
        this.soundIntensity = 0;
        
        // Background elements
        this.stars = [];
        this.particles = [];
        this.groundSegments = [];
        
        this.resize();
        this.generate();
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        this.generate();
    }
    
    generate() {
        // Generate stars
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Utils.random(0, this.width),
                y: Utils.random(0, this.height * 0.7),
                size: Utils.random(1, 2.5),
                brightness: Utils.random(0.3, 1),
                twinkleSpeed: Utils.random(1, 3),
                twinkleOffset: Utils.random(0, Math.PI * 2)
            });
        }
        
        // Generate ground contour
        this.groundSegments = [];
        const groundY = this.height * 0.85;
        const segmentWidth = 50;
        
        for (let x = 0; x <= this.width + segmentWidth; x += segmentWidth) {
            this.groundSegments.push({
                x: x,
                y: groundY + Utils.random(-10, 10),
                grassHeight: Utils.random(15, 30),
                grassDensity: Utils.randomInt(3, 6)
            });
        }
    }
    
    update(deltaTime, soundState) {
        this.time += deltaTime;
        
        // Update visual state from sound
        if (soundState) {
            this.soundIntensity = Utils.lerp(this.soundIntensity, soundState.volume * 3, 0.1);
            this.harmonyLevel = Utils.lerp(this.harmonyLevel, soundState.pitchStability, 0.05);
        }
        
        // Spawn particles based on sound
        if (Math.random() < this.soundIntensity * 0.1) {
            this.spawnParticle();
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.01; // Float up
            p.life -= deltaTime * 0.001;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });
    }
    
    spawnParticle() {
        this.particles.push({
            x: Utils.random(0, this.width),
            y: this.height * 0.85 + Utils.random(-20, 20),
            vx: Utils.random(-0.3, 0.3),
            vy: Utils.random(-0.5, -0.2),
            size: Utils.random(2, 5),
            life: Utils.random(2, 4),
            maxLife: 4,
            alpha: 1,
            hue: Utils.random(100, 140)
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawSky();
        this.drawStars();
        this.drawAurora();
        this.drawGround();
        this.drawGrass();
        this.drawParticles();
        this.drawVignette();
    }
    
    drawSky() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        
        // Adjust sky based on harmony
        const harmonyBoost = this.harmonyLevel * 20;
        
        gradient.addColorStop(0, `rgb(${10 + harmonyBoost * 0.3}, ${8 + harmonyBoost * 0.2}, ${18 + harmonyBoost * 0.5})`);
        gradient.addColorStop(0.5, `rgb(${18 + harmonyBoost * 0.2}, ${16 + harmonyBoost * 0.3}, ${26 + harmonyBoost * 0.4})`);
        gradient.addColorStop(1, `rgb(${26 + harmonyBoost * 0.1}, ${21 + harmonyBoost * 0.2}, ${37 + harmonyBoost * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawStars() {
        const ctx = this.ctx;
        
        this.stars.forEach(star => {
            const twinkle = Math.sin(this.time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
            const brightness = star.brightness * (0.5 + twinkle * 0.5) * (0.5 + this.harmonyLevel * 0.5);
            
            // Star glow
            if (star.brightness > 0.7) {
                const gradient = ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 4
                );
                gradient.addColorStop(0, `rgba(200, 255, 200, ${brightness * 0.3})`);
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            // Star core
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fill();
        });
    }
    
    drawAurora() {
        if (this.harmonyLevel < 0.3) return;
        
        const ctx = this.ctx;
        const intensity = (this.harmonyLevel - 0.3) / 0.7;
        
        // Aurora waves
        for (let i = 0; i < 3; i++) {
            const waveY = this.height * 0.2 + i * 40;
            const gradient = ctx.createLinearGradient(0, waveY - 50, 0, waveY + 100);
            
            const hue = 120 + i * 40 + Math.sin(this.time * 0.0005) * 20;
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(0.5, `hsla(${hue}, 70%, 50%, ${0.1 * intensity})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.moveTo(0, waveY);
            
            for (let x = 0; x <= this.width; x += 20) {
                const y = waveY + Math.sin(this.time * 0.001 + x * 0.01 + i) * 30;
                ctx.lineTo(x, y);
            }
            
            ctx.lineTo(this.width, waveY + 100);
            ctx.lineTo(0, waveY + 100);
            ctx.closePath();
            
            ctx.fillStyle = gradient;
            ctx.fill();
        }
    }
    
    drawGround() {
        const ctx = this.ctx;
        const groundY = this.height * 0.85;
        
        // Ground gradient
        const gradient = ctx.createLinearGradient(0, groundY - 30, 0, this.height);
        gradient.addColorStop(0, `rgba(20, 30, 20, 0.9)`);
        gradient.addColorStop(0.3, `rgba(15, 25, 15, 0.95)`);
        gradient.addColorStop(1, `rgba(10, 15, 10, 1)`);
        
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        // Follow ground contour
        this.groundSegments.forEach((seg, i) => {
            if (i === 0) {
                ctx.lineTo(seg.x, seg.y);
            } else {
                const prev = this.groundSegments[i - 1];
                const cpX = (prev.x + seg.x) / 2;
                ctx.quadraticCurveTo(cpX, prev.y, seg.x, seg.y);
            }
        });
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Ground glow
        const glowGradient = ctx.createLinearGradient(0, groundY - 20, 0, groundY + 30);
        glowGradient.addColorStop(0, 'transparent');
        glowGradient.addColorStop(0.5, `rgba(127, 255, 127, ${0.05 + this.soundIntensity * 0.05})`);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, groundY - 20, this.width, 50);
    }
    
    drawGrass() {
        const ctx = this.ctx;
        
        this.groundSegments.forEach(seg => {
            for (let i = 0; i < seg.grassDensity; i++) {
                const grassX = seg.x + Utils.random(-20, 20);
                const grassHeight = seg.grassHeight * (0.7 + Math.random() * 0.3);
                const sway = Math.sin(this.time * 0.001 + grassX * 0.05) * 5;
                
                ctx.beginPath();
                ctx.moveTo(grassX, seg.y);
                ctx.quadraticCurveTo(
                    grassX + sway * 0.5, seg.y - grassHeight * 0.5,
                    grassX + sway, seg.y - grassHeight
                );
                
                ctx.strokeStyle = `hsla(120, 40%, ${25 + this.harmonyLevel * 10}%, 0.6)`;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        });
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 2
            );
            gradient.addColorStop(0, `hsla(${p.hue}, 70%, 60%, ${p.alpha * 0.6})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 60%, 80%, ${p.alpha})`;
            ctx.fill();
        });
    }
    
    drawVignette() {
        const ctx = this.ctx;
        
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.9
        );
        
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

