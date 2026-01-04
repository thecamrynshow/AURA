/* ============================================
   THE DEEP — Ocean Renderer
   Visual world with depth-based rendering
   ============================================ */

class Ocean {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        this.depth = 0;
        this.targetDepth = 0;
        this.maxDepth = 2000;
        
        // Player (diver)
        this.player = {
            x: 0,
            y: 0,
            targetY: 0,
            velocity: 0
        };
        
        // Particles (bubbles, marine snow)
        this.particles = [];
        this.maxParticles = 100;
        
        // Light rays
        this.lightRays = [];
        this.maxLightRays = 8;
        
        // Creatures
        this.creatures = [];
        this.creatureSpawnTimer = 0;
        this.creatureSpawnInterval = 3000; // ms
        
        // Discovered creatures
        this.discoveries = new Set();
        
        // Animation
        this.time = 0;
        this.animationFrame = null;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.player.x = this.width / 2;
        this.player.y = this.height / 2;
        this.player.targetY = this.player.y;
    }

    init() {
        this.initParticles();
        this.initLightRays();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        const isBubble = Math.random() < 0.3;
        return {
            x: randomFloat(0, this.width),
            y: randomFloat(0, this.height),
            size: isBubble ? randomFloat(3, 8) : randomFloat(1, 3),
            speed: isBubble ? randomFloat(1, 3) : randomFloat(0.2, 0.8),
            opacity: randomFloat(0.2, 0.6),
            isBubble,
            wobble: randomFloat(0, Math.PI * 2)
        };
    }

    initLightRays() {
        this.lightRays = [];
        for (let i = 0; i < this.maxLightRays; i++) {
            this.lightRays.push({
                x: randomFloat(0, this.width),
                width: randomFloat(50, 150),
                opacity: randomFloat(0.05, 0.15),
                speed: randomFloat(0.1, 0.3)
            });
        }
    }

    // Update player based on breath state
    updatePlayer(breathState, deltaTime) {
        const breathForce = 2;
        
        if (breathState === 'inhale') {
            this.player.velocity -= breathForce * deltaTime;
        } else if (breathState === 'exhale') {
            this.player.velocity += breathForce * deltaTime;
        } else {
            // Neutral - slow descent
            this.player.velocity += 0.3 * deltaTime;
        }
        
        // Apply drag
        this.player.velocity *= 0.98;
        
        // Clamp velocity
        this.player.velocity = clamp(this.player.velocity, -3, 3);
        
        // Update target Y
        this.player.targetY += this.player.velocity;
        this.player.targetY = clamp(this.player.targetY, this.height * 0.2, this.height * 0.8);
        
        // Smooth player position
        this.player.y = lerp(this.player.y, this.player.targetY, 0.1);
        
        // Update depth based on velocity
        if (this.player.velocity > 0.1) {
            this.targetDepth += this.player.velocity * 2;
        } else if (this.player.velocity < -0.1) {
            this.targetDepth += this.player.velocity * 2;
        }
        
        this.targetDepth = clamp(this.targetDepth, 0, this.maxDepth);
        this.depth = lerp(this.depth, this.targetDepth, 0.05);
    }

    updateParticles(deltaTime) {
        this.particles.forEach(p => {
            if (p.isBubble) {
                // Bubbles rise
                p.y -= p.speed * deltaTime * 60;
                p.wobble += 0.1;
                p.x += Math.sin(p.wobble) * 0.5;
            } else {
                // Marine snow falls
                p.y += p.speed * deltaTime * 60;
            }
            
            // Wrap around
            if (p.y < -10) p.y = this.height + 10;
            if (p.y > this.height + 10) p.y = -10;
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;
        });
    }

    updateLightRays(deltaTime) {
        // Fade light rays based on depth
        const lightFactor = Math.max(0, 1 - this.depth / 500);
        
        this.lightRays.forEach(ray => {
            ray.x += ray.speed * deltaTime * 60;
            if (ray.x > this.width + ray.width) {
                ray.x = -ray.width;
            }
            ray.currentOpacity = ray.opacity * lightFactor;
        });
    }

    updateCreatures(deltaTime) {
        // Spawn new creatures
        this.creatureSpawnTimer += deltaTime * 1000;
        
        if (this.creatureSpawnTimer >= this.creatureSpawnInterval) {
            this.creatureSpawnTimer = 0;
            this.trySpawnCreature();
        }
        
        // Update existing creatures
        this.creatures = this.creatures.filter(creature => {
            const alive = creature.update(deltaTime);
            
            // Check for discovery
            if (!creature.discovered && creature.isNearPlayer(this.player.x, this.player.y)) {
                creature.discovered = true;
                if (!this.discoveries.has(creature.data.id)) {
                    this.discoveries.add(creature.data.id);
                    this.onDiscovery(creature.data);
                }
            }
            
            return alive;
        });
    }

    trySpawnCreature() {
        const available = getCreaturesAtDepth(this.depth);
        if (available.length === 0) return;
        
        // Don't spawn too many
        if (this.creatures.length >= 5) return;
        
        // Pick random creature
        const creatureData = randomPick(available);
        
        // Check if unique and already spawned
        if (creatureData.unique && this.discoveries.has(creatureData.id)) return;
        
        const creature = new Creature(creatureData, this.width, this.height, this.depth);
        this.creatures.push(creature);
    }

    // Callback when creature is discovered
    onDiscovery(creatureData) {
        // Override in main.js
        console.log('Discovered:', creatureData.name);
    }

    // Draw the ocean
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw gradient background
        this.drawBackground();
        
        // Draw light rays (only near surface)
        if (this.depth < 500) {
            this.drawLightRays();
        }
        
        // Draw particles
        this.drawParticles();
        
        // Draw creatures
        this.creatures.forEach(c => c.draw(this.ctx));
        
        // Draw player (diver)
        this.drawPlayer();
        
        // Draw vignette at depth
        if (this.depth > 300) {
            this.drawVignette();
        }
    }

    drawBackground() {
        const colors = getDepthColor(this.depth);
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(1, colors.bottom);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawLightRays() {
        this.lightRays.forEach(ray => {
            if (ray.currentOpacity <= 0) return;
            
            const gradient = this.ctx.createLinearGradient(ray.x, 0, ray.x + ray.width, this.height);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${ray.currentOpacity})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(ray.x, 0);
            this.ctx.lineTo(ray.x + ray.width, 0);
            this.ctx.lineTo(ray.x + ray.width * 1.5, this.height);
            this.ctx.lineTo(ray.x + ray.width * 0.5, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    drawParticles() {
        const zone = getZoneByDepth(this.depth);
        const glowColor = this.depth > 500 ? '#00ffff' : '#ffffff';
        
        this.particles.forEach(p => {
            this.ctx.beginPath();
            
            if (p.isBubble) {
                // Bubbles
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
                this.ctx.lineWidth = 1;
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Marine snow / bioluminescence
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                
                if (this.depth > 500) {
                    // Bioluminescent at depth
                    this.ctx.fillStyle = `rgba(0, 255, 255, ${p.opacity})`;
                    
                    // Glow effect
                    const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
                    glow.addColorStop(0, `rgba(0, 255, 255, ${p.opacity * 0.5})`);
                    glow.addColorStop(1, 'transparent');
                    this.ctx.fillStyle = glow;
                    this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                } else {
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.3})`;
                }
                
                this.ctx.fill();
            }
        });
    }

    drawPlayer() {
        const x = this.player.x;
        const y = this.player.y;
        
        this.ctx.save();
        
        // Glow
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 60);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 60, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Diver silhouette
        this.ctx.fillStyle = 'rgba(0, 50, 80, 0.8)';
        
        // Head
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - 20, 10, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Body
        this.ctx.beginPath();
        this.ctx.roundRect(x - 8, y - 8, 16, 28, 4);
        this.ctx.fill();
        
        // Arms
        this.ctx.beginPath();
        this.ctx.roundRect(x - 20, y - 5, 8, 20, 3);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.roundRect(x + 12, y - 5, 8, 20, 3);
        this.ctx.fill();
        
        // Legs
        this.ctx.beginPath();
        this.ctx.roundRect(x - 6, y + 20, 6, 18, 3);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.roundRect(x, y + 20, 6, 18, 3);
        this.ctx.fill();
        
        // Bubbles from diver
        if (Math.random() < 0.1) {
            this.particles.push({
                x: x + randomFloat(-10, 10),
                y: y - 30,
                size: randomFloat(2, 5),
                speed: randomFloat(1, 2),
                opacity: 0.6,
                isBubble: true,
                wobble: 0
            });
        }
        
        this.ctx.restore();
    }

    drawVignette() {
        const intensity = Math.min((this.depth - 300) / 700, 0.7);
        
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.8
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    start() {
        this.init();
        this.lastTime = performance.now();
        this.animate();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.time += deltaTime;
        
        this.updateParticles(deltaTime);
        this.updateLightRays(deltaTime);
        this.updateCreatures(deltaTime);
        
        this.draw();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

console.log('The Deep Ocean loaded');



