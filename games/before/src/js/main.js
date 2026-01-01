/* ============================================
   BEFORE — Main Game Controller
   Arrive ready. Every time.
   ============================================ */

class Before {
    constructor() {
        this.canvas = document.getElementById('prepCanvas');
        this.visuals = new PrepVisuals(this.canvas);
        this.protocol = new PrepProtocol();
        
        // UI Elements
        this.eventBadge = document.getElementById('eventBadge');
        this.goalBadge = document.getElementById('goalBadge');
        this.readyMessageEl = document.getElementById('readyMessage');
        this.stateAchievedEl = document.getElementById('stateAchieved');
        this.readyAffirmationEl = document.getElementById('readyAffirmation');
        
        // State
        this.currentScreen = 'title';
        this.selectedEvent = null;
        this.selectedGoal = null;
        
        this.init();
    }

    async init() {
        await beforeAudio.init();
        this.bindEvents();
        console.log('⏱️ Before initialized — Arrive ready. Every time.');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('event');
            beforeAudio.resume();
        });

        // Event selection
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectEvent(card.dataset.event);
            });
        });

        // Goal selection
        document.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectGoal(card.dataset.goal);
            });
        });

        // Go Time button
        document.getElementById('goTimeBtn').addEventListener('click', () => {
            // Close the window or return to main
            window.location.href = '../../index.html';
        });

        // Prepare Again button
        document.getElementById('prepAgainBtn').addEventListener('click', () => {
            this.reset();
            this.showScreen('event');
        });

        // Protocol callbacks
        this.protocol.onPhaseChange = (phase) => {
            this.visuals.setPhase(phase);
        };

        this.protocol.onComplete = () => {
            this.showReady();
        };
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId + 'Screen').classList.add('active');
        this.currentScreen = screenId;
    }

    selectEvent(eventKey) {
        this.selectedEvent = eventKey;
        
        // Update UI
        document.querySelectorAll('.event-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.event === eventKey);
        });
        
        beforeAudio.playSelect();
        
        // Show goal selection
        setTimeout(() => {
            this.showScreen('goal');
        }, 300);
    }

    selectGoal(goalKey) {
        this.selectedGoal = goalKey;
        
        // Update UI
        document.querySelectorAll('.goal-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.goal === goalKey);
        });
        
        beforeAudio.playSelect();
        
        // Start prep session
        setTimeout(() => {
            this.startPrep();
        }, 300);
    }

    startPrep() {
        this.showScreen('prep');
        
        const event = EVENTS[this.selectedEvent];
        const goal = GOALS[this.selectedGoal];
        
        // Update badges
        this.eventBadge.querySelector('.badge-icon').textContent = event.icon;
        this.eventBadge.querySelector('.badge-text').textContent = event.name;
        this.goalBadge.querySelector('.badge-text').textContent = '→ ' + goal.name;
        
        // Set up protocol
        this.protocol.setEvent(this.selectedEvent);
        this.protocol.setGoal(this.selectedGoal);
        
        // Set up visuals
        this.visuals.setGoalColor(goal.color);
        this.visuals.start();
        
        // Start protocol after brief delay
        setTimeout(() => {
            this.protocol.start();
        }, 1000);
    }

    showReady() {
        this.visuals.stop();
        
        const event = EVENTS[this.selectedEvent];
        const goal = GOALS[this.selectedGoal];
        
        // Update ready screen
        this.readyMessageEl.textContent = `Time to ace that ${event.name.toLowerCase()}.`;
        
        this.stateAchievedEl.querySelector('.state-icon').textContent = goal.icon;
        this.stateAchievedEl.querySelector('.state-name').textContent = goal.name;
        
        // Pick a final affirmation
        const finalAffirmation = randomPick([
            ...event.affirmations,
            ...goal.affirmations
        ]);
        this.readyAffirmationEl.textContent = `"${finalAffirmation}"`;
        
        // Show ready screen
        setTimeout(() => {
            this.showScreen('ready');
            beforeAudio.playComplete();
        }, 500);
    }

    reset() {
        this.selectedEvent = null;
        this.selectedGoal = null;
        
        // Clear selections
        document.querySelectorAll('.event-card.selected, .goal-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Reset timer display
        document.querySelector('.timer-value').textContent = '5:00';
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.querySelectorAll('.phase-dot').forEach(dot => {
            dot.classList.remove('active', 'complete');
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.before = new Before();
});

console.log('⏱️ Before Main loaded');

