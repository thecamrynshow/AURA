/**
 * PNEUOMA Labs - Background Animation & Interactivity
 */

class LabsBackground {
    constructor() {
        this.canvas = document.getElementById('background-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.waves = [];
        this.time = 0;
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        // Create floating particles
        for (let i = 0; i < 60; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.5 + 0.2,
                hue: Math.random() > 0.5 ? 175 : 280 // Cyan or purple
            });
        }
        
        // Create wave origins
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 0,
                maxRadius: 400,
                speed: 0.5 + Math.random() * 0.5,
                opacity: 0.15
            });
        }
    }
    
    animate() {
        this.time += 0.01;
        
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 31, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw waves
        this.waves.forEach(wave => {
            wave.radius += wave.speed;
            if (wave.radius > wave.maxRadius) {
                wave.radius = 0;
                wave.x = Math.random() * this.canvas.width;
                wave.y = Math.random() * this.canvas.height;
            }
            
            const gradient = this.ctx.createRadialGradient(
                wave.x, wave.y, 0,
                wave.x, wave.y, wave.radius
            );
            gradient.addColorStop(0, 'rgba(0, 255, 242, 0)');
            gradient.addColorStop(0.7, `rgba(168, 85, 247, ${wave.opacity * (1 - wave.radius / wave.maxRadius)})`);
            gradient.addColorStop(1, 'rgba(0, 255, 242, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // Draw particles
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Wrap around
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            
            // Pulsing opacity
            const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(this.time * 2 + p.x * 0.01));
            
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${pulseOpacity})`;
            this.ctx.fill();
            
            // Glow
            const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
            glow.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${pulseOpacity * 0.3})`);
            glow.addColorStop(1, `hsla(${p.hue}, 100%, 70%, 0)`);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = glow;
            this.ctx.fill();
        });
        
        // Draw connecting lines between close particles
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 255, 242, ${0.1 * (1 - dist / 100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new LabsBackground();
    
    // Add hover effects to cards
    document.querySelectorAll('.lab-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
    
    // Parallax effect on hero
    const heroVisual = document.querySelector('.hero-visual');
    if (heroVisual) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            heroVisual.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
});

