/**
 * Anchor — Utility Functions
 */

const Utils = {
    // Get element by ID
    $(id) {
        return document.getElementById(id);
    },
    
    // Query selector all
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
    
    // Has class
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },
    
    // Set text content
    setText(element, text) {
        if (element) element.textContent = text;
    },
    
    // Set HTML content
    setHTML(element, html) {
        if (element) element.innerHTML = html;
    },
    
    // Delay promise
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    // Random integer
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    // Clamp value
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Local storage wrapper
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`anchor_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(`anchor_${key}`, JSON.stringify(value));
            } catch {
                console.warn('Could not save to localStorage');
            }
        }
    }
};


