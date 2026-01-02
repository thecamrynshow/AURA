/**
 * Drift — Visual System
 * Stars, moon, progressive dimming
 */

class VisualSystem {
    constructor() {
        this.starsContainer = null;
        this.stars = [];
        this.moonElement = null;
    }
    
    init() {
        this.starsContainer = Utils.$('stars');
        this.moonElement = Utils.$('moon');
        this.createStars();
    }
    
    createStars() {
        if (!this.starsContainer) return;
        
        // Clear existing
        this.starsContainer.innerHTML = '';
        this.stars = [];
        
        // Create random stars
        const count = 80;
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random position
            star.style.left = `${Utils.random(5, 95)}%`;
            star.style.top = `${Utils.random(5, 70)}%`;
            
            // Random size
            const size = Utils.random(1, 3);
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // Random twinkle timing
            star.style.setProperty('--twinkle-duration', `${Utils.random(2, 6)}s`);
            star.style.setProperty('--twinkle-delay', `${Utils.random(0, 5)}s`);
            
            this.starsContainer.appendChild(star);
            this.stars.push(star);
        }
    }
    
    // Animate moon rising/setting
    animateMoon(progress) {
        if (!this.moonElement) return;
        
        // Moon slowly descends as session progresses
        const startTop = 15;
        const endTop = 40;
        const top = Utils.lerp(startTop, endTop, progress);
        
        // Moon also slowly fades
        const opacity = Utils.lerp(1, 0.3, progress);
        
        this.moonElement.style.top = `${top}%`;
        this.moonElement.style.opacity = opacity;
    }
    
    // Reduce star brightness
    dimStars(intensity) {
        this.stars.forEach(star => {
            star.style.opacity = 1 - intensity * 0.7;
        });
    }
    
    // Set dimming phase
    setDimPhase(phase) {
        const container = Utils.$('gameContainer');
        
        // Remove all phase classes
        for (let i = 1; i <= 5; i++) {
            Utils.removeClass(container, `phase-${i}`);
        }
        Utils.removeClass(container, 'phase-final');
        
        // Add current phase
        if (phase === 'final') {
            Utils.addClass(container, 'phase-final');
        } else if (phase > 0) {
            Utils.addClass(container, `phase-${phase}`);
        }
    }
    
    // Calculate dim phase based on progress (0-1)
    getDimPhase(progress) {
        if (progress < 0.15) return 0;
        if (progress < 0.30) return 1;
        if (progress < 0.50) return 2;
        if (progress < 0.70) return 3;
        if (progress < 0.85) return 4;
        if (progress < 0.95) return 5;
        return 'final';
    }
    
    // Hide cursor after inactivity
    setupCursorHide() {
        let timeout;
        const container = Utils.$('gameContainer');
        
        const hideCursor = () => {
            Utils.addClass(container, 'hide-cursor');
        };
        
        const showCursor = () => {
            Utils.removeClass(container, 'hide-cursor');
            clearTimeout(timeout);
            timeout = setTimeout(hideCursor, 3000);
        };
        
        document.addEventListener('mousemove', showCursor);
        document.addEventListener('touchstart', showCursor);
        
        // Start hidden
        timeout = setTimeout(hideCursor, 3000);
    }
}

const Visuals = new VisualSystem();


