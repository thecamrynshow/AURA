/**
 * Sync — Co-Regulation Phases
 */

const SyncPhases = [
    {
        name: 'Arriving Together',
        duration: 60000, // 1 minute
        instruction: 'Take a moment to settle. Let your eyes meet.',
        breathPattern: 'natural',
        touchPrompt: 'If you\'d like, gently hold hands'
    },
    {
        name: 'Finding Each Other',
        duration: 90000, // 1.5 minutes
        instruction: 'Notice your partner\'s breathing. Just observe.',
        breathPattern: 'natural',
        touchPrompt: null
    },
    {
        name: 'Beginning to Sync',
        duration: 120000, // 2 minutes
        instruction: 'Start to match your breathing. Inhale together.',
        breathPattern: 'guided',
        touchPrompt: 'Feel the warmth of your partner\'s hands'
    },
    {
        name: 'Deepening',
        duration: 180000, // 3 minutes
        instruction: 'Breathe as one. Let your rhythms merge.',
        breathPattern: 'slow',
        touchPrompt: null
    },
    {
        name: 'Holding Together',
        duration: 120000, // 2 minutes
        instruction: 'Stay in this shared space. You\'re connected.',
        breathPattern: 'slow',
        touchPrompt: 'Feel your hearts beating together'
    },
    {
        name: 'Gentle Return',
        duration: 60000, // 1 minute
        instruction: 'Slowly return. Carry this connection with you.',
        breathPattern: 'natural',
        touchPrompt: 'A gentle squeeze before you let go'
    }
];

const BreathPatterns = {
    natural: {
        inhale: 4000,
        hold: 0,
        exhale: 4000,
        pause: 500
    },
    guided: {
        inhale: 4000,
        hold: 2000,
        exhale: 6000,
        pause: 1000
    },
    slow: {
        inhale: 5000,
        hold: 2000,
        exhale: 7000,
        pause: 1000
    }
};

class PhaseController {
    constructor() {
        this.currentPhaseIndex = 0;
        this.isRunning = false;
        this.startTime = 0;
        this.totalDuration = 0;
        this.phaseTimer = null;
        
        // Callbacks
        this.onPhaseChange = null;
        this.onBreathCue = null;
        this.onTouchPrompt = null;
        this.onProgress = null;
        this.onComplete = null;
    }
    
    calculateTotalDuration() {
        return SyncPhases.reduce((sum, phase) => sum + phase.duration, 0);
    }
    
    start() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.currentPhaseIndex = 0;
        this.totalDuration = this.calculateTotalDuration();
        
        this.runPhase();
        this.startProgressTracker();
    }
    
    stop() {
        this.isRunning = false;
        if (this.phaseTimer) clearTimeout(this.phaseTimer);
        if (this.breathInterval) clearInterval(this.breathInterval);
        if (this.progressInterval) clearInterval(this.progressInterval);
    }
    
    runPhase() {
        if (!this.isRunning) return;
        if (this.currentPhaseIndex >= SyncPhases.length) {
            this.complete();
            return;
        }
        
        const phase = SyncPhases[this.currentPhaseIndex];
        
        if (this.onPhaseChange) {
            this.onPhaseChange(phase, this.currentPhaseIndex);
        }
        
        // Show touch prompt if available
        if (phase.touchPrompt && this.onTouchPrompt) {
            setTimeout(() => {
                this.onTouchPrompt(phase.touchPrompt);
            }, 3000);
        }
        
        // Start breath cueing for guided phases
        if (phase.breathPattern !== 'natural') {
            this.startBreathCueing(phase.breathPattern);
        } else {
            this.stopBreathCueing();
        }
        
        // Schedule next phase
        this.phaseTimer = setTimeout(() => {
            this.currentPhaseIndex++;
            this.runPhase();
        }, phase.duration);
    }
    
    startBreathCueing(patternName) {
        this.stopBreathCueing();
        
        const pattern = BreathPatterns[patternName];
        if (!pattern) return;
        
        const cycleDuration = pattern.inhale + pattern.hold + pattern.exhale + pattern.pause;
        
        const runCycle = () => {
            if (!this.isRunning) return;
            
            // Inhale
            if (this.onBreathCue) {
                this.onBreathCue('inhale', pattern.inhale);
            }
            
            // Hold
            setTimeout(() => {
                if (!this.isRunning) return;
                if (pattern.hold > 0 && this.onBreathCue) {
                    this.onBreathCue('hold', pattern.hold);
                }
            }, pattern.inhale);
            
            // Exhale
            setTimeout(() => {
                if (!this.isRunning) return;
                if (this.onBreathCue) {
                    this.onBreathCue('exhale', pattern.exhale);
                }
            }, pattern.inhale + pattern.hold);
        };
        
        runCycle();
        this.breathInterval = setInterval(runCycle, cycleDuration);
    }
    
    stopBreathCueing() {
        if (this.breathInterval) {
            clearInterval(this.breathInterval);
            this.breathInterval = null;
        }
    }
    
    startProgressTracker() {
        this.progressInterval = setInterval(() => {
            if (!this.isRunning) return;
            
            const elapsed = Date.now() - this.startTime;
            const progress = elapsed / this.totalDuration;
            
            if (this.onProgress) {
                this.onProgress(progress, elapsed);
            }
        }, 500);
    }
    
    complete() {
        this.isRunning = false;
        this.stopBreathCueing();
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    getCurrentPhase() {
        return SyncPhases[this.currentPhaseIndex];
    }
    
    getProgress() {
        if (!this.isRunning) return 0;
        return (Date.now() - this.startTime) / this.totalDuration;
    }
}



