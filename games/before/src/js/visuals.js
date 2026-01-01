/* ============================================
   BEFORE — Visual Effects
   Ambient background animations
   ============================================ */

class PrepVisuals {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Particles
        this.particles = [];
        this.numParticles = 50;
        
        // State
        this.goalColor = '#f59e0b';
        this.time = 0;
        this.phase = 'ground';
        
        // Animation
        this.animationFrame = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setGoalColor(color) {
        this.goalColor = color;
    }

    setPhase(phase) {
        this.phase = phase;
    }

    init() {
        this.particles = [];
        
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: randomFloat(0, this.width),
                y: randomFloat(0, this.height),
                size: randomFloat(1, 3),
                speed: randomFloat(0.2, 0.8),
                angle: randomFloat(0, Math.PI * 2),
                opacity: randomFloat(0.1, 0.4),
                pulseOffset: randomFloat(0, Math.PI * 2)
            });
        }
    }

    update() {
        this.time++;
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        this.particles.forEach(p => {
            // Gentle drift toward center during breathing phase
            if (this.phase === 'Breathe') {
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 100) {
                    p.x += (dx / dist) * 0.2;
                    p.y += (dy / dist) * 0.2;
                }
            }
            
            // Gentle floating
            p.x += Math.cos(p.angle) * p.speed;
            p.y += Math.sin(p.angle) * p.speed;
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
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw central glow
        this.drawCentralGlow();
        
        // Draw particles
        this.drawParticles();
    }

    drawCentralGlow() {
        const cx = this.width / 2;
        const cy = this.height / 2;
        const pulse = Math.sin(this.time * 0.02) * 20;
        const radius = 150 + pulse;
        
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, this.hexToRgba(this.goalColor, 0.2));
        gradient.addColorStop(0.5, this.hexToRgba(this.goalColor, 0.05));
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawParticles() {
        this.particles.forEach(p => {
            const pulse = Math.sin(this.time * 0.03 + p.pulseOffset) * 0.5 + 1;
            const size = p.size * pulse;
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.hexToRgba(this.goalColor, p.opacity);
            this.ctx.fill();
        });
    }

    hexToRgba(hex, alpha) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (result) {
            const r = parseInt(result[1], 16);
            const g = parseInt(result[2], 16);
            const b = parseInt(result[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(245, 158, 11, ${alpha})`;
    }

    start() {
        this.init();
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

console.log('Before Visuals loaded');

