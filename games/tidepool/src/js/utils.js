/**
 * Tidepool - Utility Functions
 */

const Utils = {
    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    // Distance between two points
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // Angle between two points
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    // Smooth step (ease in-out)
    smoothStep(t) {
        return t * t * (3 - 2 * t);
    },
    
    // Ease out cubic
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    },
    
    // Map value from one range to another
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },
    
    // Format time as M:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // HSL to RGB conversion
    hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    
    // Pick random item from array
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
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
            this.listeners[event].forEach(callback => callback(data));
        }
    },
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
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
        // Hide current screen
        if (this.currentScreen) {
            this.currentScreen.classList.remove('active');
        }
        
        // Wait for transition
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Show new screen
        const screen = this.screens[screenId];
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screen;
        }
        
        return screen;
    }
};

