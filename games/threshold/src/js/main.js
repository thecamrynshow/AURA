/* ============================================
   THRESHOLD — Main Game Controller
   Master the art of intentional state change
   ============================================ */

class Threshold {
    constructor() {
        this.canvas = document.getElementById('thresholdCanvas');
        this.portal = new Portal(this.canvas);
        this.breathing = new BreathingGuide();
        
        // UI Elements
        this.transitionsCountEl = document.getElementById('transitionsCount');
        this.fromStateEl = document.getElementById('fromState');
        this.toStateEl = document.getElementById('toState');
        this.completeMessageEl = document.getElementById('completeMessage');
        this.breathsTakenEl = document.getElementById('breathsTaken');
        this.timeTakenEl = document.getElementById('timeTaken');
        this.newStateCardEl = document.getElementById('newStateCard');
        
        // State
        this.currentScreen = 'title';
        this.fromState = null;
        this.toState = null;
        this.transitionsCount = 0;
        
        this.init();
    }

    async init() {
        await thresholdAudio.init();
        this.bindEvents();
        console.log('🚪 Threshold initialized — State Transition Training');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('state');
            thresholdAudio.resume();
        });

        // Current state selection
        document.querySelectorAll('#currentStates .state-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectFromState(card.dataset.state);
            });
        });

        // Target state selection
        document.querySelectorAll('#targetStates .state-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectToState(card.dataset.state);
            });
        });

        // New transition button
        document.getElementById('newTransitionBtn').addEventListener('click', () => {
            this.showScreen('state');
        });

        // Breathing callbacks
        this.breathing.onProgress = (progress) => {
            this.portal.setProgress(progress);
        };

        this.breathing.onBreath = (phase) => {
            this.portal.setBreathPhase(phase);
        };

        this.breathing.onComplete = (stats) => {
            this.completeTransition(stats);
        };
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId + 'Screen').classList.add('active');
        this.currentScreen = screenId;
        
        // Clear selections when showing state screen
        if (screenId === 'state') {
            document.querySelectorAll('.state-card.selected').forEach(card => {
                card.classList.remove('selected');
            });
        }
    }

    selectFromState(state) {
        this.fromState = state;
        
        // Update UI
        document.querySelectorAll('#currentStates .state-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.state === state);
        });
        
        thresholdAudio.playSelect();
        
        // Show target selection after delay
        setTimeout(() => {
            this.showScreen('target');
            this.updateTargetOptions();
        }, 300);
    }

    updateTargetOptions() {
        // Highlight recommended transitions
        const fromStateData = STATES[this.fromState];
        
        document.querySelectorAll('#targetStates .state-card').forEach(card => {
            const targetState = card.dataset.state;
            const isRecommended = fromStateData?.transitions?.includes(targetState);
            
            card.style.opacity = isRecommended ? '1' : '0.5';
            card.style.order = isRecommended ? '-1' : '0';
        });
    }

    selectToState(state) {
        this.toState = state;
        
        // Update UI
        document.querySelectorAll('#targetStates .state-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.state === state);
        });
        
        thresholdAudio.playSelect();
        
        // Start transition after delay
        setTimeout(() => {
            this.startTransition();
        }, 300);
    }

    startTransition() {
        this.showScreen('transition');
        
        // Update header
        const fromData = STATES[this.fromState];
        const toData = STATES[this.toState];
        
        this.fromStateEl.querySelector('.state-value').textContent = fromData?.name || this.fromState;
        this.toStateEl.querySelector('.state-value').textContent = toData?.name || this.toState;
        
        // Initialize portal
        this.portal.setStates(this.fromState, this.toState);
        this.portal.start();
        
        // Initialize breathing
        this.breathing.setPattern(this.toState);
        
        // Start ambient audio
        thresholdAudio.startAmbient();
        
        // Start breathing after brief delay
        setTimeout(() => {
            this.breathing.start();
        }, 1500);
    }

    completeTransition(stats) {
        this.transitionsCount++;
        this.transitionsCountEl.textContent = this.transitionsCount;
        
        // Stop portal and ambient
        this.portal.stop();
        thresholdAudio.stopAmbient();
        thresholdAudio.playComplete();
        
        // Update complete screen
        const toData = STATES[this.toState];
        
        this.completeMessageEl.textContent = `You've transitioned to ${toData?.name || this.toState}`;
        this.breathsTakenEl.textContent = stats.breathCount;
        this.timeTakenEl.textContent = formatTime(stats.duration);
        
        this.newStateCardEl.querySelector('.new-state-icon').textContent = toData?.icon || '✨';
        this.newStateCardEl.querySelector('.new-state-name').textContent = toData?.name || this.toState;
        this.newStateCardEl.style.borderColor = toData?.color || '#8b5cf6';
        
        // Show complete screen
        setTimeout(() => {
            this.showScreen('complete');
        }, 500);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.threshold = new Threshold();
});

console.log('🚪 Threshold Main loaded');


