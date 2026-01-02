/* ============================================
   SONGBIRD — Forest Rendering
   Beautiful forest background
   ============================================ */

class Forest {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        // Trees
        this.trees = [];
        
        // Leaves/particles
        this.leaves = [];
        
        // Colors
        this.skyColors = {
            top: '#87ceeb',
            bottom: '#e0f4ff'
        };
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.generateTrees();
        this.generateLeaves();
    }

    generateTrees() {
        this.trees = [];
        
        // Background trees (far)
        for (let i = 0; i < 8; i++) {
            this.trees.push({
                x: (i / 7) * this.width,
                y: this.height,
                width: randomFloat(80, 120),
                height: randomFloat(200, 300),
                color: '#2d4a2d',
                layer: 0
            });
        }
        
        // Midground trees
        for (let i = 0; i < 6; i++) {
            this.trees.push({
                x: (i / 5) * this.width + randomFloat(-50, 50),
                y: this.height,
                width: randomFloat(100, 150),
                height: randomFloat(250, 400),
                color: '#3d5a3d',
                layer: 1
            });
        }
        
        // Foreground trees (near)
        for (let i = 0; i < 4; i++) {
            this.trees.push({
                x: (i / 3) * this.width + randomFloat(-100, 100),
                y: this.height,
                width: randomFloat(120, 180),
                height: randomFloat(350, 500),
                color: '#1a2e1a',
                layer: 2
            });
        }
        
        // Sort by layer
        this.trees.sort((a, b) => a.layer - b.layer);
    }

    generateLeaves() {
        this.leaves = [];
        
        for (let i = 0; i < 30; i++) {
            this.leaves.push({
                x: randomFloat(0, this.width),
                y: randomFloat(0, this.height),
                size: randomFloat(5, 12),
                speed: randomFloat(0.5, 1.5),
                drift: randomFloat(-0.5, 0.5),
                rotation: randomFloat(0, Math.PI * 2),
                rotationSpeed: randomFloat(-0.05, 0.05),
                color: randomPick(['#7bc950', '#5da947', '#8bc34a', '#9ccc65'])
            });
        }
    }

    update() {
        // Update leaves
        this.leaves.forEach(leaf => {
            leaf.y += leaf.speed;
            leaf.x += leaf.drift + Math.sin(leaf.y * 0.02) * 0.5;
            leaf.rotation += leaf.rotationSpeed;
            
            // Reset if off screen
            if (leaf.y > this.height + 20) {
                leaf.y = -20;
                leaf.x = randomFloat(0, this.width);
            }
            if (leaf.x < -20) leaf.x = this.width + 20;
            if (leaf.x > this.width + 20) leaf.x = -20;
        });
    }

    draw() {
        // Sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, this.skyColors.top);
        skyGradient.addColorStop(0.6, this.skyColors.bottom);
        skyGradient.addColorStop(1, '#4a7a4a');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Sun
        this.drawSun();
        
        // Trees
        this.trees.forEach(tree => this.drawTree(tree));
        
        // Ground
        this.drawGround();
        
        // Floating leaves
        this.leaves.forEach(leaf => this.drawLeaf(leaf));
    }

    drawSun() {
        const x = this.width * 0.8;
        const y = this.height * 0.15;
        const radius = 60;
        
        // Glow
        const glow = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        glow.addColorStop(0, 'rgba(255, 236, 179, 0.8)');
        glow.addColorStop(0.5, 'rgba(255, 236, 179, 0.3)');
        glow.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sun
        this.ctx.fillStyle = '#fff9c4';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTree(tree) {
        const { x, y, width, height, color } = tree;
        
        this.ctx.fillStyle = color;
        
        // Trunk
        const trunkWidth = width * 0.15;
        const trunkHeight = height * 0.3;
        this.ctx.fillStyle = '#4a3c2a';
        this.ctx.fillRect(x - trunkWidth / 2, y - trunkHeight, trunkWidth, trunkHeight);
        
        // Foliage (layered triangles)
        this.ctx.fillStyle = color;
        
        // Bottom layer
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - trunkHeight - height * 0.7);
        this.ctx.lineTo(x - width * 0.6, y - trunkHeight);
        this.ctx.lineTo(x + width * 0.6, y - trunkHeight);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Middle layer
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - trunkHeight - height * 0.85);
        this.ctx.lineTo(x - width * 0.5, y - trunkHeight - height * 0.3);
        this.ctx.lineTo(x + width * 0.5, y - trunkHeight - height * 0.3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Top layer
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - trunkHeight - height);
        this.ctx.lineTo(x - width * 0.35, y - trunkHeight - height * 0.55);
        this.ctx.lineTo(x + width * 0.35, y - trunkHeight - height * 0.55);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawGround() {
        // Grass
        this.ctx.fillStyle = '#3d6a3d';
        this.ctx.fillRect(0, this.height - 50, this.width, 50);
        
        // Grass tufts
        for (let x = 0; x < this.width; x += 15) {
            const h = randomFloat(10, 25);
            this.ctx.fillStyle = randomPick(['#4a7a4a', '#5a8a5a', '#3d6a3d']);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.height - 50);
            this.ctx.quadraticCurveTo(x - 5, this.height - 50 - h, x, this.height - 50 - h);
            this.ctx.quadraticCurveTo(x + 5, this.height - 50 - h, x, this.height - 50);
            this.ctx.fill();
        }
    }

    drawLeaf(leaf) {
        this.ctx.save();
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.rotation);
        
        this.ctx.fillStyle = leaf.color;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
}

console.log('Songbird Forest loaded');


