/**
 * Reset — Utility Functions
 */

const Utils = {
    // Format time as M:SS
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Ease in-out for smooth animations
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    
    // Linear interpolation
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Shuffle array
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },
    
    // Delay promise
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Get element by ID
    $(id) {
        return document.getElementById(id);
    },
    
    // Query selector
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Add class
    addClass(element, className) {
        if (element) element.classList.add(className);
    },
    
    // Remove class
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },
    
    // Toggle class
    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },
    
    // Check if has class
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },
    
    // Safe local storage
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`reset_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(`reset_${key}`, JSON.stringify(value));
            } catch {
                console.warn('Could not save to localStorage');
            }
        }
    }
};



