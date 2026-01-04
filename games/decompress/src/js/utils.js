// ============================================
// Decompress — Utility Functions
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
    
    // Set sun position
    setSunPosition(state) {
        const sun = this.$('#sun');
        sun.classList.remove('setting', 'set');
        if (state) {
            sun.classList.add(state);
        }
    }
};



