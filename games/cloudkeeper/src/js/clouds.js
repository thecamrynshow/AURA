/* ============================================
   CLOUD KEEPER — Cloud System
   Fluffy, interactive clouds
   ============================================ */

class Cloud {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.baseSize = size;
        this.size = size;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.98;
        
        // Visual
        this.wobble = randomFloat(0, Math.PI * 2);
        this.wobbleSpeed = randomFloat(0.02, 0.04);
        this.puffiness = 1;
        this.opacity = 1;
        
        // State
        this.beingBlown = false;
        this.pushed = false;
        
        // Generate cloud shape (multiple ellipses)
        this.puffs = this.generatePuffs();
    }

    generatePuffs() {
        const puffs = [];
        const numPuffs = randomInt(4, 6);
        
        for (let i = 0; i < numPuffs; i++) {
            puffs.push({
                offsetX: randomFloat(-this.baseSize * 0.4, this.baseSize * 0.4),
                offsetY: randomFloat(-this.baseSize * 0.2, this.baseSize * 0.2),
                radiusX: randomFloat(this.baseSize * 0.3, this.baseSize * 0.5),
                radiusY: randomFloat(this.baseSize * 0.2, this.baseSize * 0.35),
                wobbleOffset: randomFloat(0, Math.PI * 2)
            });
        }
        
        return puffs;
    }

    blow(force, direction = 1) {
        this.vx += force * direction * 0.5;
        this.vy += randomFloat(-force * 0.1, force * 0.1);
        this.beingBlown = true;
        this.puffiness = 1.1;
    }

    push(px, py) {
        // Push away from point
        const dx = this.x - px;
        const dy = this.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.baseSize * 2) {
            const force = (this.baseSize * 2 - dist) / (this.baseSize * 2) * 5;
            this.vx += (dx / dist) * force;
            this.vy += (dy / dist) * force;
            this.pushed = true;
            return true;
        }
        return false;
    }

    update(canvasWidth, canvasHeight) {
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Wobble animation
        this.wobble += this.wobbleSpeed;
        
        // Return to normal puffiness
        this.puffiness = lerp(this.puffiness, 1, 0.1);
        
        // Check if barely moving
        if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
            this.beingBlown = false;
            this.pushed = false;
        }
        
        // Soft boundaries (clouds wrap around)
        const margin = this.baseSize;
        if (this.x < -margin) this.x = canvasWidth + margin;
        if (this.x > canvasWidth + margin) this.x = -margin;
        if (this.y < -margin) this.y = canvasHeight * 0.2;
        if (this.y > canvasHeight * 0.8) this.y = canvasHeight * 0.8;
        
        // Gentle vertical drift back to middle
        const targetY = canvasHeight * 0.4;
        this.vy += (targetY - this.y) * 0.001;
    }

    draw(ctx) {
        ctx.save();
        
        // Calculate wobble offsets
        const wobbleX = Math.sin(this.wobble) * 3;
        const wobbleY = Math.cos(this.wobble * 0.7) * 2;
        
        // Shadow
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        this.puffs.forEach(puff => {
            ctx.beginPath();
            ctx.ellipse(
                this.x + puff.offsetX + wobbleX + 5,
                this.y + puff.offsetY + wobbleY + 8,
                puff.radiusX * this.puffiness,
                puff.radiusY * this.puffiness,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // Main cloud (white)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        this.puffs.forEach(puff => {
            const puffWobble = Math.sin(this.wobble + puff.wobbleOffset) * 2;
            ctx.beginPath();
            ctx.ellipse(
                this.x + puff.offsetX + wobbleX,
                this.y + puff.offsetY + wobbleY + puffWobble,
                puff.radiusX * this.puffiness,
                puff.radiusY * this.puffiness,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.puffs.slice(0, 2).forEach(puff => {
            ctx.beginPath();
            ctx.ellipse(
                this.x + puff.offsetX + wobbleX - 5,
                this.y + puff.offsetY + wobbleY - 5,
                puff.radiusX * 0.6 * this.puffiness,
                puff.radiusY * 0.6 * this.puffiness,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        ctx.restore();
    }

    // Check if point is inside cloud
    containsPoint(px, py) {
        for (const puff of this.puffs) {
            const dx = px - (this.x + puff.offsetX);
            const dy = py - (this.y + puff.offsetY);
            const normalized = (dx * dx) / (puff.radiusX * puff.radiusX) + 
                             (dy * dy) / (puff.radiusY * puff.radiusY);
            if (normalized <= 1) return true;
        }
        return false;
    }

    // Get total width for overlap checking
    getWidth() {
        return this.baseSize * 1.5;
    }
}

// Hidden star that appears when clouds are moved
class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.found = false;
        this.revealProgress = 0;
        this.sparkle = 0;
    }

    update() {
        this.sparkle += 0.1;
        
        if (this.found && this.revealProgress < 1) {
            this.revealProgress = Math.min(1, this.revealProgress + 0.05);
        }
    }

    draw(ctx) {
        if (this.revealProgress <= 0) return;
        
        ctx.save();
        
        const scale = easeOutElastic(this.revealProgress);
        const sparkleSize = 1 + Math.sin(this.sparkle) * 0.1;
        
        ctx.translate(this.x, this.y);
        ctx.scale(scale * sparkleSize, scale * sparkleSize);
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(255, 217, 61, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 217, 61, 0.3)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Star emoji
        ctx.font = `${this.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);
        
        ctx.restore();
    }

    // Check if uncovered (no clouds blocking)
    checkIfUncovered(clouds) {
        if (this.found) return false;
        
        for (const cloud of clouds) {
            if (cloud.containsPoint(this.x, this.y)) {
                return false; // Still covered
            }
        }
        
        // Star is uncovered!
        this.found = true;
        return true;
    }
}

console.log('Cloud Keeper Clouds loaded');

