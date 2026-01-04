/* Dragon's Breath - World Generator */

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Scrolling
        this.scrollX = 0;
        this.scrollSpeed = 2;
        
        // Collectibles
        this.stars = [];
        this.gems = [];
        
        // Obstacles
        this.clouds = [];
        
        // Background layers
        this.bgLayers = [];
        this.mountains = [];
        
        // Generation
        this.lastSpawnX = 0;
        this.spawnDistance = 300;
        
        this.init();
    }

    init() {
        this.resize();
        this.generateInitialWorld();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    generateInitialWorld() {
        // Generate background mountains
        for (let i = 0; i < 10; i++) {
            this.mountains.push({
                x: i * 400,
                width: Utils.random(200, 400),
                height: Utils.random(150, 300),
                hue: Utils.random(250, 280),
                layer: Math.floor(i % 3)
            });
        }
        
        // Generate initial clouds
        for (let i = 0; i < 8; i++) {
            this.clouds.push(this.createCloud(Utils.random(0, this.width * 2)));
        }
        
        // Generate initial collectibles
        for (let i = 0; i < 5; i++) {
            this.stars.push(this.createStar(Utils.random(200, this.width)));
        }
        
        this.lastSpawnX = this.width;
    }

    createCloud(x) {
        return {
            x: x,
            y: Utils.random(50, this.height - 150),
            width: Utils.random(100, 200),
            height: Utils.random(40, 80),
            speed: Utils.random(0.3, 0.8),
            opacity: Utils.random(0.3, 0.6)
        };
    }

    createStar(x) {
        return {
            x: x,
            y: Utils.random(100, this.height - 150),
            size: Utils.random(15, 25),
            rotation: 0,
            rotationSpeed: Utils.random(0.02, 0.05),
            collected: false,
            pulse: 0
        };
    }

    createGem(x) {
        return {
            x: x,
            y: Utils.random(100, this.height - 150),
            size: Utils.random(20, 30),
            hue: Utils.random(260, 300),
            collected: false,
            bobPhase: Utils.random(0, Math.PI * 2)
        };
    }

    update(deltaTime) {
        // Scroll world
        this.scrollX += this.scrollSpeed * (deltaTime / 16);
        
        // Update and clean up clouds
        this.clouds = this.clouds.filter(cloud => {
            cloud.x -= cloud.speed * (deltaTime / 16);
            return cloud.x + cloud.width > -this.scrollX;
        });
        
        // Update stars
        this.stars.forEach(star => {
            star.rotation += star.rotationSpeed;
            star.pulse += 0.05;
        });
        
        // Update gems
        this.gems.forEach(gem => {
            gem.bobPhase += 0.03;
        });
        
        // Clean up off-screen items
        this.stars = this.stars.filter(s => !s.collected && s.x > this.scrollX - 100);
        this.gems = this.gems.filter(g => !g.collected && g.x > this.scrollX - 100);
        
        // Spawn new items
        const rightEdge = this.scrollX + this.width;
        if (rightEdge > this.lastSpawnX + this.spawnDistance) {
            this.spawnContent(rightEdge);
            this.lastSpawnX = rightEdge;
        }
        
        // Keep clouds populated
        while (this.clouds.length < 8) {
            this.clouds.push(this.createCloud(rightEdge + Utils.random(100, 400)));
        }
        
        // Extend mountains
        const lastMountain = this.mountains[this.mountains.length - 1];
        if (lastMountain && lastMountain.x < rightEdge + 400) {
            this.mountains.push({
                x: lastMountain.x + 400,
                width: Utils.random(200, 400),
                height: Utils.random(150, 300),
                hue: Utils.random(250, 280),
                layer: (this.mountains.length) % 3
            });
        }
        
        // Clean up mountains
        this.mountains = this.mountains.filter(m => m.x + m.width > this.scrollX - 100);
    }

    spawnContent(x) {
        // Stars (common)
        if (Math.random() < 0.7) {
            this.stars.push(this.createStar(x + Utils.random(50, 200)));
        }
        
        // Multiple stars pattern
        if (Math.random() < 0.3) {
            const baseY = Utils.random(150, this.height - 200);
            for (let i = 0; i < 3; i++) {
                this.stars.push({
                    x: x + 100 + i * 50,
                    y: baseY + Math.sin(i) * 30,
                    size: 18,
                    rotation: 0,
                    rotationSpeed: 0.03,
                    collected: false,
                    pulse: i * 0.5
                });
            }
        }
        
        // Gems (rare)
        if (Math.random() < 0.2) {
            this.gems.push(this.createGem(x + Utils.random(100, 250)));
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#1a1a4e');
        skyGradient.addColorStop(0.5, '#3a2a6e');
        skyGradient.addColorStop(1, '#5a3a8e');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw background mountains
        this.renderMountains();
        
        // Draw clouds
        this.renderClouds();
        
        // Draw collectibles
        this.renderStars();
        this.renderGems();
    }

    renderMountains() {
        // Sort by layer (back to front)
        const sorted = [...this.mountains].sort((a, b) => a.layer - b.layer);
        
        sorted.forEach(mountain => {
            const parallax = 0.3 + mountain.layer * 0.2;
            const x = mountain.x - this.scrollX * parallax;
            
            if (x + mountain.width < 0 || x > this.width) return;
            
            const alpha = 0.3 + mountain.layer * 0.15;
            this.ctx.fillStyle = `hsla(${mountain.hue}, 30%, ${20 + mountain.layer * 10}%, ${alpha})`;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height);
            this.ctx.lineTo(x + mountain.width / 2, this.height - mountain.height);
            this.ctx.lineTo(x + mountain.width, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    renderClouds() {
        this.clouds.forEach(cloud => {
            const x = cloud.x - this.scrollX * 0.5;
            
            if (x + cloud.width < 0 || x > this.width) return;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            
            // Main cloud body
            this.ctx.beginPath();
            this.ctx.ellipse(x + cloud.width / 2, cloud.y, cloud.width / 2, cloud.height / 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Cloud puffs
            this.ctx.beginPath();
            this.ctx.arc(x + cloud.width * 0.3, cloud.y - cloud.height * 0.2, cloud.height * 0.4, 0, Math.PI * 2);
            this.ctx.arc(x + cloud.width * 0.6, cloud.y - cloud.height * 0.3, cloud.height * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderStars() {
        this.stars.forEach(star => {
            if (star.collected) return;
            
            const x = star.x - this.scrollX;
            if (x < -50 || x > this.width + 50) return;
            
            const pulse = Math.sin(star.pulse) * 0.2 + 1;
            const size = star.size * pulse;
            
            this.ctx.save();
            this.ctx.translate(x, star.y);
            this.ctx.rotate(star.rotation);
            
            // Glow
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Star shape
            this.ctx.fillStyle = '#ffd700';
            this.drawStar(0, 0, 5, size, size / 2);
            
            this.ctx.restore();
        });
    }

    renderGems() {
        this.gems.forEach(gem => {
            if (gem.collected) return;
            
            const x = gem.x - this.scrollX;
            if (x < -50 || x > this.width + 50) return;
            
            const bob = Math.sin(gem.bobPhase) * 5;
            
            this.ctx.save();
            this.ctx.translate(x, gem.y + bob);
            
            // Glow
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, gem.size * 1.5);
            gradient.addColorStop(0, `hsla(${gem.hue}, 70%, 60%, 0.4)`);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, gem.size * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Gem shape
            this.ctx.fillStyle = `hsl(${gem.hue}, 70%, 60%)`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -gem.size);
            this.ctx.lineTo(gem.size * 0.7, 0);
            this.ctx.lineTo(0, gem.size);
            this.ctx.lineTo(-gem.size * 0.7, 0);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Highlight
            this.ctx.fillStyle = `hsla(${gem.hue}, 70%, 80%, 0.6)`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -gem.size * 0.7);
            this.ctx.lineTo(gem.size * 0.3, -gem.size * 0.2);
            this.ctx.lineTo(0, 0);
            this.ctx.lineTo(-gem.size * 0.3, -gem.size * 0.2);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    checkCollisions(dragon) {
        const bounds = dragon.getBounds();
        const collected = { stars: 0, gems: 0 };
        
        // Check stars
        this.stars.forEach(star => {
            if (star.collected) return;
            
            const starX = star.x - this.scrollX;
            const dist = Utils.distance(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
                starX,
                star.y
            );
            
            if (dist < bounds.width / 2 + star.size) {
                star.collected = true;
                collected.stars++;
            }
        });
        
        // Check gems
        this.gems.forEach(gem => {
            if (gem.collected) return;
            
            const gemX = gem.x - this.scrollX;
            const dist = Utils.distance(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
                gemX,
                gem.y
            );
            
            if (dist < bounds.width / 2 + gem.size) {
                gem.collected = true;
                collected.gems++;
            }
        });
        
        return collected;
    }

    getDistance() {
        return Math.floor(this.scrollX / 10);
    }
}

console.log('Dragon World loaded');


