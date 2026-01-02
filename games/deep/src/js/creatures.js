/* ============================================
   THE DEEP — Sea Creatures
   Creatures that appear at different depths
   ============================================ */

// Creature definitions by depth zone
const CREATURES = {
    surface: [
        {
            id: 'sunfish',
            name: 'Ocean Sunfish',
            emoji: '🐟',
            desc: 'Basking in the warm surface waters',
            depthRange: [0, 80],
            size: 40,
            speed: 0.5,
            glow: false
        },
        {
            id: 'seagull_shadow',
            name: 'Seagull Shadow',
            emoji: '🕊️',
            desc: 'A shadow passes overhead',
            depthRange: [0, 30],
            size: 30,
            speed: 2,
            glow: false
        }
    ],
    twilight: [
        {
            id: 'jellyfish',
            name: 'Moon Jellyfish',
            emoji: '🪼',
            desc: 'Graceful drifters of the twilight',
            depthRange: [100, 300],
            size: 35,
            speed: 0.3,
            glow: true,
            glowColor: '#87CEEB'
        },
        {
            id: 'squid',
            name: 'Glass Squid',
            emoji: '🦑',
            desc: 'Almost invisible in the dim light',
            depthRange: [200, 500],
            size: 30,
            speed: 1.2,
            glow: true,
            glowColor: '#E6E6FA'
        },
        {
            id: 'lanternfish',
            name: 'Lanternfish',
            emoji: '🐠',
            desc: 'Tiny lights in the darkness',
            depthRange: [300, 500],
            size: 15,
            speed: 0.8,
            glow: true,
            glowColor: '#00FFFF',
            schoolSize: 5
        }
    ],
    midnight: [
        {
            id: 'anglerfish',
            name: 'Anglerfish',
            emoji: '🐡',
            desc: 'A light in the void... beware',
            depthRange: [500, 800],
            size: 35,
            speed: 0.4,
            glow: true,
            glowColor: '#FFD700'
        },
        {
            id: 'giantisopod',
            name: 'Giant Isopod',
            emoji: '🦐',
            desc: 'Ancient survivor of the deep',
            depthRange: [600, 900],
            size: 25,
            speed: 0.2,
            glow: false
        },
        {
            id: 'siphonophore',
            name: 'Siphonophore',
            emoji: '✨',
            desc: 'A chain of living lights',
            depthRange: [700, 1000],
            size: 60,
            speed: 0.1,
            glow: true,
            glowColor: '#FF69B4'
        }
    ],
    abyss: [
        {
            id: 'giantsquid',
            name: 'Giant Squid',
            emoji: '🦑',
            desc: 'The legendary kraken',
            depthRange: [1000, 1500],
            size: 80,
            speed: 0.6,
            glow: true,
            glowColor: '#9370DB'
        },
        {
            id: 'dumbo',
            name: 'Dumbo Octopus',
            emoji: '🐙',
            desc: 'Floating gracefully in eternal darkness',
            depthRange: [1200, 1800],
            size: 30,
            speed: 0.3,
            glow: true,
            glowColor: '#FF6B6B'
        },
        {
            id: 'blobfish',
            name: 'Blobfish',
            emoji: '🫧',
            desc: 'Perfectly adapted to crushing pressure',
            depthRange: [1500, 1900],
            size: 25,
            speed: 0.1,
            glow: false
        },
        {
            id: 'ancient',
            name: 'The Ancient One',
            emoji: '👁️',
            desc: 'Something watches from the deepest dark',
            depthRange: [1900, 2000],
            size: 150,
            speed: 0.05,
            glow: true,
            glowColor: '#4B0082',
            unique: true
        }
    ]
};

// Get all creatures as flat array
function getAllCreatures() {
    return Object.values(CREATURES).flat();
}

// Get creatures available at a specific depth
function getCreaturesAtDepth(depth) {
    const all = getAllCreatures();
    return all.filter(c => depth >= c.depthRange[0] && depth <= c.depthRange[1]);
}

// Creature class for rendering
class Creature {
    constructor(data, canvasWidth, canvasHeight, depth) {
        this.data = data;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Position
        this.x = Math.random() < 0.5 ? -50 : canvasWidth + 50;
        this.y = randomFloat(canvasHeight * 0.2, canvasHeight * 0.8);
        this.direction = this.x < 0 ? 1 : -1;
        
        // Movement
        this.speed = data.speed * randomFloat(0.8, 1.2);
        this.wobble = 0;
        this.wobbleSpeed = randomFloat(0.02, 0.05);
        this.wobbleAmount = randomFloat(10, 30);
        
        // State
        this.discovered = false;
        this.opacity = 0;
        this.fadeIn = true;
        
        // For schools
        if (data.schoolSize) {
            this.schoolmates = [];
            for (let i = 1; i < data.schoolSize; i++) {
                this.schoolmates.push({
                    offsetX: randomFloat(-40, 40),
                    offsetY: randomFloat(-30, 30),
                    wobbleOffset: randomFloat(0, Math.PI * 2)
                });
            }
        }
    }

    update(deltaTime) {
        // Move
        this.x += this.direction * this.speed * deltaTime * 60;
        
        // Wobble
        this.wobble += this.wobbleSpeed;
        const wobbleY = Math.sin(this.wobble) * this.wobbleAmount;
        
        // Fade in
        if (this.fadeIn && this.opacity < 1) {
            this.opacity = Math.min(1, this.opacity + 0.02);
        }
        
        // Check if off screen
        if ((this.direction > 0 && this.x > this.canvasWidth + 100) ||
            (this.direction < 0 && this.x < -100)) {
            return false; // Remove creature
        }
        
        return true; // Keep creature
    }

    draw(ctx) {
        ctx.save();
        
        const wobbleY = Math.sin(this.wobble) * this.wobbleAmount;
        const drawX = this.x;
        const drawY = this.y + wobbleY;
        
        ctx.globalAlpha = this.opacity;
        
        // Draw glow
        if (this.data.glow) {
            const gradient = ctx.createRadialGradient(
                drawX, drawY, 0,
                drawX, drawY, this.data.size * 2
            );
            gradient.addColorStop(0, this.data.glowColor + '60');
            gradient.addColorStop(0.5, this.data.glowColor + '20');
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drawX, drawY, this.data.size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw emoji
        ctx.font = `${this.data.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Flip if moving left
        if (this.direction < 0) {
            ctx.save();
            ctx.translate(drawX, drawY);
            ctx.scale(-1, 1);
            ctx.fillText(this.data.emoji, 0, 0);
            ctx.restore();
        } else {
            ctx.fillText(this.data.emoji, drawX, drawY);
        }
        
        // Draw schoolmates
        if (this.schoolmates) {
            this.schoolmates.forEach(mate => {
                const mateX = drawX + mate.offsetX;
                const mateY = drawY + mate.offsetY + Math.sin(this.wobble + mate.wobbleOffset) * 10;
                
                if (this.direction < 0) {
                    ctx.save();
                    ctx.translate(mateX, mateY);
                    ctx.scale(-1, 1);
                    ctx.fillText(this.data.emoji, 0, 0);
                    ctx.restore();
                } else {
                    ctx.fillText(this.data.emoji, mateX, mateY);
                }
            });
        }
        
        ctx.restore();
    }

    // Check if near player for discovery
    isNearPlayer(playerX, playerY, threshold = 100) {
        const wobbleY = Math.sin(this.wobble) * this.wobbleAmount;
        const dx = this.x - playerX;
        const dy = (this.y + wobbleY) - playerY;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    }
}

console.log('The Deep Creatures loaded');


