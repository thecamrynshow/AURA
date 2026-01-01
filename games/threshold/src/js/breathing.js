/* ============================================
   THRESHOLD — Breathing System
   Guided breathing patterns for state transition
   ============================================ */

class BreathingGuide {
    constructor() {
        this.circle = document.getElementById('breathCircle');
        this.text = document.getElementById('breathText');
        this.instruction = document.getElementById('breathInstruction');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        this.pattern = null;
        this.currentCycle = 0;
        this.currentPhase = 'idle';
        this.phaseTimer = null;
        this.isActive = false;
        
        this.onProgress = null;
        this.onComplete = null;
        this.onBreath = null;
        
        this.breathCount = 0;
        this.startTime = 0;
    }

    setPattern(targetState) {
        this.pattern = BREATHING_PATTERNS[targetState];
        if (!this.pattern) {
            console.warn('No pattern for state:', targetState);
            this.pattern = BREATHING_PATTERNS.calm;
        }
        
        this.instruction.textContent = this.pattern.description;
    }

    start() {
        if (!this.pattern) return;
        
        this.isActive = true;
        this.currentCycle = 0;
        this.breathCount = 0;
        this.startTime = Date.now();
        this.updateProgress();
        
        // Start first breath
        this.runCycle();
    }

    stop() {
        this.isActive = false;
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
        this.circle.className = 'breath-circle';
        this.text.textContent = 'Complete';
    }

    runCycle() {
        if (!this.isActive) return;
        
        // Run phases in sequence
        this.runPhase('inhale', () => {
            if (this.pattern.hold > 0) {
                this.runPhase('hold', () => {
                    this.runPhase('exhale', () => {
                        if (this.pattern.holdAfter > 0) {
                            this.runPhase('holdAfter', () => {
                                this.completeCycle();
                            });
                        } else {
                            this.completeCycle();
                        }
                    });
                });
            } else {
                this.runPhase('exhale', () => {
                    this.completeCycle();
                });
            }
        });
    }

    runPhase(phase, callback) {
        if (!this.isActive) return;
        
        this.currentPhase = phase;
        
        // Get duration for this phase
        let duration;
        switch (phase) {
            case 'inhale':
                duration = this.pattern.inhale;
                this.text.textContent = 'Inhale';
                this.circle.className = 'breath-circle inhale';
                break;
            case 'hold':
                duration = this.pattern.hold;
                this.text.textContent = 'Hold';
                this.circle.className = 'breath-circle hold';
                break;
            case 'exhale':
                duration = this.pattern.exhale;
                this.text.textContent = 'Exhale';
                this.circle.className = 'breath-circle exhale';
                break;
            case 'holdAfter':
                duration = this.pattern.holdAfter;
                this.text.textContent = 'Hold';
                this.circle.className = 'breath-circle hold';
                break;
        }
        
        // Play audio cue
        thresholdAudio.playBreathCue(phase === 'holdAfter' ? 'hold' : phase);
        
        // Notify
        if (this.onBreath) {
            this.onBreath(phase);
        }
        
        // Wait for phase duration then callback
        this.phaseTimer = setTimeout(() => {
            callback();
        }, duration * 1000);
    }

    completeCycle() {
        this.currentCycle++;
        this.breathCount++;
        this.updateProgress();
        
        if (this.currentCycle >= this.pattern.cycles) {
            // All cycles complete
            this.stop();
            if (this.onComplete) {
                this.onComplete({
                    breathCount: this.breathCount,
                    duration: (Date.now() - this.startTime) / 1000
                });
            }
        } else {
            // Next cycle
            this.runCycle();
        }
    }

    updateProgress() {
        const progress = this.pattern ? (this.currentCycle / this.pattern.cycles) * 100 : 0;
        this.progressFill.style.width = progress + '%';
        this.progressText.textContent = Math.round(progress) + '%';
        
        if (this.onProgress) {
            this.onProgress(progress / 100);
        }
    }

    getStats() {
        return {
            breathCount: this.breathCount,
            duration: (Date.now() - this.startTime) / 1000
        };
    }
}

console.log('Threshold Breathing loaded');

