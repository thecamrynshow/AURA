/* Dragon's Breath - Dragon Character */

class Dragon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetY = y;
        this.baseY = y;
        
        // Physics
        this.vy = 0;
        this.gravity = 0.15;
        this.flapForce = -4;
        this.maxFallSpeed = 3;
        this.glideSpeed = 0.8;
        
        // Size
        this.width = 80;
        this.height = 60;
        
        // Animation
        this.wingAngle = 0;
        this.wingSpeed = 0.1;
        this.bobPhase = 0;
        this.breathGlow = 0;
        this.tailWag = 0;
        
        // State
        this.isFlapping = false;
        this.breathLevel = 0;
        
        // Trail particles
        this.trail = [];
        this.maxTrailLength = 15;
        
        // Colors
        this.bodyColor = '#ff9d4a';
        this.bellyColor = '#ffcc4a';
        this.wingColor = '#ff7b2a';
    }

    update(deltaTime, breathLevel) {
        this.breathLevel = breathLevel;
        
        // Movement based on breath
        if (breathLevel > 0.05) {
            // Rising - breathing in
            const force = this.flapForce * Math.min(breathLevel * 3, 1);
            this.vy += force * (deltaTime / 16);
            this.isFlapping = true;
            this.breathGlow = Math.min(this.breathGlow + 0.1, 1);
        } else {
            // Gliding down - breathing out or neutral
            this.vy += this.gravity * (deltaTime / 16);
            this.isFlapping = false;
            this.breathGlow = Math.max(this.breathGlow - 0.05, 0);
        }
        
        // Clamp velocity
        this.vy = Utils.clamp(this.vy, this.flapForce * 1.5, this.maxFallSpeed);
        
        // Apply velocity
        this.y += this.vy * (deltaTime / 16);
        
        // Keep in bounds
        this.y = Utils.clamp(this.y, 80, window.innerHeight - 100);
        
        // Animation
        this.wingAngle += this.isFlapping ? this.wingSpeed * 2 : this.wingSpeed * 0.5;
        this.bobPhase += 0.02;
        this.tailWag += 0.08;
        
        // Add trail particle
        if (this.isFlapping && Math.random() < 0.3) {
            this.trail.push({
                x: this.x - 30,
                y: this.y + Math.random() * 20 - 10,
                size: Utils.random(5, 10),
                alpha: 0.7,
                hue: Utils.random(30, 50)
            });
        }
        
        // Update trail
        this.trail = this.trail.filter(p => {
            p.x -= 2;
            p.alpha -= 0.03;
            p.size *= 0.95;
            return p.alpha > 0;
        });
        
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    render(ctx) {
        const bob = Math.sin(this.bobPhase) * 3;
        const drawY = this.y + bob;
        
        ctx.save();
        ctx.translate(this.x, drawY);
        
        // Draw trail
        this.trail.forEach(p => {
            const tx = p.x - this.x;
            const ty = p.y - this.y;
            ctx.beginPath();
            ctx.arc(tx, ty, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha})`;
            ctx.fill();
        });
        
        // Breath glow
        if (this.breathGlow > 0) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
            gradient.addColorStop(0, `rgba(255, 200, 100, ${this.breathGlow * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, 60, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Wings
        const wingFlap = Math.sin(this.wingAngle) * (this.isFlapping ? 25 : 10);
        
        ctx.fillStyle = this.wingColor;
        
        // Left wing
        ctx.save();
        ctx.translate(-15, -5);
        ctx.rotate((-30 + wingFlap) * Math.PI / 180);
        this.drawWing(ctx, -1);
        ctx.restore();
        
        // Right wing
        ctx.save();
        ctx.translate(-15, -5);
        ctx.rotate((30 - wingFlap) * Math.PI / 180);
        this.drawWing(ctx, 1);
        ctx.restore();
        
        // Body
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Belly
        ctx.fillStyle = this.bellyColor;
        ctx.beginPath();
        ctx.ellipse(5, 5, 20, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.fillStyle = this.bodyColor;
        ctx.beginPath();
        ctx.arc(35, -8, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.beginPath();
        ctx.ellipse(52, -5, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(40, -12, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(42, -11, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye sparkle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(44, -13, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns
        ctx.fillStyle = '#cc7a30';
        ctx.beginPath();
        ctx.moveTo(30, -25);
        ctx.lineTo(25, -40);
        ctx.lineTo(35, -28);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(20, -22);
        ctx.lineTo(12, -35);
        ctx.lineTo(25, -25);
        ctx.fill();
        
        // Tail
        const tailWave = Math.sin(this.tailWag) * 10;
        ctx.strokeStyle = this.bodyColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-35, 5);
        ctx.quadraticCurveTo(-50, 10 + tailWave, -60, 5 + tailWave);
        ctx.stroke();
        
        // Tail spike
        ctx.fillStyle = '#cc7a30';
        ctx.beginPath();
        ctx.moveTo(-58, 0 + tailWave);
        ctx.lineTo(-75, 5 + tailWave);
        ctx.lineTo(-58, 10 + tailWave);
        ctx.fill();
        
        // Breath fire effect when breathing
        if (this.breathLevel > 0.1) {
            this.drawBreathFire(ctx);
        }
        
        ctx.restore();
    }

    drawWing(ctx, side) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-30 * side, -20, -50 * side, 0);
        ctx.quadraticCurveTo(-35 * side, 10, -15 * side, 15);
        ctx.closePath();
        ctx.fill();
        
        // Wing membrane lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-40 * side, -10);
        ctx.moveTo(0, 0);
        ctx.lineTo(-45 * side, 5);
        ctx.stroke();
    }

    drawBreathFire(ctx) {
        const intensity = Math.min(this.breathLevel * 5, 1);
        const fireLength = 20 + intensity * 30;
        
        // Flame gradient
        const gradient = ctx.createLinearGradient(55, 0, 55 + fireLength, 0);
        gradient.addColorStop(0, `rgba(255, 200, 50, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 50, ${intensity * 0.7})`);
        gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(55, -5);
        ctx.quadraticCurveTo(55 + fireLength * 0.5, -8, 55 + fireLength, 0);
        ctx.quadraticCurveTo(55 + fireLength * 0.5, 8, 55, 5);
        ctx.closePath();
        ctx.fill();
    }

    getBounds() {
        return {
            x: this.x - 25,
            y: this.y - 20,
            width: 60,
            height: 40
        };
    }
}

console.log('Dragon loaded');

