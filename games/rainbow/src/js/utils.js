/**
 * Rainbow Painter - Utilities
 */

const Utils = {
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    smoothStep(t) {
        return t * t * (3 - 2 * t);
    },
    
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : 
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    
    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
};

// Screen manager
const ScreenManager = {
    screens: {},
    currentScreen: null,
    
    init() {
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id] = screen;
        });
    },
    
    async show(screenId) {
        // Hide current
        if (this.currentScreen) {
            this.currentScreen.classList.remove('active');
        }
        
        // Show new
        await new Promise(resolve => setTimeout(resolve, 100));
        const screen = this.screens[screenId];
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screen;
        }
    }
};

// Simple event system
const GameEvents = {
    listeners: {},
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    },
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
};

