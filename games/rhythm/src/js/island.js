/* Rhythm Islands - Island Building System */

class Island {
    constructor(x, y, size = 60) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.targetSize = size;
        this.progress = 0;
        this.complete = false;
        
        // Visual elements
        this.palmTrees = [];
        this.sandColor = `hsl(${Utils.random(35, 45)}, 70%, 75%)`;
        this.waterRipples = [];
        
        // Animation
        this.bobPhase = Utils.random(0, Math.PI * 2);
        this.growthAnimation = 0;
    }

    addProgress(amount) {
        if (this.complete) return false;
        
        this.progress += amount;
        this.targetSize = 60 + (this.progress * 0.5);
        
        // Add palm tree at milestones
        if (this.progress > 30 && this.palmTrees.length === 0) {
            this.addPalmTree();
        }
        if (this.progress > 60 && this.palmTrees.length === 1) {
            this.addPalmTree();
        }
        if (this.progress > 90 && this.palmTrees.length === 2) {
            this.addPalmTree();
        }
        
        if (this.progress >= 100) {
            this.complete = true;
            this.progress = 100;
            return true; // Island complete!
        }
        
        return false;
    }

    addPalmTree() {
        const angle = Utils.random(0, Math.PI * 2);
        const dist = Utils.random(10, this.size * 0.4);
        this.palmTrees.push({
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist - 5,
            height: Utils.random(30, 50),
            sway: Utils.random(0, Math.PI * 2),
            swaySpeed: Utils.random(0.02, 0.04)
        });
    }

    update(deltaTime) {
        // Smooth size transition
        this.size = Utils.lerp(this.size, this.targetSize, 0.1);
        
        // Bob animation
        this.bobPhase += 0.015;
        
        // Growth animation
        if (this.growthAnimation > 0) {
            this.growthAnimation -= deltaTime * 0.003;
        }
        
        // Update palm tree sway
        this.palmTrees.forEach(tree => {
            tree.sway += tree.swaySpeed;
        });
        
        // Update water ripples
        this.waterRipples = this.waterRipples.filter(r => {
            r.radius += deltaTime * 0.03;
            r.alpha -= deltaTime * 0.001;
            return r.alpha > 0;
        });
        
        // Occasional ripple
        if (Math.random() < 0.01) {
            this.waterRipples.push({
                x: Utils.random(-this.size, this.size),
                y: Utils.random(-this.size * 0.3, this.size * 0.3),
                radius: 5,
                alpha: 0.3
            });
        }
    }

    render(ctx) {
        const bob = Math.sin(this.bobPhase) * 3;
        
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        
        // Water ripples
        this.waterRipples.forEach(r => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(r.x, r.y + 10, r.radius, r.radius * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        // Shadow in water
        ctx.fillStyle = 'rgba(0, 50, 80, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 15, this.size * 0.9, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Island base (sand)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.sandColor);
        gradient.addColorStop(0.7, `hsl(35, 60%, 65%)`);
        gradient.addColorStop(1, `hsl(35, 50%, 55%)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Beach edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -2, this.size * 0.95, this.size * 0.45, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        
        // Palm trees
        this.palmTrees.forEach(tree => {
            this.renderPalmTree(ctx, tree);
        });
        
        // Growth pulse effect
        if (this.growthAnimation > 0) {
            ctx.strokeStyle = `rgba(255, 200, 100, ${this.growthAnimation})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size * (1 + this.growthAnimation * 0.3), this.size * 0.5 * (1 + this.growthAnimation * 0.3), 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderPalmTree(ctx, tree) {
        const sway = Math.sin(tree.sway) * 5;
        
        ctx.save();
        ctx.translate(tree.x, tree.y);
        
        // Trunk
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 0.5, -tree.height * 0.5, sway, -tree.height);
        ctx.stroke();
        
        // Fronds
        const frondCount = 6;
        for (let i = 0; i < frondCount; i++) {
            const angle = (i / frondCount) * Math.PI * 2 + tree.sway * 0.3;
            const frondLength = tree.height * 0.6;
            
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sway, -tree.height);
            ctx.quadraticCurveTo(
                sway + Math.cos(angle) * frondLength * 0.5,
                -tree.height + Math.sin(angle) * frondLength * 0.3 - 10,
                sway + Math.cos(angle) * frondLength,
                -tree.height + Math.sin(angle) * frondLength * 0.5
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }

    triggerGrowth() {
        this.growthAnimation = 1;
    }
}

class IslandManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.islands = [];
        this.currentIsland = null;
        this.completedCount = 0;
        
        this.startNewIsland();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    startNewIsland() {
        // Position new island (spread them out)
        let x, y;
        let attempts = 0;
        
        do {
            x = Utils.random(100, this.width - 100);
            y = Utils.random(this.height * 0.3, this.height * 0.6);
            attempts++;
        } while (this.tooCloseToOthers(x, y) && attempts < 20);
        
        this.currentIsland = new Island(x, y);
        this.islands.push(this.currentIsland);
    }

    tooCloseToOthers(x, y) {
        return this.islands.some(island => {
            return Utils.distance(x, y, island.x, island.y) < 150;
        });
    }

    addProgress(amount) {
        if (!this.currentIsland) return { islandComplete: false };
        
        this.currentIsland.triggerGrowth();
        const complete = this.currentIsland.addProgress(amount);
        
        if (complete) {
            this.completedCount++;
            this.startNewIsland();
            return { islandComplete: true, total: this.completedCount };
        }
        
        return { islandComplete: false };
    }

    getCurrentProgress() {
        return this.currentIsland ? this.currentIsland.progress : 0;
    }

    update(deltaTime) {
        this.islands.forEach(island => island.update(deltaTime));
    }

    render(ctx) {
        // Sort by Y for proper layering
        const sorted = [...this.islands].sort((a, b) => a.y - b.y);
        sorted.forEach(island => island.render(ctx));
    }

    getCompletedCount() {
        return this.completedCount;
    }
}

console.log('Island System loaded');


