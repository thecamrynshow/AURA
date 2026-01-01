/**
 * Focus — Utility Functions
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
    
    setText(element, text) {
        if (element) element.textContent = text;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

