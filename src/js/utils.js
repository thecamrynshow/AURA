/**
 * Project AURA - Utility Functions
 */

const Utils = {
    // Lerp (Linear Interpolation)
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Map value from one range to another
    map(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
    },

    // Smooth step for easing
    smoothStep(t) {
        return t * t * (3 - 2 * t);
    },

    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Distance between two points
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // Ease in out quad
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },

    // Format time (seconds to MM:SS)
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Calculate moving average
    movingAverage(arr, windowSize) {
        if (arr.length < windowSize) return arr[arr.length - 1] || 0;
        const window = arr.slice(-windowSize);
        return window.reduce((a, b) => a + b, 0) / windowSize;
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

    // Create gradient color
    gradientColor(t, colors) {
        const idx = t * (colors.length - 1);
        const lower = Math.floor(idx);
        const upper = Math.min(lower + 1, colors.length - 1);
        const blend = idx - lower;
        
        const r = Math.round(Utils.lerp(colors[lower][0], colors[upper][0], blend));
        const g = Math.round(Utils.lerp(colors[lower][1], colors[upper][1], blend));
        const b = Math.round(Utils.lerp(colors[lower][2], colors[upper][2], blend));
        
        return `rgb(${r}, ${g}, ${b})`;
    }
};

// Screen Manager
const ScreenManager = {
    screens: {},
    currentScreen: null,

    init() {
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id] = screen;
        });
    },

    show(screenId, immediate = false) {
        return new Promise(resolve => {
            // Hide current screen
            if (this.currentScreen) {
                this.currentScreen.classList.remove('active');
                this.currentScreen.style.display = 'none';
            }

            // Show new screen
            const newScreen = this.screens[screenId];
            if (newScreen) {
                newScreen.style.display = 'flex';
                newScreen.style.opacity = immediate ? '1' : '0';
                
                // Force reflow
                newScreen.offsetHeight;
                
                newScreen.classList.add('active');
                newScreen.style.opacity = '1';
                
                this.currentScreen = newScreen;
                
                setTimeout(resolve, immediate ? 0 : 800);
            } else {
                resolve();
            }
        });
    }
};

// Event Emitter for game events
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// Global game events
const GameEvents = new EventEmitter();

// Touch/Input handler for joystick
class JoystickController {
    constructor(element) {
        this.base = element;
        this.thumb = element.querySelector('#joystick-thumb');
        this.active = false;
        this.value = { x: 0, y: 0 };
        this.maxDistance = 35;
        
        this.init();
    }

    init() {
        const zone = document.getElementById('joystick-zone');
        
        // Touch events
        zone.addEventListener('touchstart', this.onStart.bind(this), { passive: false });
        zone.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
        zone.addEventListener('touchend', this.onEnd.bind(this));
        zone.addEventListener('touchcancel', this.onEnd.bind(this));
        
        // Mouse events for testing
        zone.addEventListener('mousedown', this.onStart.bind(this));
        document.addEventListener('mousemove', this.onMove.bind(this));
        document.addEventListener('mouseup', this.onEnd.bind(this));
    }

    getPosition(e) {
        const rect = this.base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        return {
            x: clientX - centerX,
            y: clientY - centerY
        };
    }

    onStart(e) {
        e.preventDefault();
        this.active = true;
        this.onMove(e);
    }

    onMove(e) {
        if (!this.active) return;
        e.preventDefault();
        
        const pos = this.getPosition(e);
        const distance = Math.sqrt(pos.x ** 2 + pos.y ** 2);
        
        let x = pos.x;
        let y = pos.y;
        
        if (distance > this.maxDistance) {
            x = (pos.x / distance) * this.maxDistance;
            y = (pos.y / distance) * this.maxDistance;
        }
        
        this.thumb.style.transform = `translate(${x}px, ${y}px)`;
        
        this.value = {
            x: x / this.maxDistance,
            y: y / this.maxDistance
        };
        
        GameEvents.emit('joystick', this.value);
    }

    onEnd() {
        this.active = false;
        this.thumb.style.transform = 'translate(0, 0)';
        this.value = { x: 0, y: 0 };
        GameEvents.emit('joystick', this.value);
    }
}
