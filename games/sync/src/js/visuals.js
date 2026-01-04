/**
 * Sync — Visual System
 * Particles, connection effects
 */

class VisualSystem {
    constructor() {
        this.particlesContainer = null;
        this.particles = [];
    }
    
    init() {
        this.particlesContainer = Utils.$('particles');
        this.createParticles();
    }
    
    createParticles() {
        if (!this.particlesContainer) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            particle.style.left = `${Utils.random(10, 90)}%`;
            particle.style.bottom = `${Utils.random(0, 30)}%`;
            particle.style.setProperty('--duration', `${Utils.random(10, 20)}s`);
            particle.style.setProperty('--delay', `${Utils.random(0, 10)}s`);
            
            this.particlesContainer.appendChild(particle);
            this.particles.push(particle);
        }
    }
    
    // Create burst of particles between orbs when synced
    createSyncBurst() {
        if (!this.particlesContainer) return;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle sync-burst';
            
            particle.style.left = '50%';
            particle.style.top = '50%';
            particle.style.background = '#a8e6cf';
            particle.style.opacity = '1';
            particle.style.animation = `burst-out 1s ease-out forwards`;
            particle.style.setProperty('--angle', `${(i / 10) * 360}deg`);
            
            this.particlesContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    // Update connection line based on sync state
    updateConnectionLine(syncLevel) {
        const line = Utils.$('connectionLine');
        const indicator = Utils.$('syncIndicator');
        
        if (syncLevel > 0.8) {
            Utils.addClass(line, 'synced');
            Utils.setText(indicator.querySelector('.sync-text'), 'In Sync ♥');
        } else if (syncLevel > 0.5) {
            Utils.removeClass(line, 'synced');
            Utils.setText(indicator.querySelector('.sync-text'), 'Almost...');
            indicator.querySelector('.sync-text').style.opacity = '0.7';
        } else {
            Utils.removeClass(line, 'synced');
            Utils.setText(indicator.querySelector('.sync-text'), 'Syncing...');
            indicator.querySelector('.sync-text').style.opacity = '0.5';
        }
    }
    
    // Show touch prompt
    showTouchPrompt(text) {
        const prompt = Utils.$('touchPrompt');
        const promptText = Utils.$('promptText');
        
        Utils.setText(promptText, text);
        Utils.addClass(prompt, 'visible');
        
        setTimeout(() => {
            Utils.removeClass(prompt, 'visible');
        }, 8000);
    }
}

const Visuals = new VisualSystem();

// Add burst animation
const style = document.createElement('style');
style.textContent = `
    @keyframes burst-out {
        0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateX(100px) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);



