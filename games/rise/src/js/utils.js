// ============================================
// Rise — Utility Functions
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
    
    // Update progress bar
    updateProgress(percent) {
        this.$('#progressFill').style.width = `${percent}%`;
    },
    
    // Wait helper
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Set sky state
    setSkyState(state) {
        const bg = this.$('#bgGradient');
        bg.classList.remove('dawn', 'sunrise', 'day');
        if (state) {
            bg.classList.add(state);
        }
    }
};

