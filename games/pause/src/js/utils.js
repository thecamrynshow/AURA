// ============================================
// Pause — Utility Functions
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
    
    // Format time as m:ss
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Random from array
    randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
};

