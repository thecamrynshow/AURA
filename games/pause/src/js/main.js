// ============================================
// Pause — Main Game Logic
// ============================================

class PauseGame {
    constructor() {
        this.startTime = null;
        this.scrollTime = null;
        this.currentStep = 0;
        
        // Look prompts
        this.lookPrompts = [
            "find something blue near you",
            "notice something green",
            "find the nearest window or light"
        ];
        this.currentLook = 0;
        
        // Body checks
        this.bodyChecks = 0;
        this.totalBodyChecks = 3;
        
        // Breath
        this.breathCount = 0;
        this.isBreathing = false;
        this.breathCycle = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Start button
        Utils.$('#startBtn').addEventListener('click', () => {
            AudioSystem.init();
            AudioSystem.playTap();
            this.startTime = Date.now();
            this.showAwarenessScreen();
        });
        
        // Time selection
        Utils.$$('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTime(btn);
            });
        });
        
        // Put down continue
        Utils.$('#putdownContinue').addEventListener('click', () => {
            AudioSystem.playTap();
            this.showEyesScreen();
        });
        
        // Found it button
        Utils.$('#foundIt').addEventListener('click', () => {
            this.foundLookItem();
        });
        
        // Body check items
        Utils.$$('.check-item').forEach(item => {
            item.addEventListener('click', () => {
                this.checkBodyPart(item);
            });
        });
        
        // Breath circle
        Utils.$('#breathCircle').addEventListener('click', () => {
            if (!this.isBreathing) {
                this.startBreathing();
            }
        });
        
        // Intention selection
        Utils.$$('.intention-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectIntention(btn);
            });
        });
        
        // Complete actions
        Utils.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../../platform/games/';
        });
        Utils.$('#againBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    showAwarenessScreen() {
        this.currentStep = 1;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('awarenessScreen');
    }
    
    selectTime(btn) {
        Utils.$$('.time-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.scrollTime = btn.dataset.time;
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showPutdownScreen();
        }, 500);
    }
    
    showPutdownScreen() {
        this.currentStep = 2;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('putdownScreen');
        
        // Animate phone flip
        setTimeout(() => {
            Utils.$('#phoneIcon').classList.add('flipped');
        }, 1000);
    }
    
    showEyesScreen() {
        this.currentStep = 3;
        Utils.updateProgress(this.currentStep);
        
        this.currentLook = 0;
        this.updateLookPrompt();
        this.updateLookDots();
        
        Utils.showScreen('eyesScreen');
    }
    
    updateLookPrompt() {
        Utils.$('#lookPrompt').textContent = this.lookPrompts[this.currentLook];
    }
    
    updateLookDots() {
        const dots = Utils.$$('.look-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'complete');
            if (i < this.currentLook) {
                dot.classList.add('complete');
            } else if (i === this.currentLook) {
                dot.classList.add('active');
            }
        });
    }
    
    foundLookItem() {
        AudioSystem.playTap();
        this.currentLook++;
        
        if (this.currentLook >= this.lookPrompts.length) {
            AudioSystem.playChime();
            setTimeout(() => {
                this.showBodyScreen();
            }, 500);
        } else {
            this.updateLookPrompt();
            this.updateLookDots();
        }
    }
    
    showBodyScreen() {
        this.currentStep = 3;
        this.bodyChecks = 0;
        Utils.showScreen('bodyScreen');
    }
    
    checkBodyPart(item) {
        if (item.classList.contains('checked')) return;
        
        item.classList.add('checked');
        AudioSystem.playTap();
        
        // Find corresponding point
        const part = item.dataset.part;
        const point = Utils.$(`.check-point.${part}`);
        if (point) {
            point.classList.add('checked');
        }
        
        this.bodyChecks++;
        
        if (this.bodyChecks >= this.totalBodyChecks) {
            Utils.$('#bodyPrompt').textContent = 'noticed ✓';
            AudioSystem.playChime();
            
            setTimeout(() => {
                this.showBreathScreen();
            }, 1000);
        }
    }
    
    showBreathScreen() {
        this.currentStep = 4;
        Utils.updateProgress(this.currentStep);
        
        this.breathCount = 0;
        Utils.$('#breathCount').textContent = '0';
        Utils.$('#breathInstruction').textContent = 'tap to start';
        Utils.$('#breathCircle').classList.remove('breathing', 'inhale', 'exhale');
        
        Utils.showScreen('breathScreen');
    }
    
    async startBreathing() {
        if (this.isBreathing) return;
        this.isBreathing = true;
        
        const circle = Utils.$('#breathCircle');
        const instruction = Utils.$('#breathInstruction');
        
        circle.classList.add('breathing');
        
        for (let i = 0; i < 3; i++) {
            // Inhale
            instruction.textContent = 'breathe in';
            circle.classList.add('inhale');
            circle.classList.remove('exhale');
            AudioSystem.playBreathIn();
            await Utils.wait(4000);
            
            // Exhale
            instruction.textContent = 'breathe out';
            circle.classList.add('exhale');
            circle.classList.remove('inhale');
            AudioSystem.playBreathOut();
            await Utils.wait(4000);
            
            this.breathCount++;
            Utils.$('#breathCount').textContent = this.breathCount;
        }
        
        instruction.textContent = 'complete ✓';
        circle.classList.remove('inhale', 'exhale');
        AudioSystem.playChime();
        
        setTimeout(() => {
            this.showIntentionScreen();
        }, 1000);
    }
    
    showIntentionScreen() {
        this.currentStep = 5;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('intentionScreen');
    }
    
    selectIntention(btn) {
        Utils.$$('.intention-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showCompleteScreen();
        }, 500);
    }
    
    showCompleteScreen() {
        Utils.showScreen('completeScreen');
        
        // Calculate time
        const elapsed = Math.round((Date.now() - this.startTime) / 1000);
        Utils.$('#pauseTime').textContent = Utils.formatTime(elapsed);
        
        AudioSystem.playChime();
    }
    
    restart() {
        this.startTime = null;
        this.scrollTime = null;
        this.currentStep = 0;
        this.currentLook = 0;
        this.bodyChecks = 0;
        this.breathCount = 0;
        this.isBreathing = false;
        
        // Reset UI
        Utils.$$('.time-btn').forEach(b => b.classList.remove('selected'));
        Utils.$('#phoneIcon').classList.remove('flipped');
        Utils.$$('.look-dot').forEach(d => d.classList.remove('active', 'complete'));
        Utils.$$('.check-item').forEach(i => i.classList.remove('checked'));
        Utils.$$('.check-point').forEach(p => p.classList.remove('checked'));
        Utils.$('#bodyPrompt').textContent = 'tap each point to check in';
        Utils.$('#breathCircle').classList.remove('breathing', 'inhale', 'exhale');
        Utils.$$('.intention-btn').forEach(b => b.classList.remove('selected'));
        
        Utils.updateProgress(0);
        Utils.showScreen('titleScreen');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new PauseGame();
});


