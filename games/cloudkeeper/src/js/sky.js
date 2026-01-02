/* ============================================
   CLOUD KEEPER — Sky Renderer
   Beautiful pastel sky with sun and clouds
   ============================================ */

class Sky {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Sky state
        this.time = 0;
        
        // Sun
        this.sun = {
            x: 0,
            y: 0,
            radius: 50,
            revealed: false,
            revealProgress: 0
        };
        
        // Clouds
        this.clouds = [];
        this.numClouds = 8;
        
        // Hidden stars
        this.stars = [];
        this.numStars = 3;
        this.starsFound = 0;
        
        // Stats
        this.cloudsMoved = 0;
        
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
        
        // Position sun
        this.sun.x = this.width * 0.75;
        this.sun.y = this.height * 0.25;
    }

    init() {
        this.createClouds();
        this.createStars();
    }

    createClouds() {
        this.clouds = [];
        
        // Create clouds spread across the sky
        for (let i = 0; i < this.numClouds; i++) {
            const x = (i / this.numClouds) * this.width + randomFloat(-50, 50);
            const y = randomFloat(this.height * 0.15, this.height * 0.6);
            const size = randomFloat(60, 120);
            
            this.clouds.push(new Cloud(x, y, size));
        }
        
        // Add a few clouds covering the sun area
        this.clouds.push(new Cloud(this.sun.x - 30, this.sun.y - 20, 100));
        this.clouds.push(new Cloud(this.sun.x + 40, this.sun.y + 10, 80));
    }

    createStars() {
        this.stars = [];
        this.starsFound = 0;
        
        // Place stars in different areas
        const positions = [
            { x: this.width * 0.2, y: this.height * 0.3 },
            { x: this.width * 0.5, y: this.height * 0.5 },
            { x: this.width * 0.8, y: this.height * 0.35 }
        ];
        
        positions.forEach(pos => {
            // Add cloud over each star position
            this.clouds.push(new Cloud(pos.x, pos.y, 90));
            this.stars.push(new Star(pos.x, pos.y));
        });
    }

    blowClouds(force) {
        this.clouds.forEach(cloud => {
            cloud.blow(force, 1);
        });
        this.cloudsMoved++;
    }

    pushCloud(x, y) {
        let pushed = false;
        this.clouds.forEach(cloud => {
            if (cloud.push(x, y)) {
                pushed = true;
                this.cloudsMoved++;
            }
        });
        return pushed;
    }

    update() {
        this.time++;
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.update(this.width, this.height);
        });
        
        // Update stars and check if uncovered
        let newStarFound = false;
        this.stars.forEach(star => {
            star.update();
            if (star.checkIfUncovered(this.clouds)) {
                newStarFound = true;
                this.starsFound++;
            }
        });
        
        // Check if sun is revealed
        this.checkSunRevealed();
        
        // Update sun reveal animation
        if (this.sun.revealed && this.sun.revealProgress < 1) {
            this.sun.revealProgress = Math.min(1, this.sun.revealProgress + 0.02);
        }
        
        return newStarFound;
    }

    checkSunRevealed() {
        if (this.sun.revealed) return;
        
        // Check if any cloud covers the sun
        for (const cloud of this.clouds) {
            if (cloud.containsPoint(this.sun.x, this.sun.y)) {
                return; // Sun still covered
            }
        }
        
        this.sun.revealed = true;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw sky gradient
        this.drawSkyGradient();
        
        // Draw sun (behind clouds)
        this.drawSun();
        
        // Draw stars (behind clouds)
        this.stars.forEach(star => star.draw(this.ctx));
        
        // Draw clouds
        // Sort by Y for depth
        const sortedClouds = [...this.clouds].sort((a, b) => a.y - b.y);
        sortedClouds.forEach(cloud => cloud.draw(this.ctx));
    }

    drawSkyGradient() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        
        // Soft pastel sky
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.5, '#B0E0E6');
        gradient.addColorStop(1, '#E0F4FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawSun() {
        const { x, y, radius, revealProgress } = this.sun;
        
        if (revealProgress <= 0) return;
        
        this.ctx.save();
        
        const scale = easeOutElastic(revealProgress);
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        
        // Sun glow
        const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2);
        glowGradient.addColorStop(0, 'rgba(255, 217, 61, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(255, 217, 61, 0.2)');
        glowGradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sun body
        const sunGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        sunGradient.addColorStop(0, '#FFE066');
        sunGradient.addColorStop(1, '#FFD93D');
        
        this.ctx.fillStyle = sunGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sun rays
        this.ctx.strokeStyle = 'rgba(255, 217, 61, 0.5)';
        this.ctx.lineWidth = 3;
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + this.time * 0.01;
            const innerR = radius + 10;
            const outerR = radius + 30 + Math.sin(this.time * 0.05 + i) * 10;
            
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
            this.ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
            this.ctx.stroke();
        }
        
        // Sun face (simple smile)
        if (revealProgress > 0.5) {
            const faceOpacity = (revealProgress - 0.5) * 2;
            this.ctx.fillStyle = `rgba(255, 150, 50, ${faceOpacity})`;
            
            // Eyes
            this.ctx.beginPath();
            this.ctx.arc(-15, -5, 5, 0, Math.PI * 2);
            this.ctx.arc(15, -5, 5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Smile
            this.ctx.beginPath();
            this.ctx.arc(0, 5, 20, 0.1 * Math.PI, 0.9 * Math.PI);
            this.ctx.strokeStyle = `rgba(255, 150, 50, ${faceOpacity})`;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        }
        
        this.ctx.restore();
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

    // Check if game complete (all stars found + sun revealed)
    isComplete() {
        return this.starsFound >= this.numStars && this.sun.revealed;
    }

    reset() {
        this.cloudsMoved = 0;
        this.starsFound = 0;
        this.sun.revealed = false;
        this.sun.revealProgress = 0;
        this.createClouds();
        this.createStars();
    }
}

console.log('Cloud Keeper Sky loaded');


