/**
 * Reset — Breathing Patterns
 * Different breathing techniques for various needs
 */

const BreathingPatterns = {
    // Box Breathing (4-4-4-4) - Military stress relief
    box: {
        name: 'Box Breathing',
        phases: [
            { action: 'inhale', duration: 4000, text: 'Inhale', instruction: 'Breathe in slowly through your nose' },
            { action: 'hold', duration: 4000, text: 'Hold', instruction: 'Hold gently, relax your shoulders' },
            { action: 'exhale', duration: 4000, text: 'Exhale', instruction: 'Release slowly through your mouth' },
            { action: 'hold', duration: 4000, text: 'Hold', instruction: 'Empty pause, stay relaxed' }
        ]
    },
    
    // 4-7-8 Breathing - Relaxation response
    relaxing: {
        name: 'Relaxing Breath',
        phases: [
            { action: 'inhale', duration: 4000, text: 'Inhale', instruction: 'Breathe in quietly through nose' },
            { action: 'hold', duration: 7000, text: 'Hold', instruction: 'Hold your breath gently' },
            { action: 'exhale', duration: 8000, text: 'Exhale', instruction: 'Exhale completely through mouth' }
        ]
    },
    
    // Coherent Breathing (5-5) - Heart rate variability
    coherent: {
        name: 'Coherent Breathing',
        phases: [
            { action: 'inhale', duration: 5000, text: 'Inhale', instruction: 'Smooth, steady inhale' },
            { action: 'exhale', duration: 5000, text: 'Exhale', instruction: 'Smooth, steady exhale' }
        ]
    },
    
    // Energizing (quick inhale, long exhale)
    energizing: {
        name: 'Energizing Breath',
        phases: [
            { action: 'inhale', duration: 2000, text: 'Inhale', instruction: 'Quick breath in' },
            { action: 'hold', duration: 1000, text: 'Hold', instruction: 'Brief pause' },
            { action: 'exhale', duration: 4000, text: 'Exhale', instruction: 'Slow, controlled release' }
        ]
    },
    
    // Simple calming (for beginners)
    simple: {
        name: 'Simple Calm',
        phases: [
            { action: 'inhale', duration: 4000, text: 'Inhale', instruction: 'Breathe in' },
            { action: 'exhale', duration: 6000, text: 'Exhale', instruction: 'Breathe out slowly' }
        ]
    }
};

class BreathingController {
    constructor() {
        this.currentPattern = null;
        this.currentPhase = 0;
        this.isRunning = false;
        this.breathCount = 0;
        this.onPhaseChange = null;
        this.onBreathComplete = null;
        this.phaseTimer = null;
    }
    
    setPattern(patternName) {
        this.currentPattern = BreathingPatterns[patternName] || BreathingPatterns.box;
        this.currentPhase = 0;
        this.breathCount = 0;
    }
    
    start() {
        if (!this.currentPattern) {
            this.setPattern('box');
        }
        this.isRunning = true;
        this.runPhase();
    }
    
    stop() {
        this.isRunning = false;
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
        }
    }
    
    resume() {
        this.isRunning = true;
        this.runPhase();
    }
    
    runPhase() {
        if (!this.isRunning || !this.currentPattern) return;
        
        const phase = this.currentPattern.phases[this.currentPhase];
        
        if (this.onPhaseChange) {
            this.onPhaseChange(phase, this.currentPhase);
        }
        
        // Play audio cue
        if (phase.action === 'inhale') {
            Audio.playInhale();
        } else if (phase.action === 'exhale') {
            Audio.playExhale();
        }
        
        this.phaseTimer = setTimeout(() => {
            this.currentPhase++;
            
            if (this.currentPhase >= this.currentPattern.phases.length) {
                this.currentPhase = 0;
                this.breathCount++;
                
                if (this.onBreathComplete) {
                    this.onBreathComplete(this.breathCount);
                }
            }
            
            if (this.isRunning) {
                this.runPhase();
            }
        }, phase.duration);
    }
    
    getCurrentPhase() {
        if (!this.currentPattern) return null;
        return this.currentPattern.phases[this.currentPhase];
    }
    
    getBreathCount() {
        return this.breathCount;
    }
}

