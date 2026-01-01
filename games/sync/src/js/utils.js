/**
 * Sync — Utility Functions
 */

const Utils = {
    $(id) {
        return document.getElementById(id);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    addClass(element, className) {
        if (element) element.classList.add(className);
    },
    
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },
    
    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },
    
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    },
    
    setText(element, text) {
        if (element) element.textContent = text;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    storage: {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(`sync_${key}`);
                return item ? JSON.parse(item) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(`sync_${key}`, JSON.stringify(value));
            } catch {
                console.warn('Could not save to localStorage');
            }
        }
    }
};

