/**
 * Anchor — Visual System
 * Bubbles, depth indicators, rising effect
 */

class VisualSystem {
    constructor() {
        this.bubblesContainer = null;
        this.bubbles = [];
        this.bubbleInterval = null;
    }
    
    init() {
        this.bubblesContainer = Utils.$('bubbles');
        this.startBubbles();
    }
    
    startBubbles() {
        // Create initial bubbles
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.createBubble(), i * 500);
        }
        
        // Create new bubbles periodically
        this.bubbleInterval = setInterval(() => {
            if (this.bubbles.length < 15) {
                this.createBubble();
            }
        }, 2000);
    }
    
    createBubble() {
        if (!this.bubblesContainer) return;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // Random size
        const size = Utils.random(5, 20);
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        // Random position
        bubble.style.left = `${Utils.random(5, 95)}%`;
        bubble.style.bottom = '-30px';
        
        // Random animation timing
        const duration = Utils.random(6, 12);
        bubble.style.setProperty('--rise-duration', `${duration}s`);
        bubble.style.setProperty('--rise-delay', `${Utils.random(0, 2)}s`);
        
        this.bubblesContainer.appendChild(bubble);
        this.bubbles.push(bubble);
        
        // Remove after animation
        setTimeout(() => {
            bubble.remove();
            this.bubbles = this.bubbles.filter(b => b !== bubble);
        }, (duration + 2) * 1000);
    }
    
    // Create burst of bubbles (when acknowledging item)
    createBubbleBurst(x, y) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                
                const size = Utils.random(3, 10);
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${x + Utils.random(-20, 20)}px`;
                bubble.style.top = `${y}px`;
                bubble.style.bottom = 'auto';
                bubble.style.setProperty('--rise-duration', `${Utils.random(2, 4)}s`);
                
                this.bubblesContainer.appendChild(bubble);
                
                setTimeout(() => bubble.remove(), 4000);
            }, i * 50);
        }
    }
    
    // Update depth level (0-5, 5 being surface)
    setDepthLevel(level) {
        const container = Utils.$('gameContainer');
        
        // Remove all depth classes
        for (let i = 1; i <= 5; i++) {
            Utils.removeClass(container, `depth-${i}`);
        }
        
        // Add current depth
        if (level > 0 && level <= 5) {
            Utils.addClass(container, `depth-${level}`);
        }
    }
    
    // Update depth indicator
    updateDepthIndicator(progress) {
        const fill = Utils.$('depthFill');
        const anchor = Utils.$('anchorIcon');
        
        if (fill) {
            fill.style.height = `${progress * 100}%`;
        }
        
        if (anchor) {
            anchor.style.bottom = `${progress * 100}%`;
        }
    }
    
    showDepthIndicator() {
        Utils.addClass(Utils.$('depthIndicator'), 'visible');
    }
    
    hideDepthIndicator() {
        Utils.removeClass(Utils.$('depthIndicator'), 'visible');
    }
    
    stopBubbles() {
        if (this.bubbleInterval) {
            clearInterval(this.bubbleInterval);
        }
    }
}

const Visuals = new VisualSystem();



