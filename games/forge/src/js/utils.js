// ============================================
// Forge — Utility Functions
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
    
    // Random from array
    randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    
    // Create ember particle
    createEmber() {
        const container = this.$('#emberContainer');
        const ember = document.createElement('div');
        ember.className = 'ember';
        ember.style.left = `${Math.random() * 100}%`;
        ember.style.bottom = '0';
        ember.style.animationDuration = `${2 + Math.random() * 2}s`;
        container.appendChild(ember);
        
        setTimeout(() => {
            ember.remove();
        }, 4000);
    },
    
    // Start ember generation
    startEmbers() {
        this.emberInterval = setInterval(() => {
            this.createEmber();
        }, 300);
    },
    
    stopEmbers() {
        if (this.emberInterval) {
            clearInterval(this.emberInterval);
        }
    }
};



