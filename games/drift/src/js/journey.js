/**
 * Drift — Sleep Journey
 * Phases of the sleep preparation journey
 */

const SleepJourney = {
    // Phase definitions
    phases: [
        {
            name: 'Arrival',
            duration: 0.12, // 12% of total time
            breathPattern: '4-7-8',
            messages: [
                { title: 'Arriving', text: 'The day is done. This time is yours.' },
                { title: 'Letting Go', text: 'Let your body settle into this moment.' },
                { title: 'Permission', text: 'You have permission to rest.' }
            ],
            ambientTexts: [
                'Nothing to do now',
                'Nowhere to be',
                'Just this breath'
            ]
        },
        {
            name: 'Release',
            duration: 0.20, // 20% of total time
            breathPattern: '4-7-8',
            messages: [
                { title: 'Shoulders', text: 'Let them drop. Feel the weight release.' },
                { title: 'Jaw', text: 'Unclench. Let your mouth soften.' },
                { title: 'Forehead', text: 'Smooth. No effort needed here.' }
            ],
            ambientTexts: [
                'Releasing tension',
                'Softening',
                'Letting go'
            ]
        },
        {
            name: 'Descent',
            duration: 0.25, // 25% of total time
            breathPattern: '4-7-8',
            messages: [
                { title: 'Sinking', text: 'Feel yourself getting heavier.' },
                { title: 'Supported', text: 'The bed holds you completely.' },
                { title: 'Deeper', text: 'Each breath takes you further down.' }
            ],
            ambientTexts: [
                'Sinking down',
                'Heavy and warm',
                'Deeper still'
            ]
        },
        {
            name: 'Stillness',
            duration: 0.25, // 25% of total time
            breathPattern: 'natural',
            messages: [
                { title: 'Quiet Mind', text: 'Thoughts may come. Let them float by.' },
                { title: 'Stillness', text: 'Like the surface of still water.' },
                { title: 'Peace', text: 'Nothing to solve tonight.' }
            ],
            ambientTexts: [
                'Thoughts can wait',
                'Still and quiet',
                'Peace'
            ]
        },
        {
            name: 'Drift',
            duration: 0.18, // 18% of total time
            breathPattern: 'natural',
            messages: [
                { title: 'Drifting', text: 'Let yourself drift now.' },
                { title: 'Sleep Approaches', text: 'It comes on its own time.' },
                { title: 'Goodnight', text: 'Rest well.' }
            ],
            ambientTexts: [
                'Drifting',
                'Almost there',
                'Sleep'
            ]
        }
    ],
    
    // 4-7-8 breathing pattern (scientifically proven for sleep)
    breathPatterns: {
        '4-7-8': {
            phases: [
                { action: 'inhale', duration: 4000, text: 'Breathe in' },
                { action: 'hold', duration: 7000, text: 'Hold' },
                { action: 'exhale', duration: 8000, text: 'Release' }
            ]
        },
        'natural': {
            phases: [
                { action: 'inhale', duration: 5000, text: 'In' },
                { action: 'exhale', duration: 7000, text: 'Out' }
            ]
        }
    }
};

class JourneyController {
    constructor() {
        this.currentPhaseIndex = 0;
        this.currentMessageIndex = 0;
        this.breathPhaseIndex = 0;
        this.totalDuration = 0;
        this.startTime = 0;
        this.isRunning = false;
        
        this.breathTimer = null;
        this.messageTimer = null;
        this.ambientTimer = null;
        
        // Callbacks
        this.onPhaseChange = null;
        this.onMessageChange = null;
        this.onBreathChange = null;
        this.onAmbientText = null;
        this.onProgress = null;
        this.onComplete = null;
    }
    
    setDuration(seconds) {
        this.totalDuration = seconds * 1000;
    }
    
    start() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.currentPhaseIndex = 0;
        this.currentMessageIndex = 0;
        this.breathPhaseIndex = 0;
        
        this.runPhase();
        this.startBreathing();
        this.startAmbientText();
        this.startProgressTracker();
    }
    
    stop() {
        this.isRunning = false;
        this.clearTimers();
    }
    
    clearTimers() {
        if (this.breathTimer) clearTimeout(this.breathTimer);
        if (this.messageTimer) clearTimeout(this.messageTimer);
        if (this.ambientTimer) clearInterval(this.ambientTimer);
        if (this.progressTimer) clearInterval(this.progressTimer);
    }
    
    runPhase() {
        if (!this.isRunning) return;
        if (this.currentPhaseIndex >= SleepJourney.phases.length) {
            this.complete();
            return;
        }
        
        const phase = SleepJourney.phases[this.currentPhaseIndex];
        const phaseDuration = this.totalDuration * phase.duration;
        
        if (this.onPhaseChange) {
            this.onPhaseChange(phase, this.currentPhaseIndex);
        }
        
        // Cycle through messages in this phase
        this.currentMessageIndex = 0;
        this.runMessages(phase, phaseDuration);
        
        // Schedule next phase
        setTimeout(() => {
            this.currentPhaseIndex++;
            this.runPhase();
        }, phaseDuration);
    }
    
    runMessages(phase, phaseDuration) {
        if (!this.isRunning) return;
        
        const messageDuration = phaseDuration / phase.messages.length;
        
        const showMessage = () => {
            if (!this.isRunning) return;
            if (this.currentMessageIndex >= phase.messages.length) return;
            
            const message = phase.messages[this.currentMessageIndex];
            if (this.onMessageChange) {
                this.onMessageChange(message);
            }
            
            this.currentMessageIndex++;
            this.messageTimer = setTimeout(showMessage, messageDuration);
        };
        
        showMessage();
    }
    
    startBreathing() {
        const runBreathCycle = () => {
            if (!this.isRunning) return;
            
            const phase = SleepJourney.phases[this.currentPhaseIndex];
            if (!phase) return;
            
            const pattern = SleepJourney.breathPatterns[phase.breathPattern];
            if (!pattern) return;
            
            const breathPhase = pattern.phases[this.breathPhaseIndex];
            
            if (this.onBreathChange) {
                this.onBreathChange(breathPhase);
            }
            
            // Play audio cue
            if (breathPhase.action === 'inhale') {
                Audio.playBreathCue('inhale');
            } else if (breathPhase.action === 'exhale') {
                Audio.playBreathCue('exhale');
            }
            
            this.breathPhaseIndex = (this.breathPhaseIndex + 1) % pattern.phases.length;
            this.breathTimer = setTimeout(runBreathCycle, breathPhase.duration);
        };
        
        runBreathCycle();
    }
    
    startAmbientText() {
        // Show ambient text occasionally
        this.ambientTimer = setInterval(() => {
            if (!this.isRunning) return;
            
            const phase = SleepJourney.phases[this.currentPhaseIndex];
            if (!phase) return;
            
            const text = phase.ambientTexts[Utils.randomInt(0, phase.ambientTexts.length - 1)];
            
            if (this.onAmbientText) {
                this.onAmbientText(text);
            }
        }, 25000); // Every 25 seconds
    }
    
    startProgressTracker() {
        this.progressTimer = setInterval(() => {
            if (!this.isRunning) return;
            
            const elapsed = Date.now() - this.startTime;
            const progress = Math.min(elapsed / this.totalDuration, 1);
            
            if (this.onProgress) {
                this.onProgress(progress);
            }
            
            if (progress >= 1) {
                this.complete();
            }
        }, 500);
    }
    
    complete() {
        this.isRunning = false;
        this.clearTimers();
        
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    getProgress() {
        if (!this.isRunning) return 0;
        return Math.min((Date.now() - this.startTime) / this.totalDuration, 1);
    }
}



