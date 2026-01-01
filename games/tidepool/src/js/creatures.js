/**
 * Tidepool - Creature System
 * Creatures respond to touch/movement speed
 */

// Base creature class
class Creature {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Movement
        this.vx = 0;
        this.vy = 0;
        this.baseSpeed = 0.5;
        this.maxSpeed = 3;
        
        // State
        this.state = 'wandering'; // wandering, attracted, fleeing, connected
        this.trust = 0; // 0-1, how much creature trusts player
        this.connectionTime = 0;
        
        // Visual
        this.size = 10;
        this.hue = 180;
        this.glowIntensity = 0.5;
        this.pulsePhase = Utils.random(0, Math.PI * 2);
        
        // Behavior
        this.wanderAngle = Utils.random(0, Math.PI * 2);
        this.wanderTimer = 0;
        this.fleeTimer = 0;
        
        // Target for attraction
        this.targetX = null;
        this.targetY = null;
    }
    
    update(deltaTime, playerX, playerY, playerSpeed, presenceLevel) {
        const dt = deltaTime / 16; // Normalize to ~60fps
        
        // Calculate distance to player
        const distToPlayer = Utils.distance(this.x, this.y, playerX, playerY);
        const angleToPlayer = Utils.angle(this.x, this.y, playerX, playerY);
        
        // Update state based on player speed
        this.updateState(distToPlayer, playerSpeed, presenceLevel, playerX, playerY);
        
        // Update behavior based on state
        switch (this.state) {
            case 'attracted':
                this.behaviorAttracted(angleToPlayer, distToPlayer, dt);
                break;
            case 'fleeing':
                this.behaviorFleeing(angleToPlayer, dt);
                break;
            case 'connected':
                this.behaviorConnected(playerX, playerY, distToPlayer, dt);
                break;
            default:
                this.behaviorWandering(dt);
        }
        
        // Apply velocity with damping
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.95;
        this.vy *= 0.95;
        
        // Update visual pulse
        this.pulsePhase += deltaTime * 0.003;
        
        // Update glow based on state
        const targetGlow = this.state === 'connected' ? 1 : 
                          this.state === 'attracted' ? 0.7 : 
                          this.state === 'fleeing' ? 0.2 : 0.5;
        this.glowIntensity = Utils.lerp(this.glowIntensity, targetGlow, 0.05);
    }
    
    updateState(distToPlayer, playerSpeed, presenceLevel, playerX, playerY) {
        const interactionRadius = 200;
        const connectionRadius = 50;
        
        // Flee if player is moving fast
        if (playerSpeed > 8 && distToPlayer < interactionRadius * 1.5) {
            this.state = 'fleeing';
            this.fleeTimer = 60; // Frames to flee
            this.trust = Math.max(0, this.trust - 0.02);
            return;
        }
        
        // Decrease flee timer
        if (this.fleeTimer > 0) {
            this.fleeTimer--;
            if (this.fleeTimer > 0) return;
        }
        
        // Check for connection
        if (distToPlayer < connectionRadius && playerSpeed < 3 && this.trust > 0.5) {
            this.state = 'connected';
            this.connectionTime += 1;
            this.trust = Math.min(1, this.trust + 0.005);
            return;
        }
        
        // Attracted if player is slow and present
        if (distToPlayer < interactionRadius && playerSpeed < 5 && presenceLevel > 0.3) {
            this.state = 'attracted';
            this.targetX = playerX;
            this.targetY = playerY;
            this.trust = Math.min(1, this.trust + 0.002);
            return;
        }
        
        // Default to wandering
        if (this.state !== 'connected') {
            this.state = 'wandering';
        }
        
        // Decay trust slowly when not interacting
        this.trust = Math.max(0, this.trust - 0.0005);
    }
    
    behaviorWandering(dt) {
        this.wanderTimer++;
        
        // Change direction occasionally
        if (this.wanderTimer > 120 + Utils.random(0, 60)) {
            this.wanderAngle += Utils.random(-Math.PI / 2, Math.PI / 2);
            this.wanderTimer = 0;
        }
        
        // Gentle movement
        this.vx += Math.cos(this.wanderAngle) * this.baseSpeed * 0.1 * dt;
        this.vy += Math.sin(this.wanderAngle) * this.baseSpeed * 0.1 * dt;
    }
    
    behaviorAttracted(angleToPlayer, distToPlayer, dt) {
        // Move toward player, but not too close
        const desiredDist = 80;
        
        if (distToPlayer > desiredDist) {
            const force = Utils.map(distToPlayer, desiredDist, 300, 0.1, 0.3);
            this.vx += Math.cos(angleToPlayer) * force * dt;
            this.vy += Math.sin(angleToPlayer) * force * dt;
        }
        
        // Add gentle circling motion
        const circleAngle = angleToPlayer + Math.PI / 2;
        this.vx += Math.cos(circleAngle) * 0.05 * dt;
        this.vy += Math.sin(circleAngle) * 0.05 * dt;
    }
    
    behaviorFleeing(angleToPlayer, dt) {
        // Move away from player quickly
        const fleeAngle = angleToPlayer + Math.PI;
        const fleeForce = 0.8;
        
        this.vx += Math.cos(fleeAngle) * fleeForce * dt;
        this.vy += Math.sin(fleeAngle) * fleeForce * dt;
    }
    
    behaviorConnected(playerX, playerY, distToPlayer, dt) {
        // Orbit slowly around player
        const orbitDist = 40;
        const orbitSpeed = 0.02;
        
        const currentAngle = Utils.angle(playerX, playerY, this.x, this.y);
        const newAngle = currentAngle + orbitSpeed * dt;
        
        const targetX = playerX + Math.cos(newAngle) * orbitDist;
        const targetY = playerY + Math.sin(newAngle) * orbitDist;
        
        this.vx += (targetX - this.x) * 0.05 * dt;
        this.vy += (targetY - this.y) * 0.05 * dt;
    }
    
    render(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
        const size = this.size * pulse;
        
        // Outer glow
        const glowSize = size * (3 + this.glowIntensity);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        
        const alpha = this.glowIntensity * 0.4;
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 80%, 60%, ${alpha * 0.3})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 70%, ${0.6 + this.glowIntensity * 0.4})`;
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.arc(this.x - size * 0.3, this.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 50%, 90%, 0.5)`;
        ctx.fill();
    }
    
    // Keep creature in bounds
    constrainToBounds(width, height, padding = 50) {
        if (this.x < padding) {
            this.x = padding;
            this.vx *= -0.5;
            this.wanderAngle = Utils.random(-Math.PI / 2, Math.PI / 2);
        }
        if (this.x > width - padding) {
            this.x = width - padding;
            this.vx *= -0.5;
            this.wanderAngle = Utils.random(Math.PI / 2, Math.PI * 1.5);
        }
        if (this.y < padding) {
            this.y = padding;
            this.vy *= -0.5;
            this.wanderAngle = Utils.random(0, Math.PI);
        }
        if (this.y > height - padding) {
            this.y = height - padding;
            this.vy *= -0.5;
            this.wanderAngle = Utils.random(Math.PI, Math.PI * 2);
        }
    }
}

// Glowing fish - small, quick, travels in groups
class GlowFish extends Creature {
    constructor(x, y) {
        super(x, y, 'fish');
        this.size = Utils.random(4, 8);
        this.hue = Utils.random(170, 200); // Cyan to blue
        this.baseSpeed = 0.8;
        this.tailPhase = Utils.random(0, Math.PI * 2);
    }
    
    render(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.15 + 0.85;
        const size = this.size * pulse;
        
        // Calculate rotation based on velocity
        const rotation = Math.atan2(this.vy, this.vx);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(rotation);
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4);
        const alpha = this.glowIntensity * 0.3;
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
        
        ctx.beginPath();
        ctx.arc(0, 0, size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Body (ellipse)
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.5, size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 65%, ${0.7 + this.glowIntensity * 0.3})`;
        ctx.fill();
        
        // Tail
        const tailWag = Math.sin(this.tailPhase + this.pulsePhase * 5) * 0.3;
        ctx.beginPath();
        ctx.moveTo(-size * 1.2, 0);
        ctx.lineTo(-size * 2.5, -size * 0.8 + tailWag * size);
        ctx.lineTo(-size * 2.5, size * 0.8 + tailWag * size);
        ctx.closePath();
        ctx.fillStyle = `hsla(${this.hue}, 60%, 55%, 0.6)`;
        ctx.fill();
        
        // Eye
        ctx.beginPath();
        ctx.arc(size * 0.7, -size * 0.1, size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.fill();
        
        ctx.restore();
        
        this.tailPhase += 0.15;
    }
}

// Jellyfish - slow, graceful, rises and falls
class Jellyfish extends Creature {
    constructor(x, y) {
        super(x, y, 'jellyfish');
        this.size = Utils.random(15, 25);
        this.hue = Utils.random(270, 320); // Purple to pink
        this.baseSpeed = 0.2;
        this.bobPhase = Utils.random(0, Math.PI * 2);
        this.tentaclePhase = Utils.random(0, Math.PI * 2);
    }
    
    update(deltaTime, playerX, playerY, playerSpeed, presenceLevel) {
        super.update(deltaTime, playerX, playerY, playerSpeed, presenceLevel);
        
        // Add gentle bobbing
        this.bobPhase += deltaTime * 0.002;
        this.vy += Math.sin(this.bobPhase) * 0.02;
    }
    
    render(ctx) {
        const pulse = Math.sin(this.pulsePhase * 0.5) * 0.1 + 0.9;
        const size = this.size * pulse;
        const bob = Math.sin(this.bobPhase) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        
        // Glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3);
        const alpha = this.glowIntensity * 0.25;
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);
        
        ctx.beginPath();
        ctx.arc(0, 0, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Bell (dome)
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.7, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, ${0.4 + this.glowIntensity * 0.3})`;
        ctx.fill();
        
        // Bell edge
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.3, 0, 0, Math.PI);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${0.5 + this.glowIntensity * 0.3})`;
        ctx.fill();
        
        // Tentacles
        const numTentacles = 5;
        for (let i = 0; i < numTentacles; i++) {
            const tx = Utils.map(i, 0, numTentacles - 1, -size * 0.7, size * 0.7);
            const wave = Math.sin(this.tentaclePhase + i * 0.5) * 5;
            
            ctx.beginPath();
            ctx.moveTo(tx, size * 0.2);
            ctx.quadraticCurveTo(
                tx + wave, size * 1.5,
                tx + wave * 0.5, size * 2.5
            );
            ctx.strokeStyle = `hsla(${this.hue}, 60%, 70%, ${0.3 + this.glowIntensity * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
        
        this.tentaclePhase += 0.05;
    }
}

// Sea anemone - stationary, retracts when startled
class Anemone extends Creature {
    constructor(x, y) {
        super(x, y, 'anemone');
        this.size = Utils.random(20, 35);
        this.hue = Utils.random(0, 40); // Orange to red
        this.baseSpeed = 0; // Stationary
        this.maxSpeed = 0;
        this.retraction = 0; // 0 = open, 1 = closed
        this.numTendrils = Utils.randomInt(8, 12);
        this.tendrilOffsets = [];
        for (let i = 0; i < this.numTendrils; i++) {
            this.tendrilOffsets.push(Utils.random(0, Math.PI * 2));
        }
    }
    
    update(deltaTime, playerX, playerY, playerSpeed, presenceLevel) {
        const distToPlayer = Utils.distance(this.x, this.y, playerX, playerY);
        
        // Retract if player is fast and nearby
        if (playerSpeed > 6 && distToPlayer < 150) {
            this.retraction = Math.min(1, this.retraction + 0.1);
            this.state = 'fleeing';
        } else {
            // Slowly open
            this.retraction = Math.max(0, this.retraction - 0.02);
            
            if (distToPlayer < 100 && playerSpeed < 3) {
                this.state = 'attracted';
                this.trust = Math.min(1, this.trust + 0.003);
                
                if (distToPlayer < 50 && this.trust > 0.5) {
                    this.state = 'connected';
                    this.connectionTime++;
                }
            } else {
                this.state = 'wandering';
            }
        }
        
        this.pulsePhase += deltaTime * 0.002;
        this.glowIntensity = Utils.lerp(this.glowIntensity, 
            this.state === 'connected' ? 1 : 0.5, 0.05);
    }
    
    render(ctx) {
        const openness = 1 - this.retraction;
        const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.9;
        const size = this.size * openness * pulse;
        
        // Glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, size * 2
        );
        const alpha = this.glowIntensity * 0.3 * openness;
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 50%, ${alpha})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 50%, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Base
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, size * 0.4, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue - 20}, 50%, 30%, 0.8)`;
        ctx.fill();
        
        // Tendrils
        for (let i = 0; i < this.numTendrils; i++) {
            const angle = (i / this.numTendrils) * Math.PI * 2;
            const wave = Math.sin(this.pulsePhase * 2 + this.tendrilOffsets[i]) * 10 * openness;
            const length = size * (0.8 + Math.sin(this.tendrilOffsets[i]) * 0.3);
            
            const startX = this.x + Math.cos(angle) * size * 0.2;
            const startY = this.y + Math.sin(angle) * size * 0.1;
            const endX = this.x + Math.cos(angle) * length + wave;
            const endY = this.y - size * 0.5 * openness + Math.sin(angle) * length * 0.3;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.quadraticCurveTo(
                (startX + endX) / 2 + wave * 0.5,
                (startY + endY) / 2,
                endX, endY
            );
            ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, ${0.5 + this.glowIntensity * 0.3})`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Tip glow
            ctx.beginPath();
            ctx.arc(endX, endY, 4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.hue + 30}, 80%, 70%, ${0.6 * openness})`;
            ctx.fill();
        }
    }
    
    constrainToBounds() {
        // Anemones don't move
    }
}

// Seahorse - rare, appears only with high presence
class Seahorse extends Creature {
    constructor(x, y) {
        super(x, y, 'seahorse');
        this.size = Utils.random(18, 25);
        this.hue = 45; // Golden
        this.baseSpeed = 0.3;
        this.visible = false;
        this.fadeProgress = 0;
    }
    
    update(deltaTime, playerX, playerY, playerSpeed, presenceLevel) {
        // Only appear with high presence
        if (presenceLevel > 0.7 && playerSpeed < 3) {
            this.visible = true;
            this.fadeProgress = Math.min(1, this.fadeProgress + 0.01);
        } else if (presenceLevel < 0.5 || playerSpeed > 5) {
            this.fadeProgress = Math.max(0, this.fadeProgress - 0.02);
            if (this.fadeProgress <= 0) {
                this.visible = false;
            }
        }
        
        if (this.visible) {
            super.update(deltaTime, playerX, playerY, playerSpeed, presenceLevel);
        }
        
        this.pulsePhase += deltaTime * 0.002;
    }
    
    render(ctx) {
        if (!this.visible || this.fadeProgress <= 0) return;
        
        const alpha = this.fadeProgress;
        const pulse = Math.sin(this.pulsePhase) * 0.1 + 0.9;
        const size = this.size * pulse;
        const bob = Math.sin(this.pulsePhase * 2) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.globalAlpha = alpha;
        
        // Golden glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4);
        gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${0.4 * this.glowIntensity})`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, 80%, 50%, ${0.1 * this.glowIntensity})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(0, 0, size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Head
        ctx.beginPath();
        ctx.arc(0, -size * 0.5, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, 0.8)`;
        ctx.fill();
        
        // Snout
        ctx.beginPath();
        ctx.ellipse(size * 0.6, -size * 0.5, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body (curved)
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.2);
        ctx.quadraticCurveTo(size * 0.3, size * 0.5, 0, size * 1.2);
        ctx.quadraticCurveTo(-size * 0.4, size * 0.5, 0, -size * 0.2);
        ctx.fill();
        
        // Tail curl
        ctx.beginPath();
        ctx.moveTo(0, size * 1.2);
        ctx.quadraticCurveTo(-size * 0.5, size * 1.8, -size * 0.3, size * 1.5);
        ctx.strokeStyle = `hsla(${this.hue}, 70%, 60%, 0.8)`;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(-size * 0.2, 0);
        ctx.lineTo(-size * 0.5, size * 0.3);
        ctx.lineTo(-size * 0.2, size * 0.6);
        ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, 0.6)`;
        ctx.fill();
        
        // Eye
        ctx.beginPath();
        ctx.arc(size * 0.15, -size * 0.55, size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        
        ctx.restore();
    }
}

// Creature Manager
class CreatureManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.creatures = [];
        this.connections = 0;
        this.nearbyCount = 0;
    }
    
    populate() {
        // Add fish schools
        for (let i = 0; i < 15; i++) {
            this.creatures.push(new GlowFish(
                Utils.random(100, this.width - 100),
                Utils.random(100, this.height - 100)
            ));
        }
        
        // Add jellyfish
        for (let i = 0; i < 5; i++) {
            this.creatures.push(new Jellyfish(
                Utils.random(100, this.width - 100),
                Utils.random(100, this.height - 100)
            ));
        }
        
        // Add anemones (scattered on "floor")
        for (let i = 0; i < 6; i++) {
            this.creatures.push(new Anemone(
                Utils.random(100, this.width - 100),
                this.height - Utils.random(50, 150)
            ));
        }
        
        // Add one rare seahorse
        this.creatures.push(new Seahorse(
            Utils.random(200, this.width - 200),
            Utils.random(200, this.height - 200)
        ));
    }
    
    update(deltaTime, playerX, playerY, playerSpeed, presenceLevel) {
        this.nearbyCount = 0;
        
        this.creatures.forEach(creature => {
            creature.update(deltaTime, playerX, playerY, playerSpeed, presenceLevel);
            creature.constrainToBounds(this.width, this.height);
            
            // Count nearby and connected
            const dist = Utils.distance(creature.x, creature.y, playerX, playerY);
            if (dist < 150) {
                this.nearbyCount++;
            }
            
            // Track connections
            if (creature.state === 'connected' && creature.connectionTime === 1) {
                this.connections++;
                GameEvents.emit('connection', creature.type);
            }
        });
    }
    
    render(ctx) {
        // Sort by y for depth (optional)
        const sorted = [...this.creatures].sort((a, b) => a.y - b.y);
        sorted.forEach(creature => creature.render(ctx));
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}

