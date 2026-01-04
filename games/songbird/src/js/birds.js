/* ============================================
   SONGBIRD — Bird System
   Birds that respond to whistles
   ============================================ */

class Bird {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        
        // Size
        this.size = randomFloat(30, 50);
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.speed = randomFloat(1, 2);
        
        // State
        this.state = 'idle'; // idle, curious, following, singing, befriended
        this.befriended = false;
        
        // Animation
        this.wingPhase = Math.random() * Math.PI * 2;
        this.bobPhase = Math.random() * Math.PI * 2;
        
        // Melody challenge
        this.currentNoteIndex = 0;
        this.isSinging = false;
    }

    update(whistlePitch, isWhistling) {
        this.wingPhase += 0.15;
        this.bobPhase += 0.05;
        
        // React to whistle pitch
        if (isWhistling && this.state !== 'befriended') {
            // Move up/down based on pitch
            const targetHeight = lerp(window.innerHeight * 0.8, window.innerHeight * 0.2, whistlePitch);
            this.targetY = targetHeight;
            
            if (this.state === 'idle') {
                this.state = 'curious';
            }
        }
        
        // Move toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // Add gentle bob
        const bob = Math.sin(this.bobPhase) * 3;
        
        // Return actual position with bob
        return {
            x: this.x,
            y: this.y + bob
        };
    }

    draw(ctx) {
        const pos = { x: this.x, y: this.y + Math.sin(this.bobPhase) * 3 };
        
        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        // Direction based on velocity
        if (this.vx < -0.1) {
            ctx.scale(-1, 1);
        }
        
        // Draw bird body
        ctx.fillStyle = this.type.color;
        
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.5, this.size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(this.size * 0.3, -this.size * 0.15, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.size * 0.38, -this.size * 0.18, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.size * 0.4, -this.size * 0.18, this.size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#ffa500';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.55, -this.size * 0.1);
        ctx.lineTo(this.size * 0.7, -this.size * 0.05);
        ctx.lineTo(this.size * 0.55, 0);
        ctx.closePath();
        ctx.fill();
        
        // Wing
        const wingFlap = Math.sin(this.wingPhase) * 0.3;
        ctx.fillStyle = this.darkenColor(this.type.color, 20);
        ctx.save();
        ctx.translate(-this.size * 0.1, 0);
        ctx.rotate(wingFlap);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.3, this.size * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Tail
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.4, 0);
        ctx.lineTo(-this.size * 0.7, -this.size * 0.1);
        ctx.lineTo(-this.size * 0.7, this.size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        // Draw notes if singing
        if (this.isSinging) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = `${this.size * 0.4}px Arial`;
            ctx.fillText('♪', this.size * 0.5, -this.size * 0.5);
        }
        
        // Draw sparkle if befriended
        if (this.befriended) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = `${this.size * 0.3}px Arial`;
            ctx.fillText('✨', this.size * 0.4, -this.size * 0.6);
        }
        
        ctx.restore();
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (
            0x1000000 +
            (R < 0 ? 0 : R) * 0x10000 +
            (G < 0 ? 0 : G) * 0x100 +
            (B < 0 ? 0 : B)
        ).toString(16).slice(1);
    }

    startSinging() {
        this.isSinging = true;
        this.currentNoteIndex = 0;
    }

    checkNote(note) {
        if (!this.isSinging) return false;
        
        const expectedNote = this.type.notes[this.currentNoteIndex];
        if (note === expectedNote) {
            this.currentNoteIndex++;
            
            if (this.currentNoteIndex >= this.type.notes.length) {
                // Completed melody!
                this.befriend();
                return 'complete';
            }
            return 'match';
        }
        return false;
    }

    befriend() {
        this.befriended = true;
        this.isSinging = false;
        this.state = 'befriended';
        
        // Fly closer to center
        this.targetX = window.innerWidth / 2 + randomFloat(-100, 100);
        this.targetY = window.innerHeight / 2 + randomFloat(-50, 50);
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
}

class BirdManager {
    constructor() {
        this.birds = [];
        this.activeBird = null;
        this.befriendedCount = 0;
    }

    spawnBird() {
        const type = randomPick(BIRD_TYPES);
        const side = Math.random() > 0.5 ? -50 : window.innerWidth + 50;
        const y = randomFloat(100, window.innerHeight * 0.6);
        
        const bird = new Bird(type, side, y);
        bird.targetX = window.innerWidth / 2 + randomFloat(-200, 200);
        
        this.birds.push(bird);
        return bird;
    }

    update(whistlePitch, isWhistling) {
        this.birds.forEach(bird => {
            bird.update(whistlePitch, isWhistling);
        });
    }

    draw(ctx) {
        this.birds.forEach(bird => {
            bird.draw(ctx);
        });
    }

    setActiveBird(bird) {
        this.activeBird = bird;
        if (bird) {
            bird.startSinging();
        }
    }

    checkNote(note) {
        if (!this.activeBird) return false;
        
        const result = this.activeBird.checkNote(note);
        
        if (result === 'complete') {
            this.befriendedCount++;
            this.activeBird = null;
        }
        
        return result;
    }

    getBefriendedCount() {
        return this.befriendedCount;
    }
}

console.log('Songbird Birds loaded');



