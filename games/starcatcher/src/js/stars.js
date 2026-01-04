/* Star Catcher - Star Management */

class Star {
    constructor(x, y, size = 20) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.fallSpeed = Utils.random(1, 2);
        this.wobblePhase = Utils.random(0, Math.PI * 2);
        this.wobbleSpeed = Utils.random(0.03, 0.06);
        this.rotation = 0;
        this.rotationSpeed = Utils.random(0.02, 0.04);
        this.pulse = 0;
        this.caught = false;
        this.missed = false;
        this.catchAnimation = 0;
        
        // Star type (determines color/points)
        this.type = this.determineType();
    }

    determineType() {
        const rand = Math.random();
        if (rand < 0.7) return 'gold';      // Common
        if (rand < 0.9) return 'silver';    // Uncommon
        return 'rainbow';                    // Rare
    }

    getColor() {
        switch (this.type) {
            case 'gold': return '#ffd700';
            case 'silver': return '#c0c0c0';
            case 'rainbow': 
                const hue = (Date.now() * 0.1) % 360;
                return `hsl(${hue}, 70%, 60%)`;
            default: return '#ffd700';
        }
    }

    getPoints() {
        switch (this.type) {
            case 'gold': return 10;
            case 'silver': return 25;
            case 'rainbow': return 50;
            default: return 10;
        }
    }

    update(deltaTime) {
        if (this.caught) {
            this.catchAnimation += deltaTime * 0.01;
            return;
        }
        
        if (this.missed) return;
        
        // Fall
        this.y += this.fallSpeed * (deltaTime / 16);
        
        // Wobble
        this.wobblePhase += this.wobbleSpeed;
        this.x += Math.sin(this.wobblePhase) * 0.5;
        
        // Rotate and pulse
        this.rotation += this.rotationSpeed;
        this.pulse += 0.05;
    }

    render(ctx) {
        if (this.missed) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.caught) {
            // Catch animation - star flies toward net center
            const scale = Math.max(0, 1 - this.catchAnimation);
            ctx.scale(scale, scale);
            ctx.globalAlpha = scale;
        }
        
        ctx.rotate(this.rotation);
        
        const pulse = Math.sin(this.pulse) * 0.15 + 1;
        const size = this.size * pulse;
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
        const color = this.getColor();
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(')', ', 0.3)').replace('rgb', 'rgba').replace('hsl', 'hsla'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Star shape
        ctx.fillStyle = color;
        this.drawStarShape(ctx, 0, 0, 5, size, size / 2);
        
        // Sparkle
        if (this.type === 'rainbow') {
            ctx.fillStyle = 'white';
            ctx.globalAlpha = Math.abs(Math.sin(this.pulse * 2)) * 0.8;
            this.drawStarShape(ctx, 0, 0, 4, size * 0.3, size * 0.15);
            ctx.globalAlpha = 1;
        }
        
        ctx.restore();
    }

    drawStarShape(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    isOffScreen(height) {
        return this.y > height + this.size;
    }
}

class StarManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.stars = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // Start slow
        this.minSpawnInterval = 600;
        this.difficultyTimer = 0;
        
        // Background stars
        this.bgStars = [];
        this.initBackgroundStars();
    }

    initBackgroundStars() {
        for (let i = 0; i < 100; i++) {
            this.bgStars.push({
                x: Utils.random(0, this.width),
                y: Utils.random(0, this.height),
                size: Utils.random(0.5, 2),
                twinkle: Utils.random(0, Math.PI * 2),
                twinkleSpeed: Utils.random(0.02, 0.05)
            });
        }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    update(deltaTime) {
        // Spawn new stars
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnStar();
            this.spawnTimer = 0;
        }
        
        // Increase difficulty over time
        this.difficultyTimer += deltaTime;
        if (this.difficultyTimer > 10000) { // Every 10 seconds
            this.spawnInterval = Math.max(this.minSpawnInterval, this.spawnInterval - 100);
            this.difficultyTimer = 0;
        }
        
        // Update all stars
        this.stars.forEach(star => star.update(deltaTime));
        
        // Update background stars
        this.bgStars.forEach(star => {
            star.twinkle += star.twinkleSpeed;
        });
        
        // Remove off-screen or caught stars
        this.stars = this.stars.filter(star => {
            if (star.caught && star.catchAnimation > 1) return false;
            if (star.isOffScreen(this.height)) {
                if (!star.caught && !star.missed) {
                    star.missed = true;
                    return false;
                }
            }
            return true;
        });
    }

    spawnStar() {
        const x = Utils.random(50, this.width - 50);
        const size = Utils.random(15, 30);
        this.stars.push(new Star(x, -size * 2, size));
    }

    render(ctx) {
        // Render background stars
        this.bgStars.forEach(star => {
            const alpha = (Math.sin(star.twinkle) + 1) / 2;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Render falling stars
        this.stars.forEach(star => star.render(ctx));
    }

    checkCatch(netX, netY, netRadius) {
        let caught = null;
        
        this.stars.forEach(star => {
            if (star.caught || star.missed) return;
            
            const dist = Utils.distance(star.x, star.y, netX, netY);
            if (dist < netRadius + star.size) {
                star.caught = true;
                caught = star;
            }
        });
        
        return caught;
    }

    getActiveStars() {
        return this.stars.filter(s => !s.caught && !s.missed);
    }
}

console.log('Star System loaded');


