/**
 * Project AURA - World Renderer
 * The Field of Still Water - A calming procedural world
 */

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // World state
        this.time = 0;
        this.breathLevel = 0.5;
        this.coherence = 0.5;
        this.regulationState = 'neutral';
        
        // Visual elements
        this.islands = [];
        this.particles = [];
        this.glowPaths = [];
        this.lightCreatures = [];
        this.stars = [];
        this.mountains = [];
        
        // Camera
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            zoom: 1
        };
        
        // World bounds
        this.worldWidth = 3000;
        this.worldHeight = 2000;
        
        // Colors
        this.colors = {
            skyTop: [10, 10, 30],
            skyBottom: [30, 20, 60],
            glow: [100, 255, 218],
            warmGlow: [255, 215, 0],
            purple: [123, 104, 238],
            water: [20, 40, 80]
        };
        
        // Fog effect
        this.fogDensity = 0;
        this.targetFogDensity = 0;
        
        // Challenge zones
        this.challengeZones = [];
        
        this.resize();
        this.generate();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        
        // Get actual viewport dimensions as fallback
        const rect = this.canvas.getBoundingClientRect();
        const width = rect.width || window.innerWidth;
        const height = rect.height || window.innerHeight;
        
        // Set canvas buffer size
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        
        // Reset transform and apply device pixel ratio scaling
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        
        // Store logical dimensions
        this.width = width;
        this.height = height;
        
        console.log('Canvas resized:', this.width, 'x', this.height);
    }

    generate() {
        // Generate floating islands
        this.islands = [];
        for (let i = 0; i < 15; i++) {
            this.islands.push({
                x: Utils.random(100, this.worldWidth - 100),
                y: Utils.random(100, this.worldHeight - 100),
                width: Utils.random(80, 200),
                height: Utils.random(30, 60),
                floatOffset: Utils.random(0, Math.PI * 2),
                floatSpeed: Utils.random(0.3, 0.6),
                floatAmount: Utils.random(3, 8),
                color: Utils.randomInt(0, 2)
            });
        }
        
        // Generate stars
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Utils.random(0, this.worldWidth),
                y: Utils.random(0, this.worldHeight * 0.5),
                size: Utils.random(1, 3),
                brightness: Utils.random(0.3, 1),
                twinkleSpeed: Utils.random(1, 3),
                twinkleOffset: Utils.random(0, Math.PI * 2)
            });
        }
        
        // Generate distant mountains
        this.mountains = [];
        for (let i = 0; i < 5; i++) {
            this.mountains.push({
                x: i * (this.worldWidth / 4),
                height: Utils.random(150, 300),
                width: Utils.random(300, 500),
                layers: Utils.randomInt(2, 4)
            });
        }
        
        // Generate glowing pathways
        this.glowPaths = [];
        for (let i = 0; i < 8; i++) {
            const startX = Utils.random(200, this.worldWidth - 200);
            const startY = Utils.random(200, this.worldHeight - 200);
            const path = {
                points: [{x: startX, y: startY}],
                pulseOffset: Utils.random(0, Math.PI * 2)
            };
            
            // Generate curved path
            let x = startX, y = startY;
            for (let j = 0; j < Utils.randomInt(5, 10); j++) {
                x += Utils.random(-100, 100);
                y += Utils.random(-50, 50);
                x = Utils.clamp(x, 100, this.worldWidth - 100);
                y = Utils.clamp(y, 100, this.worldHeight - 100);
                path.points.push({x, y});
            }
            
            this.glowPaths.push(path);
        }
        
        // Generate ambient light creatures
        this.lightCreatures = [];
        for (let i = 0; i < 20; i++) {
            this.lightCreatures.push({
                x: Utils.random(0, this.worldWidth),
                y: Utils.random(0, this.worldHeight),
                vx: Utils.random(-0.3, 0.3),
                vy: Utils.random(-0.2, 0.2),
                size: Utils.random(3, 8),
                brightness: Utils.random(0.5, 1),
                hue: Utils.random(160, 200),
                pulseOffset: Utils.random(0, Math.PI * 2)
            });
        }
        
        // Setup challenge zones
        this.challengeZones = [
            {
                id: 'windCrossing',
                x: 800,
                y: 600,
                radius: 150,
                name: 'The Wind Crossing'
            },
            {
                id: 'crystalGrove',
                x: 1800,
                y: 800,
                radius: 150,
                name: 'The Crystal Grove'
            },
            {
                id: 'lightAnimal',
                x: 2400,
                y: 500,
                radius: 150,
                name: 'The Light Animal'
            }
        ];
    }

    update(deltaTime, breathState, playerPos) {
        this.time += deltaTime * 0.001;
        
        // Update breath-related state
        this.breathLevel = breathState.level || 0.5;
        this.coherence = (breathState.coherence || 50) / 100;
        this.regulationState = breathState.stability > 60 ? 'calm' : 
                               breathState.stability < 30 ? 'dysregulated' : 'neutral';
        
        // Update fog based on breath state
        this.targetFogDensity = this.regulationState === 'dysregulated' ? 0.5 :
                               this.regulationState === 'calm' ? 0 : 0.2;
        this.fogDensity = Utils.lerp(this.fogDensity, this.targetFogDensity, 0.02);
        
        // Update camera to follow player
        if (playerPos) {
            this.camera.targetX = playerPos.x - this.width / 2;
            this.camera.targetY = playerPos.y - this.height / 2;
            
            // Clamp camera to world bounds
            this.camera.targetX = Utils.clamp(this.camera.targetX, 0, this.worldWidth - this.width);
            this.camera.targetY = Utils.clamp(this.camera.targetY, 0, this.worldHeight - this.height);
        }
        
        this.camera.x = Utils.lerp(this.camera.x, this.camera.targetX, 0.05);
        this.camera.y = Utils.lerp(this.camera.y, this.camera.targetY, 0.05);
        
        // Update light creatures
        this.lightCreatures.forEach(creature => {
            creature.x += creature.vx;
            creature.y += creature.vy;
            
            // Bounce off world edges
            if (creature.x < 0 || creature.x > this.worldWidth) creature.vx *= -1;
            if (creature.y < 0 || creature.y > this.worldHeight) creature.vy *= -1;
            
            // Slight attraction to player when calm
            if (playerPos && this.coherence > 0.6) {
                const dx = playerPos.x - creature.x;
                const dy = playerPos.y - creature.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 50 && dist < 300) {
                    creature.vx += (dx / dist) * 0.01 * this.coherence;
                    creature.vy += (dy / dist) * 0.01 * this.coherence;
                }
            }
            
            // Speed limit
            const speed = Math.sqrt(creature.vx ** 2 + creature.vy ** 2);
            if (speed > 0.5) {
                creature.vx = (creature.vx / speed) * 0.5;
                creature.vy = (creature.vy / speed) * 0.5;
            }
        });
        
        // Spawn particles based on breath
        if (Math.random() < this.coherence * 0.1) {
            this.spawnParticle(playerPos);
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.02; // Float upward
            p.life -= deltaTime * 0.001;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });
    }

    spawnParticle(playerPos) {
        if (!playerPos) return;
        
        this.particles.push({
            x: playerPos.x + Utils.random(-30, 30),
            y: playerPos.y + Utils.random(-20, 20),
            vx: Utils.random(-0.5, 0.5),
            vy: Utils.random(-1, -0.5),
            size: Utils.random(2, 5),
            life: Utils.random(1, 2),
            maxLife: 2,
            alpha: 1,
            hue: Utils.random(160, 200)
        });
    }

    render() {
        const ctx = this.ctx;
        
        // Debug check
        if (!this.width || !this.height) {
            console.warn('Canvas dimensions not set:', this.width, this.height);
            return;
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw sky gradient
        this.drawSky();
        
        // Draw stars
        this.drawStars();
        
        // Draw distant mountains
        this.drawMountains();
        
        // Draw glowing paths
        this.drawGlowPaths();
        
        // Draw islands
        this.drawIslands();
        
        // Draw light creatures
        this.drawLightCreatures();
        
        // Draw particles
        this.drawParticles();
        
        // Draw challenge zone indicators
        this.drawChallengeZones();
        
        // Draw fog overlay
        this.drawFog();
        
        // Draw vignette
        this.drawVignette();
    }

    drawSky() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        
        // Adjust sky colors based on coherence
        const coherenceMod = this.coherence;
        
        const topR = Utils.lerp(10, 20, coherenceMod);
        const topG = Utils.lerp(10, 15, coherenceMod);
        const topB = Utils.lerp(30, 50, coherenceMod);
        
        const bottomR = Utils.lerp(30, 40, coherenceMod);
        const bottomG = Utils.lerp(20, 30, coherenceMod);
        const bottomB = Utils.lerp(60, 80, coherenceMod);
        
        gradient.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
        gradient.addColorStop(1, `rgb(${bottomR}, ${bottomG}, ${bottomB})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawStars() {
        const ctx = this.ctx;
        
        // Debug: log first frame
        if (this.time < 0.1) {
            console.log('Drawing stars, count:', this.stars.length, 'width:', this.width, 'height:', this.height);
        }
        
        this.stars.forEach(star => {
            const screenX = star.x - this.camera.x * 0.3; // Parallax
            const screenY = star.y - this.camera.y * 0.3;
            
            if (screenX < -10 || screenX > this.width + 10) return;
            if (screenY < -10 || screenY > this.height + 10) return;
            
            const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            // Increased minimum brightness for visibility
            const brightness = Math.max(0.3, star.brightness * twinkle * (0.6 + this.coherence * 0.4));
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, star.size * 1.5, 0, Math.PI * 2);  // Slightly larger
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fill();
            
            // Glow effect for brighter stars
            if (star.brightness > 0.5) {
                ctx.beginPath();
                ctx.arc(screenX, screenY, star.size * 4, 0, Math.PI * 2);
                const gradient = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, star.size * 4
                );
                gradient.addColorStop(0, `rgba(200, 220, 255, ${brightness * 0.5})`);
                gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });
    }

    drawMountains() {
        const ctx = this.ctx;
        
        this.mountains.forEach((mountain, i) => {
            const parallax = 0.2 + i * 0.1;
            const screenX = mountain.x - this.camera.x * parallax;
            const baseY = this.height - 100;
            
            const depth = i / this.mountains.length;
            const alpha = 0.3 - depth * 0.15;
            
            ctx.beginPath();
            ctx.moveTo(screenX - mountain.width / 2, baseY);
            ctx.lineTo(screenX, baseY - mountain.height);
            ctx.lineTo(screenX + mountain.width / 2, baseY);
            ctx.closePath();
            
            const gradient = ctx.createLinearGradient(
                screenX, baseY - mountain.height,
                screenX, baseY
            );
            gradient.addColorStop(0, `rgba(60, 50, 100, ${alpha})`);
            gradient.addColorStop(1, `rgba(30, 25, 50, ${alpha})`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    drawIslands() {
        const ctx = this.ctx;
        
        this.islands.forEach(island => {
            const screenX = island.x - this.camera.x;
            const floatY = Math.sin(this.time * island.floatSpeed + island.floatOffset) * island.floatAmount;
            const screenY = island.y - this.camera.y + floatY;
            
            if (screenX < -island.width || screenX > this.width + island.width) return;
            if (screenY < -island.height || screenY > this.height + island.height) return;
            
            // Island body
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, island.width / 2, island.height / 2, 0, 0, Math.PI * 2);
            
            const colors = [
                [40, 60, 80],   // Dark blue
                [50, 70, 60],   // Dark teal
                [60, 50, 80]    // Purple
            ];
            const color = colors[island.color];
            
            const gradient = ctx.createRadialGradient(
                screenX, screenY - island.height / 4, 0,
                screenX, screenY, island.width / 2
            );
            gradient.addColorStop(0, `rgba(${color[0] + 20}, ${color[1] + 20}, ${color[2] + 20}, 0.9)`);
            gradient.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Glow effect
            ctx.beginPath();
            ctx.ellipse(screenX, screenY, island.width / 2 + 10, island.height / 2 + 5, 0, 0, Math.PI * 2);
            const glowGradient = ctx.createRadialGradient(
                screenX, screenY, island.width / 3,
                screenX, screenY, island.width / 2 + 10
            );
            const glowAlpha = 0.1 + this.coherence * 0.1;
            glowGradient.addColorStop(0, 'rgba(100, 255, 218, 0)');
            glowGradient.addColorStop(1, `rgba(100, 255, 218, ${glowAlpha})`);
            ctx.fillStyle = glowGradient;
            ctx.fill();
        });
    }

    drawGlowPaths() {
        const ctx = this.ctx;
        
        this.glowPaths.forEach(path => {
            if (path.points.length < 2) return;
            
            const pulse = Math.sin(this.time * 0.5 + path.pulseOffset) * 0.3 + 0.7;
            const alpha = (0.3 + this.coherence * 0.4) * pulse;
            
            ctx.beginPath();
            
            const first = path.points[0];
            ctx.moveTo(first.x - this.camera.x, first.y - this.camera.y);
            
            for (let i = 1; i < path.points.length; i++) {
                const p = path.points[i];
                ctx.lineTo(p.x - this.camera.x, p.y - this.camera.y);
            }
            
            ctx.strokeStyle = `rgba(100, 255, 218, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            
            // Glow effect
            ctx.strokeStyle = `rgba(100, 255, 218, ${alpha * 0.3})`;
            ctx.lineWidth = 10;
            ctx.stroke();
        });
    }

    drawLightCreatures() {
        const ctx = this.ctx;
        
        this.lightCreatures.forEach(creature => {
            const screenX = creature.x - this.camera.x;
            const screenY = creature.y - this.camera.y;
            
            if (screenX < -20 || screenX > this.width + 20) return;
            if (screenY < -20 || screenY > this.height + 20) return;
            
            const pulse = Math.sin(this.time * 2 + creature.pulseOffset) * 0.3 + 0.7;
            const size = creature.size * pulse;
            const alpha = creature.brightness * (0.3 + this.coherence * 0.5);
            
            // Core
            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${creature.hue}, 80%, 70%, ${alpha})`;
            ctx.fill();
            
            // Glow
            const gradient = ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, size * 4
            );
            gradient.addColorStop(0, `hsla(${creature.hue}, 80%, 70%, ${alpha * 0.5})`);
            gradient.addColorStop(1, `hsla(${creature.hue}, 80%, 70%, 0)`);
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, size * 4, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(particle => {
            const screenX = particle.x - this.camera.x;
            const screenY = particle.y - this.camera.y;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${particle.hue}, 80%, 70%, ${particle.alpha * 0.6})`;
            ctx.fill();
        });
    }

    drawChallengeZones() {
        const ctx = this.ctx;
        
        this.challengeZones.forEach(zone => {
            const screenX = zone.x - this.camera.x;
            const screenY = zone.y - this.camera.y;
            
            if (screenX < -zone.radius || screenX > this.width + zone.radius) return;
            if (screenY < -zone.radius || screenY > this.height + zone.radius) return;
            
            // Pulsing ring
            const pulse = Math.sin(this.time * 1.5) * 0.2 + 0.8;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, zone.radius * pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 * pulse})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Inner glow
            const gradient = ctx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, zone.radius
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, zone.radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Zone name
            if (zone.showName) {
                ctx.font = '14px Segoe UI';
                ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.textAlign = 'center';
                ctx.fillText(zone.name, screenX, screenY - zone.radius - 10);
            }
        });
    }

    drawFog() {
        if (this.fogDensity < 0.01) return;
        
        const ctx = this.ctx;
        ctx.fillStyle = `rgba(20, 20, 40, ${this.fogDensity})`;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawVignette() {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.8
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    // Check if player is near a challenge zone
    getActiveZone(playerPos) {
        for (const zone of this.challengeZones) {
            const dist = Utils.distance(playerPos.x, playerPos.y, zone.x, zone.y);
            if (dist < zone.radius) {
                return zone;
            }
        }
        return null;
    }

    // World-to-screen coordinate conversion
    worldToScreen(x, y) {
        return {
            x: x - this.camera.x,
            y: y - this.camera.y
        };
    }

    screenToWorld(x, y) {
        return {
            x: x + this.camera.x,
            y: y + this.camera.y
        };
    }
}
