/* ============================================
   ZONE — Visual World
   Landscape that transforms with emotional zones
   ============================================ */

class ZoneWorld {
    constructor() {
        this.canvas = document.getElementById('landscapeCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        this.currentZone = 'green';
        this.targetZone = 'green';
        this.transitionProgress = 1;
        
        this.particles = [];
        this.maxParticles = 50;
        
        this.time = 0;
        this.animationFrame = null;
        
        this.colors = {
            blue: {
                sky: ['#1a2a3a', '#2e4a5a'],
                ground: '#1a2530',
                accent: '#5B9BD5',
                particles: ['#5B9BD5', '#A5C8E4', '#2E5A87']
            },
            green: {
                sky: ['#1a2d24', '#2a4a3a'],
                ground: '#1a2520',
                accent: '#70C490',
                particles: ['#70C490', '#A8E0BC', '#3D8B5A']
            },
            yellow: {
                sky: ['#2d2a1a', '#4a4530'],
                ground: '#252218',
                accent: '#F5C842',
                particles: ['#F5C842', '#FAE08A', '#C49A1A']
            },
            red: {
                sky: ['#2d1a1a', '#4a2a2a'],
                ground: '#251818',
                accent: '#E85D5D',
                particles: ['#E85D5D', '#F5A0A0', '#B83A3A']
            }
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setZone(zoneName, immediate = false) {
        if (immediate) {
            this.currentZone = zoneName;
            this.targetZone = zoneName;
            this.transitionProgress = 1;
        } else {
            this.targetZone = zoneName;
            this.transitionProgress = 0;
        }
    }

    start() {
        this.initParticles();
        this.animate();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: randomFloat(0, this.width),
            y: randomFloat(0, this.height),
            size: randomFloat(2, 6),
            speedX: randomFloat(-0.5, 0.5),
            speedY: randomFloat(-0.3, -0.8),
            opacity: randomFloat(0.2, 0.6),
            pulse: randomFloat(0, Math.PI * 2)
        };
    }

    updateParticles() {
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.pulse += 0.02;
            
            // Wrap around
            if (p.y < -10) {
                p.y = this.height + 10;
                p.x = randomFloat(0, this.width);
            }
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;
        });
    }

    getBlendedColor(colorKey) {
        const current = this.colors[this.currentZone];
        const target = this.colors[this.targetZone];
        
        if (this.transitionProgress >= 1) {
            return target[colorKey];
        }
        
        // For arrays (like sky gradient), blend each element
        if (Array.isArray(current[colorKey])) {
            return current[colorKey].map((c, i) => 
                this.lerpColor(c, target[colorKey][i], this.transitionProgress)
            );
        }
        
        return this.lerpColor(current[colorKey], target[colorKey], this.transitionProgress);
    }

    lerpColor(color1, color2, t) {
        // Parse hex colors
        const r1 = parseInt(color1.slice(1, 3), 16);
        const g1 = parseInt(color1.slice(3, 5), 16);
        const b1 = parseInt(color1.slice(5, 7), 16);
        
        const r2 = parseInt(color2.slice(1, 3), 16);
        const g2 = parseInt(color2.slice(3, 5), 16);
        const b2 = parseInt(color2.slice(5, 7), 16);
        
        const r = Math.round(lerp(r1, r2, t));
        const g = Math.round(lerp(g1, g2, t));
        const b = Math.round(lerp(b1, b2, t));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    drawSky() {
        const skyColors = this.getBlendedColor('sky');
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, skyColors[0]);
        gradient.addColorStop(1, skyColors[1]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHills() {
        const groundColor = this.getBlendedColor('ground');
        const accentColor = this.getBlendedColor('accent');
        
        // Back hills
        this.ctx.fillStyle = groundColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        
        for (let x = 0; x <= this.width; x += 50) {
            const y = this.height - 100 + Math.sin((x + this.time * 5) * 0.01) * 30;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Front hills with accent
        this.ctx.fillStyle = accentColor + '20';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        
        for (let x = 0; x <= this.width; x += 30) {
            const y = this.height - 50 + Math.sin((x - this.time * 8) * 0.015) * 20;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawParticles() {
        const particleColors = this.colors[this.targetZone].particles;
        
        this.particles.forEach((p, i) => {
            const color = particleColors[i % particleColors.length];
            const pulsedOpacity = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = color + Math.round(pulsedOpacity * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
        });
    }

    drawAmbientGlow() {
        const accentColor = this.getBlendedColor('accent');
        
        // Central glow
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, 0,
            this.width / 2, this.height / 2, this.width / 2
        );
        gradient.addColorStop(0, accentColor + '15');
        gradient.addColorStop(0.5, accentColor + '08');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    render() {
        // Update transition
        if (this.transitionProgress < 1) {
            this.transitionProgress = Math.min(this.transitionProgress + 0.02, 1);
            if (this.transitionProgress >= 1) {
                this.currentZone = this.targetZone;
            }
        }
        
        // Clear and draw
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawSky();
        this.drawAmbientGlow();
        this.drawHills();
        this.drawParticles();
    }

    animate() {
        this.time++;
        this.updateParticles();
        this.render();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// Global world instance
const zoneWorld = new ZoneWorld();

console.log('ZONE World loaded');



