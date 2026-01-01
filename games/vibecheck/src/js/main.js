// ============================================
// Vibe Check — Main Game Logic
// ============================================

class VibeCheckGame {
    constructor() {
        this.selectedVibe = null;
        this.vibeColor = null;
        this.intensity = 50;
        this.bodyArea = null;
        this.breathCount = 0;
        this.isBreathing = false;
        this.currentReframe = null;
        this.usedReframes = [];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initIntensitySlider();
    }
    
    bindEvents() {
        // Start button
        Utils.$('#startBtn').addEventListener('click', () => {
            AudioSystem.init();
            AudioSystem.playTap();
            this.showVibeScreen();
        });
        
        // Vibe selection
        Utils.$$('.vibe-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectVibe(btn);
            });
        });
        
        // Intensity continue
        Utils.$('#intensityContinue').addEventListener('click', () => {
            AudioSystem.playTap();
            this.showBodyScreen();
        });
        
        // Body points
        Utils.$$('.body-point').forEach(point => {
            point.addEventListener('click', () => {
                this.selectBodyArea(point);
            });
        });
        
        // Body continue
        Utils.$('#bodyContinue').addEventListener('click', () => {
            AudioSystem.playTap();
            this.showProcessScreen();
        });
        
        // Process visual (breathing)
        Utils.$('.process-visual').addEventListener('click', () => {
            if (!this.isBreathing) {
                this.startBreathing();
            }
        });
        
        // Reframe actions
        Utils.$('#anotherReframe').addEventListener('click', () => {
            this.getNewReframe();
        });
        
        Utils.$('#keepReframe').addEventListener('click', () => {
            AudioSystem.playSuccess();
            this.showCompleteScreen();
        });
        
        // Complete actions
        Utils.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../../platform/games/';
        });
        
        Utils.$('#journalBtn').addEventListener('click', () => {
            Utils.$('#journalModal').classList.add('active');
        });
        
        Utils.$('#saveJournal').addEventListener('click', () => {
            Utils.$('#journalModal').classList.remove('active');
            // Could save to localStorage here
        });
    }
    
    initIntensitySlider() {
        const track = Utils.$('#intensityTrack');
        const handle = Utils.$('#intensityHandle');
        const fill = Utils.$('#intensityFill');
        const valueDisplay = Utils.$('#intensityValue');
        
        let isDragging = false;
        
        const updateSlider = (clientX) => {
            const rect = track.getBoundingClientRect();
            let percentage = ((clientX - rect.left) / rect.width) * 100;
            percentage = Math.max(0, Math.min(100, percentage));
            
            this.intensity = Math.round(percentage);
            handle.style.left = `${percentage}%`;
            fill.style.width = `${percentage}%`;
            valueDisplay.textContent = `${this.intensity}%`;
        };
        
        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateSlider(e.clientX);
        });
        
        track.addEventListener('touchstart', (e) => {
            isDragging = true;
            updateSlider(e.touches[0].clientX);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) updateSlider(e.clientX);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) updateSlider(e.touches[0].clientX);
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
    
    showVibeScreen() {
        Utils.updateProgress(1);
        Utils.showScreen('vibeScreen');
    }
    
    selectVibe(btn) {
        Utils.$$('.vibe-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.selectedVibe = btn.dataset.vibe;
        this.vibeColor = btn.dataset.color;
        
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showIntensityScreen();
        }, 300);
    }
    
    showIntensityScreen() {
        Utils.updateProgress(2);
        
        // Update selected emoji
        Utils.$('.selected-emoji').textContent = Content.getEmoji(this.selectedVibe);
        
        Utils.showScreen('intensityScreen');
    }
    
    showBodyScreen() {
        Utils.updateProgress(3);
        
        // Reset body selections
        Utils.$$('.body-point').forEach(p => p.classList.remove('selected'));
        Utils.$('#bodyContinue').disabled = true;
        
        Utils.showScreen('bodyScreen');
    }
    
    selectBodyArea(point) {
        Utils.$$('.body-point').forEach(p => p.classList.remove('selected'));
        point.classList.add('selected');
        
        this.bodyArea = point.dataset.area;
        Utils.$('#bodyContinue').disabled = false;
        
        AudioSystem.playTap();
    }
    
    showProcessScreen() {
        Utils.updateProgress(4);
        
        // Set the emoji in the orb
        Utils.$('#orbEmoji').textContent = Content.getEmoji(this.selectedVibe);
        
        // Reset breath state
        this.breathCount = 0;
        Utils.$('#processBreathCount').textContent = '0';
        Utils.$('#breathInstruction').textContent = 'tap to breathe with it';
        Utils.$('.process-visual').classList.remove('breathing', 'inhale', 'exhale');
        
        Utils.showScreen('processScreen');
    }
    
    async startBreathing() {
        if (this.isBreathing) return;
        this.isBreathing = true;
        
        const visual = Utils.$('.process-visual');
        const instruction = Utils.$('#breathInstruction');
        
        visual.classList.add('breathing');
        
        for (let i = 0; i < 3; i++) {
            // Inhale
            instruction.textContent = 'breathe in...';
            visual.classList.add('inhale');
            visual.classList.remove('exhale');
            AudioSystem.playBreathIn();
            await Utils.wait(4000);
            
            // Exhale
            instruction.textContent = 'breathe out...';
            visual.classList.add('exhale');
            visual.classList.remove('inhale');
            AudioSystem.playBreathOut();
            await Utils.wait(4000);
            
            this.breathCount++;
            Utils.$('#processBreathCount').textContent = this.breathCount;
        }
        
        instruction.textContent = 'complete ✓';
        visual.classList.remove('inhale', 'exhale');
        AudioSystem.playSuccess();
        
        setTimeout(() => {
            this.showReframeScreen();
        }, 1000);
    }
    
    showReframeScreen() {
        Utils.updateProgress(5);
        
        this.usedReframes = [];
        this.getNewReframe();
        
        Utils.showScreen('reframeScreen');
    }
    
    getNewReframe() {
        const allReframes = Content.getReframes(this.selectedVibe);
        const available = allReframes.filter(r => !this.usedReframes.includes(r));
        
        if (available.length === 0) {
            // Reset if all used
            this.usedReframes = [];
            this.currentReframe = Utils.randomFrom(allReframes);
        } else {
            this.currentReframe = Utils.randomFrom(available);
        }
        
        this.usedReframes.push(this.currentReframe);
        Utils.$('#reframeText').textContent = this.currentReframe;
        
        // Animate card
        const card = Utils.$('#reframeCard');
        card.style.opacity = '0';
        card.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
        
        AudioSystem.playTap();
    }
    
    showCompleteScreen() {
        // Populate summary
        Utils.$('#summaryFeeling').textContent = `${Content.getEmoji(this.selectedVibe)} ${this.selectedVibe}`;
        Utils.$('#summaryIntensity').textContent = `${this.intensity}%`;
        Utils.$('#summaryBody').textContent = this.bodyArea;
        
        Utils.showScreen('completeScreen');
    }
    
    restart() {
        this.selectedVibe = null;
        this.vibeColor = null;
        this.intensity = 50;
        this.bodyArea = null;
        this.breathCount = 0;
        this.isBreathing = false;
        this.currentReframe = null;
        this.usedReframes = [];
        
        // Reset UI
        Utils.$$('.vibe-btn').forEach(b => b.classList.remove('selected'));
        Utils.$('#intensityHandle').style.left = '50%';
        Utils.$('#intensityFill').style.width = '50%';
        Utils.$('#intensityValue').textContent = '50%';
        Utils.$$('.body-point').forEach(p => p.classList.remove('selected'));
        Utils.$('#bodyContinue').disabled = true;
        Utils.$('#journalText').value = '';
        
        Utils.updateProgress(0);
        Utils.showScreen('titleScreen');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new VibeCheckGame();
});

