/**
 * Tidepool - World Renderer
 * Underwater tidepool environment
 */

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Visual state
        this.time = 0;
        this.clarity = 0.5; // Water clarity (0-1)
        this.targetClarity = 0.5;
        
        // Ambient elements
        this.bubbles = [];
        this.particles = [];
        this.caustics = [];
        this.rocks = [];
        this.plants = [];
        
        // Colors
        this.colors = {
            deepWater: [3, 8, 16],
            midWater: [5, 21, 37],
            shallowWater: [10, 40, 60],
            caustic: [0, 255, 255]
        };
        
        this.resize();
        this.generate();
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        // Regenerate background elements on resize
        this.generate();
    }
    
    generate() {
        // Generate rocks along bottom
        this.rocks = [];
        const numRocks = Math.floor(this.width / 100);
        for (let i = 0; i < numRocks; i++) {
            this.rocks.push({
                x: Utils.random(0, this.width),
                y: this.height - Utils.random(20, 80),
                width: Utils.random(40, 120),
                height: Utils.random(30, 60),
                color: Utils.randomInt(0, 2)
            });
        }
        
        // Generate seaweed/plants
        this.plants = [];
        const numPlants = Math.floor(this.width / 80);
        for (let i = 0; i < numPlants; i++) {
            this.plants.push({
                x: Utils.random(50, this.width - 50),
                baseY: this.height - Utils.random(10, 40),
                height: Utils.random(60, 150),
                segments: Utils.randomInt(4, 8),
                hue: Utils.random(120, 180),
                phase: Utils.random(0, Math.PI * 2),
                width: Utils.random(8, 15)
            });
        }
        
        // Generate caustic light patterns
        this.caustics = [];
        for (let i = 0; i < 20; i++) {
            this.caustics.push({
                x: Utils.random(0, this.width),
                y: Utils.random(0, this.height * 0.7),
                size: Utils.random(50, 150),
                speed: Utils.random(0.0003, 0.0008),
                phase: Utils.random(0, Math.PI * 2)
            });
        }
    }
    
    update(deltaTime, presenceLevel) {
        this.time += deltaTime;
        
        // Update clarity based on presence
        this.targetClarity = 0.3 + presenceLevel * 0.5;
        this.clarity = Utils.lerp(this.clarity, this.targetClarity, 0.02);
        
        // Spawn bubbles occasionally
        if (Math.random() < 0.02) {
            this.spawnBubble();
        }
        
        // Update bubbles
        this.bubbles = this.bubbles.filter(bubble => {
            bubble.y -= bubble.speed;
            bubble.x += Math.sin(bubble.wobble + this.time * 0.002) * 0.3;
            bubble.wobble += 0.02;
            return bubble.y > -bubble.size;
        });
        
        // Spawn particles based on presence
        if (Math.random() < presenceLevel * 0.05) {
            this.spawnParticle();
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime * 0.001;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });
    }
    
    spawnBubble() {
        this.bubbles.push({
            x: Utils.random(50, this.width - 50),
            y: this.height + 10,
            size: Utils.random(3, 10),
            speed: Utils.random(0.5, 1.5),
            wobble: Utils.random(0, Math.PI * 2),
            alpha: Utils.random(0.2, 0.5)
        });
    }
    
    spawnParticle() {
        this.particles.push({
            x: Utils.random(0, this.width),
            y: Utils.random(0, this.height),
            vx: Utils.random(-0.2, 0.2),
            vy: Utils.random(-0.3, -0.1),
            size: Utils.random(1, 3),
            life: Utils.random(2, 4),
            maxLife: 4,
            alpha: 1,
            hue: Utils.random(170, 200)
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear
        ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw water gradient
        this.drawWater();
        
        // Draw caustic light patterns
        this.drawCaustics();
        
        // Draw rocks
        this.drawRocks();
        
        // Draw plants
        this.drawPlants();
        
        // Draw particles
        this.drawParticles();
        
        // Draw bubbles
        this.drawBubbles();
        
        // Draw water surface effect
        this.drawSurface();
        
        // Draw vignette
        this.drawVignette();
    }
    
    drawWater() {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        
        // Adjust colors based on clarity
        const clarityMod = this.clarity;
        
        const deep = this.colors.deepWater;
        const mid = this.colors.midWater;
        const shallow = this.colors.shallowWater;
        
        gradient.addColorStop(0, `rgb(${shallow[0] + clarityMod * 5}, ${shallow[1] + clarityMod * 10}, ${shallow[2] + clarityMod * 15})`);
        gradient.addColorStop(0.5, `rgb(${mid[0]}, ${mid[1] + clarityMod * 5}, ${mid[2] + clarityMod * 10})`);
        gradient.addColorStop(1, `rgb(${deep[0]}, ${deep[1]}, ${deep[2]})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawCaustics() {
        const ctx = this.ctx;
        
        this.caustics.forEach(caustic => {
            const pulse = Math.sin(this.time * caustic.speed + caustic.phase);
            const size = caustic.size * (0.8 + pulse * 0.2);
            const alpha = (0.03 + this.clarity * 0.05) * (0.5 + pulse * 0.5);
            
            const gradient = ctx.createRadialGradient(
                caustic.x, caustic.y, 0,
                caustic.x, caustic.y, size
            );
            
            gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(caustic.x, caustic.y, size, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }
    
    drawRocks() {
        const ctx = this.ctx;
        
        const rockColors = [
            [30, 35, 45],
            [40, 45, 55],
            [25, 30, 40]
        ];
        
        this.rocks.forEach(rock => {
            const color = rockColors[rock.color];
            
            // Rock shadow
            ctx.beginPath();
            ctx.ellipse(
                rock.x + 5, rock.y + 5,
                rock.width / 2, rock.height / 3,
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            
            // Rock body
            ctx.beginPath();
            ctx.ellipse(
                rock.x, rock.y,
                rock.width / 2, rock.height / 2,
                0, 0, Math.PI * 2
            );
            
            const gradient = ctx.createRadialGradient(
                rock.x - rock.width / 4, rock.y - rock.height / 4, 0,
                rock.x, rock.y, rock.width / 2
            );
            gradient.addColorStop(0, `rgb(${color[0] + 15}, ${color[1] + 15}, ${color[2] + 15})`);
            gradient.addColorStop(1, `rgb(${color[0]}, ${color[1]}, ${color[2]})`);
            
            ctx.fillStyle = gradient;
            ctx.fill();
        });
    }
    
    drawPlants() {
        const ctx = this.ctx;
        
        this.plants.forEach(plant => {
            const sway = Math.sin(this.time * 0.001 + plant.phase) * 15;
            
            ctx.beginPath();
            
            let x = plant.x;
            let y = plant.baseY;
            
            ctx.moveTo(x, y);
            
            const segmentHeight = plant.height / plant.segments;
            
            for (let i = 1; i <= plant.segments; i++) {
                const progress = i / plant.segments;
                const segmentSway = sway * progress * progress;
                
                x = plant.x + segmentSway;
                y = plant.baseY - segmentHeight * i;
                
                const cpx = plant.x + segmentSway * 0.5;
                const cpy = y + segmentHeight / 2;
                
                ctx.quadraticCurveTo(cpx, cpy, x, y);
            }
            
            // Create gradient for plant
            const gradient = ctx.createLinearGradient(
                plant.x, plant.baseY,
                plant.x, plant.baseY - plant.height
            );
            gradient.addColorStop(0, `hsla(${plant.hue}, 40%, 20%, 0.8)`);
            gradient.addColorStop(1, `hsla(${plant.hue}, 50%, 35%, 0.6)`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = plant.width;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Glow at tip
            ctx.beginPath();
            ctx.arc(x, y, plant.width / 2 + 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${plant.hue}, 60%, 50%, 0.3)`;
            ctx.fill();
        });
    }
    
    drawBubbles() {
        const ctx = this.ctx;
        
        this.bubbles.forEach(bubble => {
            // Bubble body
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 230, 255, ${bubble.alpha * 0.3})`;
            ctx.fill();
            
            // Bubble highlight
            ctx.beginPath();
            ctx.arc(
                bubble.x - bubble.size * 0.3,
                bubble.y - bubble.size * 0.3,
                bubble.size * 0.3,
                0, Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.5})`;
            ctx.fill();
            
            // Bubble outline
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200, 230, 255, ${bubble.alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    
    drawParticles() {
        const ctx = this.ctx;
        
        this.particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${p.alpha * 0.5})`;
            ctx.fill();
        });
    }
    
    drawSurface() {
        const ctx = this.ctx;
        
        // Subtle surface light
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, `rgba(100, 200, 255, ${0.05 + this.clarity * 0.05})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, 100);
        
        // Ripple effect at top
        const rippleY = 5 + Math.sin(this.time * 0.001) * 3;
        ctx.beginPath();
        ctx.moveTo(0, rippleY);
        
        for (let x = 0; x < this.width; x += 20) {
            const y = rippleY + Math.sin(this.time * 0.002 + x * 0.02) * 2;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(this.width, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        
        ctx.fillStyle = `rgba(150, 220, 255, ${0.1 + this.clarity * 0.1})`;
        ctx.fill();
    }
    
    drawVignette() {
        const ctx = this.ctx;
        
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height * 0.3,
            this.width / 2, this.height / 2, this.height * 0.9
        );
        
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, 'rgba(0, 5, 15, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // Create ripple effect at position
    createRipple(x, y, intensity = 1) {
        // Add a caustic at touch point
        this.caustics.push({
            x: x,
            y: y,
            size: 50 * intensity,
            speed: 0.005,
            phase: 0
        });
        
        // Remove old caustics if too many
        if (this.caustics.length > 30) {
            this.caustics.shift();
        }
    }
}

