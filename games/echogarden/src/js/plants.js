/**
 * Echo Garden - Plant System
 * Plants that grow from sound
 */

// Base plant class
class Plant {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Growth
        this.growth = 0; // 0 to 1
        this.targetGrowth = 0;
        this.maxHeight = Utils.random(80, 150);
        this.growthSpeed = 0.001;
        
        // Visual
        this.hue = 120; // Green base
        this.segments = [];
        this.swayPhase = Utils.random(0, Math.PI * 2);
        this.swaySpeed = Utils.random(0.5, 1.5);
        
        // State
        this.isPlanted = false;
        this.isGrowing = false;
        this.isFullyGrown = false;
        this.bloomPhase = 0;
        
        // Sound response
        this.soundResonance = 0;
    }
    
    plant() {
        this.isPlanted = true;
        this.isGrowing = true;
        this.targetGrowth = 0.1;
        GameEvents.emit('plantPlanted', { type: this.type, x: this.x, y: this.y });
    }
    
    nurture(amount) {
        if (!this.isPlanted) return;
        this.targetGrowth = Math.min(1, this.targetGrowth + amount);
        this.soundResonance = Math.min(1, this.soundResonance + 0.1);
    }
    
    update(deltaTime, soundState) {
        if (!this.isPlanted) return;
        
        // Grow toward target
        if (this.growth < this.targetGrowth) {
            this.growth += this.growthSpeed * deltaTime;
            
            if (this.growth >= 1 && !this.isFullyGrown) {
                this.isFullyGrown = true;
                this.isGrowing = false;
                GameEvents.emit('plantFullyGrown', { type: this.type });
            }
        }
        
        // Update sway
        this.swayPhase += deltaTime * 0.001 * this.swaySpeed;
        
        // Decay resonance
        this.soundResonance = Math.max(0, this.soundResonance - deltaTime * 0.0005);
        
        // Bloom animation
        if (this.isFullyGrown) {
            this.bloomPhase += deltaTime * 0.002;
        }
        
        // Respond to sound
        if (soundState && soundState.volume > 0.1) {
            this.soundResonance = Math.min(1, this.soundResonance + soundState.volume * 0.1);
        }
    }
    
    render(ctx) {
        // Override in subclasses
    }
    
    getCurrentHeight() {
        return this.maxHeight * this.growth;
    }
}

// Glowing flower
class GlowFlower extends Plant {
    constructor(x, y) {
        super(x, y, 'flower');
        this.hue = Utils.random(280, 340); // Purple to pink
        this.petalCount = Utils.randomInt(5, 8);
        this.stemWidth = Utils.random(3, 5);
    }
    
    render(ctx) {
        if (!this.isPlanted || this.growth < 0.01) return;
        
        const height = this.getCurrentHeight();
        const sway = Math.sin(this.swayPhase) * 10 * this.growth;
        const resonanceGlow = this.soundResonance * 0.3;
        
        // Stem
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(
            this.x + sway * 0.5, this.y - height * 0.5,
            this.x + sway, this.y - height
        );
        ctx.strokeStyle = `hsla(120, 50%, 30%, ${0.6 + resonanceGlow})`;
        ctx.lineWidth = this.stemWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Leaves
        if (this.growth > 0.3) {
            const leafY = this.y - height * 0.4;
            const leafSway = sway * 0.4;
            
            // Left leaf
            ctx.beginPath();
            ctx.moveTo(this.x + leafSway, leafY);
            ctx.quadraticCurveTo(
                this.x + leafSway - 20, leafY - 10,
                this.x + leafSway - 15, leafY + 5
            );
            ctx.strokeStyle = `hsla(120, 60%, 35%, 0.7)`;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Right leaf
            ctx.beginPath();
            ctx.moveTo(this.x + leafSway, leafY);
            ctx.quadraticCurveTo(
                this.x + leafSway + 20, leafY - 10,
                this.x + leafSway + 15, leafY + 5
            );
            ctx.stroke();
        }
        
        // Flower head
        if (this.growth > 0.5) {
            const headX = this.x + sway;
            const headY = this.y - height;
            const flowerSize = 15 * Utils.smoothStep((this.growth - 0.5) * 2);
            const bloomPulse = this.isFullyGrown ? Math.sin(this.bloomPhase) * 0.1 + 1 : 1;
            
            // Glow
            const gradient = ctx.createRadialGradient(
                headX, headY, 0,
                headX, headY, flowerSize * 3 * bloomPulse
            );
            gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${0.3 + resonanceGlow})`);
            gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);
            
            ctx.beginPath();
            ctx.arc(headX, headY, flowerSize * 3 * bloomPulse, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Petals
            for (let i = 0; i < this.petalCount; i++) {
                const angle = (i / this.petalCount) * Math.PI * 2 + this.swayPhase * 0.2;
                const petalLength = flowerSize * bloomPulse;
                
                ctx.beginPath();
                ctx.ellipse(
                    headX + Math.cos(angle) * petalLength * 0.5,
                    headY + Math.sin(angle) * petalLength * 0.5,
                    petalLength * 0.8,
                    petalLength * 0.4,
                    angle,
                    0, Math.PI * 2
                );
                ctx.fillStyle = `hsla(${this.hue}, 70%, 65%, ${0.7 + resonanceGlow})`;
                ctx.fill();
            }
            
            // Center
            ctx.beginPath();
            ctx.arc(headX, headY, flowerSize * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(50, 80%, 60%, 0.9)`;
            ctx.fill();
        }
    }
}

// Luminous mushroom
class GlowMushroom extends Plant {
    constructor(x, y) {
        super(x, y, 'mushroom');
        this.hue = Utils.random(180, 220); // Cyan to blue
        this.maxHeight = Utils.random(40, 80);
        this.capWidth = Utils.random(25, 45);
    }
    
    render(ctx) {
        if (!this.isPlanted || this.growth < 0.01) return;
        
        const height = this.getCurrentHeight();
        const capWidth = this.capWidth * this.growth;
        const sway = Math.sin(this.swayPhase * 0.5) * 3;
        const resonanceGlow = this.soundResonance * 0.4;
        const pulse = this.isFullyGrown ? Math.sin(this.bloomPhase) * 0.1 + 1 : 1;
        
        // Stem
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y);
        ctx.lineTo(this.x - 4 + sway, this.y - height);
        ctx.lineTo(this.x + 4 + sway, this.y - height);
        ctx.lineTo(this.x + 6, this.y);
        ctx.closePath();
        ctx.fillStyle = `hsla(${this.hue}, 30%, 80%, 0.8)`;
        ctx.fill();
        
        // Cap glow
        const capY = this.y - height;
        const gradient = ctx.createRadialGradient(
            this.x + sway, capY, 0,
            this.x + sway, capY, capWidth * 2 * pulse
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${0.4 + resonanceGlow})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x + sway, capY, capWidth * 2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Cap
        ctx.beginPath();
        ctx.ellipse(
            this.x + sway, capY,
            capWidth * pulse, capWidth * 0.5 * pulse,
            0, Math.PI, Math.PI * 2
        );
        ctx.fillStyle = `hsla(${this.hue}, 60%, 50%, ${0.8 + resonanceGlow * 0.2})`;
        ctx.fill();
        
        // Spots
        if (this.growth > 0.7) {
            const spots = 5;
            for (let i = 0; i < spots; i++) {
                const angle = (i / spots) * Math.PI - Math.PI / 2;
                const dist = capWidth * 0.5 * pulse;
                ctx.beginPath();
                ctx.arc(
                    this.x + sway + Math.cos(angle) * dist,
                    capY - Math.sin(angle) * dist * 0.3 - 5,
                    3, 0, Math.PI * 2
                );
                ctx.fillStyle = `hsla(${this.hue}, 50%, 80%, 0.7)`;
                ctx.fill();
            }
        }
    }
}

// Crystal plant
class CrystalPlant extends Plant {
    constructor(x, y) {
        super(x, y, 'crystal');
        this.hue = Utils.random(40, 60); // Gold
        this.maxHeight = Utils.random(60, 100);
        this.crystalCount = Utils.randomInt(3, 6);
        this.crystalAngles = [];
        for (let i = 0; i < this.crystalCount; i++) {
            this.crystalAngles.push({
                angle: Utils.random(-0.5, 0.5),
                height: Utils.random(0.5, 1),
                width: Utils.random(0.7, 1)
            });
        }
    }
    
    render(ctx) {
        if (!this.isPlanted || this.growth < 0.01) return;
        
        const height = this.getCurrentHeight();
        const resonanceGlow = this.soundResonance * 0.5;
        const pulse = this.isFullyGrown ? Math.sin(this.bloomPhase * 2) * 0.1 + 1 : 1;
        
        // Main crystal and branches
        this.crystalAngles.forEach((crystal, i) => {
            const crystalHeight = height * crystal.height * this.growth;
            const crystalWidth = 8 * crystal.width;
            const sway = Math.sin(this.swayPhase + i) * 2;
            
            const baseX = this.x + (i - this.crystalCount / 2) * 8;
            const tipX = baseX + crystal.angle * crystalHeight + sway;
            const tipY = this.y - crystalHeight;
            
            // Crystal glow
            const gradient = ctx.createRadialGradient(
                tipX, tipY, 0,
                tipX, tipY, crystalWidth * 4 * pulse
            );
            gradient.addColorStop(0, `hsla(${this.hue}, 80%, 60%, ${0.3 + resonanceGlow})`);
            gradient.addColorStop(1, `hsla(${this.hue}, 80%, 60%, 0)`);
            
            ctx.beginPath();
            ctx.arc(tipX, tipY, crystalWidth * 4 * pulse, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Crystal shape
            ctx.beginPath();
            ctx.moveTo(baseX - crystalWidth / 2, this.y);
            ctx.lineTo(tipX, tipY);
            ctx.lineTo(baseX + crystalWidth / 2, this.y);
            ctx.closePath();
            
            const crystalGradient = ctx.createLinearGradient(
                baseX, this.y, tipX, tipY
            );
            crystalGradient.addColorStop(0, `hsla(${this.hue}, 60%, 40%, 0.7)`);
            crystalGradient.addColorStop(1, `hsla(${this.hue}, 80%, 70%, ${0.9 + resonanceGlow * 0.1})`);
            
            ctx.fillStyle = crystalGradient;
            ctx.fill();
            
            // Highlight
            ctx.beginPath();
            ctx.moveTo(baseX, this.y - 5);
            ctx.lineTo(tipX - 2, tipY + 5);
            ctx.strokeStyle = `hsla(${this.hue}, 50%, 90%, 0.5)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
}

// Vine/tendril plant
class VinePlant extends Plant {
    constructor(x, y) {
        super(x, y, 'vine');
        this.hue = Utils.random(100, 140); // Green
        this.maxHeight = Utils.random(100, 180);
        this.curvePoints = [];
        this.generateCurve();
    }
    
    generateCurve() {
        const segments = 8;
        let x = 0;
        let y = 0;
        
        for (let i = 0; i <= segments; i++) {
            this.curvePoints.push({
                x: x,
                y: y,
                leafSide: i % 2 === 0 ? -1 : 1
            });
            
            x += Utils.random(-15, 15);
            y -= this.maxHeight / segments;
        }
    }
    
    render(ctx) {
        if (!this.isPlanted || this.growth < 0.01) return;
        
        const resonanceGlow = this.soundResonance * 0.3;
        const visiblePoints = Math.ceil(this.curvePoints.length * this.growth);
        
        // Draw vine
        ctx.beginPath();
        ctx.moveTo(this.x + this.curvePoints[0].x, this.y + this.curvePoints[0].y);
        
        for (let i = 1; i < visiblePoints; i++) {
            const point = this.curvePoints[i];
            const prevPoint = this.curvePoints[i - 1];
            const sway = Math.sin(this.swayPhase + i * 0.3) * (3 + i);
            
            const cpX = this.x + (prevPoint.x + point.x) / 2 + sway;
            const cpY = this.y + (prevPoint.y + point.y) / 2;
            
            ctx.quadraticCurveTo(
                cpX, cpY,
                this.x + point.x + sway, this.y + point.y
            );
        }
        
        ctx.strokeStyle = `hsla(${this.hue}, 50%, 35%, ${0.8 + resonanceGlow})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw leaves
        for (let i = 2; i < visiblePoints; i += 2) {
            const point = this.curvePoints[i];
            const sway = Math.sin(this.swayPhase + i * 0.3) * (3 + i);
            const leafX = this.x + point.x + sway;
            const leafY = this.y + point.y;
            const leafSize = 12 + Math.sin(this.bloomPhase + i) * 2;
            
            // Leaf glow
            const gradient = ctx.createRadialGradient(
                leafX + point.leafSide * 15, leafY, 0,
                leafX + point.leafSide * 15, leafY, leafSize * 2
            );
            gradient.addColorStop(0, `hsla(${this.hue}, 70%, 50%, ${0.2 + resonanceGlow})`);
            gradient.addColorStop(1, `hsla(${this.hue}, 70%, 50%, 0)`);
            
            ctx.beginPath();
            ctx.arc(leafX + point.leafSide * 15, leafY, leafSize * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Leaf shape
            ctx.beginPath();
            ctx.ellipse(
                leafX + point.leafSide * 15, leafY,
                leafSize, leafSize * 0.5,
                point.leafSide * 0.3 + Math.sin(this.swayPhase) * 0.1,
                0, Math.PI * 2
            );
            ctx.fillStyle = `hsla(${this.hue}, 60%, 45%, ${0.7 + resonanceGlow})`;
            ctx.fill();
        }
    }
}

// Seed in the ground (waiting to grow)
class Seed {
    constructor(x, y, plantType) {
        this.x = x;
        this.y = y;
        this.plantType = plantType;
        this.pulse = 0;
        this.glowIntensity = 0;
        this.isGrowing = false;
        
        // Visual properties
        this.size = Utils.random(6, 10);
        this.hue = plantType === 'flower' ? Utils.random(280, 340) :
                   plantType === 'mushroom' ? Utils.random(180, 220) :
                   plantType === 'crystal' ? Utils.random(40, 60) :
                   Utils.random(100, 140);
    }
    
    update(deltaTime) {
        this.pulse += deltaTime * 0.003;
        // Gentle pulsing glow
        this.glowIntensity = 0.3 + Math.sin(this.pulse) * 0.2;
    }
    
    render(ctx) {
        const pulseSize = this.size + Math.sin(this.pulse * 2) * 2;
        
        // Ground mound
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 3, pulseSize * 1.5, pulseSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(30, 30%, 20%, 0.6)`;
        ctx.fill();
        
        // Seed glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, pulseSize * 3
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 50%, ${this.glowIntensity})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 50%, 0)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Seed itself
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, pulseSize * 0.8, pulseSize * 0.5, Math.PI * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 50%, 40%, 0.9)`;
        ctx.fill();
        
        // Tiny sprout hint
        if (Math.sin(this.pulse) > 0.5) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - pulseSize * 0.3);
            ctx.lineTo(this.x - 2, this.y - pulseSize * 0.8);
            ctx.lineTo(this.x + 2, this.y - pulseSize * 0.8);
            ctx.closePath();
            ctx.fillStyle = `hsla(120, 60%, 40%, 0.7)`;
            ctx.fill();
        }
    }
}

// Garden manager
class Garden {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.plants = [];
        this.seeds = []; // Seeds waiting to grow
        this.plantTypes = [GlowFlower, GlowMushroom, CrystalPlant, VinePlant];
        this.plantTypeNames = ['flower', 'mushroom', 'crystal', 'vine'];
        
        this.plantsGrown = 0;
        this.seedsPlanted = 0;
        
        // Planting zones (bottom portion of screen)
        this.groundLevel = height * 0.85;
    }
    
    // Called every 5 harmonies - plants a seed in the ground
    plantSeedFromHarmony() {
        // Choose random plant type
        const typeIndex = Utils.randomInt(0, this.plantTypeNames.length - 1);
        const plantType = this.plantTypeNames[typeIndex];
        
        // Find a good spot
        const x = Utils.random(100, this.width - 100);
        const y = this.groundLevel + Utils.random(-10, 10);
        
        // Check for spacing from other seeds and plants
        const tooCloseToSeed = this.seeds.some(s => 
            Utils.distance(s.x, s.y, x, y) < 80
        );
        const tooCloseToPlant = this.plants.some(p => 
            Utils.distance(p.x, p.y, x, y) < 80
        );
        
        if (tooCloseToSeed || tooCloseToPlant) {
            // Try again with offset
            return this.plantSeedFromHarmony();
        }
        
        const seed = new Seed(x, y, plantType);
        this.seeds.push(seed);
        this.seedsPlanted++;
        
        GameEvents.emit('seedPlanted', { type: plantType, x, y });
        
        return seed;
    }
    
    // Called every 5 breaths - grows a seed into a plant
    growSeedFromBreath() {
        if (this.seeds.length === 0) return null;
        
        // Get the oldest seed
        const seed = this.seeds.shift();
        
        // Determine plant class based on seed type
        let PlantClass;
        switch (seed.plantType) {
            case 'flower': PlantClass = GlowFlower; break;
            case 'mushroom': PlantClass = GlowMushroom; break;
            case 'crystal': PlantClass = CrystalPlant; break;
            case 'vine': PlantClass = VinePlant; break;
            default: PlantClass = GlowFlower;
        }
        
        const plant = new PlantClass(seed.x, seed.y);
        plant.plant();
        // Start with some growth so it's immediately visible
        plant.targetGrowth = 0.3;
        this.plants.push(plant);
        this.plantsGrown++;
        
        GameEvents.emit('plantSprouted', { type: seed.plantType, x: seed.x, y: seed.y });
        
        return plant;
    }
    
    // Legacy method for direct planting (kept for compatibility)
    plantSeed(soundState) {
        // Determine plant type based on pitch
        let PlantClass;
        if (soundState.pitch > 300) {
            PlantClass = CrystalPlant;
        } else if (soundState.pitch > 200) {
            PlantClass = GlowFlower;
        } else if (soundState.pitch > 100) {
            PlantClass = VinePlant;
        } else {
            PlantClass = GlowMushroom;
        }
        
        // Find a good spot
        const x = Utils.random(100, this.width - 100);
        const y = this.groundLevel + Utils.random(-20, 20);
        
        // Check for spacing
        const tooClose = this.plants.some(p => 
            Utils.distance(p.x, p.y, x, y) < 60
        );
        
        if (tooClose) return null;
        
        const plant = new PlantClass(x, y);
        plant.plant();
        this.plants.push(plant);
        this.plantsGrown++;
        
        return plant;
    }
    
    update(deltaTime, soundState) {
        // Update seeds
        this.seeds.forEach(seed => seed.update(deltaTime));
        
        // Update plants
        this.plants.forEach(plant => {
            plant.update(deltaTime, soundState);
            
            // Nurture growing plants with breath
            if (soundState.soundType === 'breath' && plant.isGrowing) {
                plant.nurture(0.002 * deltaTime);
            }
            
            // Extra nurture during harmony
            if (soundState.pitchStability > 0.7 && plant.isGrowing) {
                plant.nurture(0.003 * deltaTime);
            }
        });
    }
    
    render(ctx) {
        // Render seeds first (they're in the ground)
        this.seeds.forEach(seed => seed.render(ctx));
        
        // Sort plants by y for depth
        const sorted = [...this.plants].sort((a, b) => a.y - b.y);
        sorted.forEach(plant => plant.render(ctx));
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.groundLevel = height * 0.85;
    }
    
    getSeedCount() {
        return this.seeds.length;
    }
}

