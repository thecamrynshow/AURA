// ============================================
// Vibe Check — Utility Functions
// ============================================

const Utils = {
    // DOM helpers
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Show/hide screens
    showScreen(screenId) {
        this.$$('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        this.$(`#${screenId}`).classList.add('active');
    },
    
    // Update progress dots
    updateProgress(step) {
        const dots = this.$$('.progress-dots .dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'complete');
            if (i < step) {
                dot.classList.add('complete');
            } else if (i === step) {
                dot.classList.add('active');
            }
        });
    },
    
    // Wait helper
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Random from array
    randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    // Shuffle array
    shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};

