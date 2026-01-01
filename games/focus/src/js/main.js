/**
 * Focus — Main Game Controller
 * Study Session Reset for Teens
 */

class FocusGame {
    constructor() {
        this.state = 'title';
        this.distractionBefore = 5;
        this.distractionAfter = 2;
        this.thoughtsDismissed = 0;
        this.totalThoughts = 6;
        this.selectedIntention = null;
        this.selectedTime = 25;
        this.startTime = 0;
        
        this.attentionTrainer = new AttentionTrainer();
        this.focusBreathing = new FocusBreathing();
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupExercises();
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            distractionScreen: Utils.$('distractionScreen'),
            dumpScreen: Utils.$('dumpScreen'),
            breatheScreen: Utils.$('breatheScreen'),
            attentionScreen: Utils.$('attentionScreen'),
            intentionScreen: Utils.$('intentionScreen'),
            launchScreen: Utils.$('launchScreen'),
            completeScreen: Utils.$('completeScreen'),
            
            // Elements
            timer: Utils.$('timer'),
            startBtn: Utils.$('startBtn'),
            distractionSlider: Utils.$('distractionSlider'),
            distractionValue: Utils.$('distractionValue'),
            distractionContinue: Utils.$('distractionContinue'),
            thoughtsContainer: Utils.$('thoughtsContainer'),
            dumpProgress: Utils.$('dumpProgress'),
            focusCircle: Utils.$('focusCircle'),
            focusDot: Utils.$('focusDot'),
            breathText: Utils.$('breathText'),
            breathCount: Utils.$('breathCount'),
            attentionDesc: Utils.$('attentionDesc'),
            timerFill: Utils.$('timerFill'),
            attentionTime: Utils.$('attentionTime'),
            intentionOptions: Utils.$('intentionOptions'),
            timeSelect: Utils.$('timeSelect'),
            launchCountdown: Utils.$('launchCountdown'),
            launchTask: Utils.$('launchTask'),
            statBefore: Utils.$('statBefore'),
            statAfter: Utils.$('statAfter'),
            sessionInfo: Utils.$('sessionInfo'),
            goBtn: Utils.$('goBtn'),
            againBtn: Utils.$('againBtn')
        };
    }
    
    bindEvents() {
        // Start
        this.elements.startBtn.addEventListener('click', () => this.start());
        
        // Distraction slider
        this.elements.distractionSlider.addEventListener('input', (e) => {
            this.distractionBefore = parseInt(e.target.value);
            Utils.setText(this.elements.distractionValue, this.distractionBefore);
        });
        
        // Continue from distraction
        this.elements.distractionContinue.addEventListener('click', () => this.startBrainDump());
        
        // Thought bubbles
        this.elements.thoughtsContainer.querySelectorAll('.thought-bubble').forEach(bubble => {
            bubble.addEventListener('click', () => this.dismissThought(bubble));
        });
        
        // Intention buttons
        this.elements.intentionOptions.querySelectorAll('.intention-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectIntention(btn));
        });
        
        // Time buttons
        this.elements.timeSelect.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTime(btn));
        });
        
        // End buttons
        this.elements.goBtn.addEventListener('click', () => this.finish());
        this.elements.againBtn.addEventListener('click', () => this.reset());
    }
    
    setupExercises() {
        // Attention trainer callbacks
        this.attentionTrainer.onProgress = (elapsed, total) => {
            const remaining = total - elapsed;
            const percent = (remaining / total) * 100;
            this.elements.timerFill.style.width = `${percent}%`;
            Utils.setText(this.elements.attentionTime, `${remaining}s`);
        };
        
        this.attentionTrainer.onComplete = () => {
            Audio.playFocus();
            setTimeout(() => this.showIntention(), 500);
        };
        
        // Focus breathing callbacks
        this.focusBreathing.onPhase = (phase, duration) => {
            if (phase === 'inhale') {
                Utils.setText(this.elements.breathText, 'breathe in');
            } else if (phase === 'hold') {
                Utils.setText(this.elements.breathText, 'hold');
            } else {
                Utils.setText(this.elements.breathText, 'breathe out');
            }
        };
        
        this.focusBreathing.onCycleComplete = (current, total) => {
            Utils.setText(this.elements.breathCount.querySelector('.count-current'), current);
        };
        
        this.focusBreathing.onComplete = () => {
            this.startAttention();
        };
    }
    
    async start() {
        await Audio.init();
        Audio.playTap();
        
        this.startTime = Date.now();
        this.showScreen('distraction');
    }
    
    startBrainDump() {
        Audio.playTap();
        Utils.addClass(this.elements.timer, 'visible');
        this.startTimer();
        
        // Randomize thought bubbles
        const thoughts = Exercises.getRandomThoughts(6);
        const bubbles = this.elements.thoughtsContainer.querySelectorAll('.thought-bubble');
        bubbles.forEach((bubble, i) => {
            bubble.textContent = thoughts[i];
            Utils.removeClass(bubble, 'dismissed');
        });
        
        this.thoughtsDismissed = 0;
        Utils.setText(this.elements.dumpProgress, `${this.thoughtsDismissed}/${this.totalThoughts}`);
        
        this.showScreen('dump');
    }
    
    dismissThought(bubble) {
        if (bubble.classList.contains('dismissed')) return;
        
        Utils.addClass(bubble, 'dismissed');
        Audio.playDismiss();
        
        this.thoughtsDismissed++;
        Utils.setText(this.elements.dumpProgress, `${this.thoughtsDismissed}/${this.totalThoughts}`);
        
        if (this.thoughtsDismissed >= this.totalThoughts) {
            setTimeout(() => this.startBreathing(), 500);
        }
    }
    
    startBreathing() {
        Utils.setText(this.elements.breathCount.querySelector('.count-current'), '1');
        this.showScreen('breathe');
        
        setTimeout(() => {
            this.focusBreathing.start();
        }, 500);
    }
    
    startAttention() {
        Utils.setText(this.elements.attentionTime, `${Exercises.attentionDuration}s`);
        this.elements.timerFill.style.width = '100%';
        
        this.showScreen('attention');
        
        setTimeout(() => {
            this.attentionTrainer.start();
        }, 1000);
    }
    
    showIntention() {
        this.showScreen('intention');
    }
    
    selectIntention(btn) {
        // Remove selection from all
        this.elements.intentionOptions.querySelectorAll('.intention-btn').forEach(b => {
            Utils.removeClass(b, 'selected');
        });
        
        Utils.addClass(btn, 'selected');
        this.selectedIntention = btn.dataset.intention;
        
        Audio.playTap();
        
        // Show time selection
        Utils.addClass(this.elements.timeSelect, 'visible');
    }
    
    selectTime(btn) {
        this.elements.timeSelect.querySelectorAll('.time-btn').forEach(b => {
            Utils.removeClass(b, 'active');
        });
        
        Utils.addClass(btn, 'active');
        this.selectedTime = parseInt(btn.dataset.time);
        
        Audio.playTap();
        
        // Auto-advance after brief delay
        setTimeout(() => this.startLaunch(), 300);
    }
    
    startLaunch() {
        // Find intention label
        const intentionBtn = this.elements.intentionOptions.querySelector(`[data-intention="${this.selectedIntention}"]`);
        const intentionLabel = intentionBtn ? intentionBtn.textContent : '📝 Study';
        
        Utils.setText(this.elements.launchTask, `${intentionLabel} for ${this.selectedTime} min`);
        
        this.showScreen('launch');
        
        // Countdown
        let count = 3;
        const countdownInterval = setInterval(() => {
            count--;
            Audio.playTick();
            Utils.setText(this.elements.launchCountdown, count);
            
            if (count <= 0) {
                clearInterval(countdownInterval);
                this.complete();
            }
        }, 1000);
    }
    
    complete() {
        // Calculate after distraction (lower is better)
        this.distractionAfter = Math.max(1, this.distractionBefore - Utils.randomInt(3, 5));
        
        Utils.setText(this.elements.statBefore, this.distractionBefore);
        Utils.setText(this.elements.statAfter, this.distractionAfter);
        
        // Session info
        const intentionBtn = this.elements.intentionOptions.querySelector(`[data-intention="${this.selectedIntention}"]`);
        const intentionLabel = intentionBtn ? intentionBtn.textContent : '📝 Study';
        
        this.elements.sessionInfo.innerHTML = `
            <p class="session-task">${intentionLabel}</p>
            <p class="session-time">${this.selectedTime} minutes</p>
        `;
        
        Audio.playSuccess();
        this.stopTimer();
        Utils.removeClass(this.elements.timer, 'visible');
        
        this.showScreen('complete');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            Utils.setText(this.elements.timer.querySelector('.timer-value'), Utils.formatTime(elapsed));
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
    
    finish() {
        // Could link to a timer app or just close
        window.location.href = '../../platform/games/';
    }
    
    reset() {
        this.state = 'title';
        this.distractionBefore = 5;
        this.thoughtsDismissed = 0;
        this.selectedIntention = null;
        this.selectedTime = 25;
        
        // Reset UI
        this.elements.distractionSlider.value = 5;
        Utils.setText(this.elements.distractionValue, 5);
        Utils.removeClass(this.elements.timeSelect, 'visible');
        
        this.elements.intentionOptions.querySelectorAll('.intention-btn').forEach(b => {
            Utils.removeClass(b, 'selected');
        });
        
        this.focusBreathing.stop();
        this.attentionTrainer.stop();
        this.stopTimer();
        
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        const screens = ['title', 'distraction', 'dump', 'breathe', 'attention', 'intention', 'launch', 'complete'];
        
        screens.forEach(name => {
            Utils.removeClass(this.elements[`${name}Screen`], 'active');
        });
        
        Utils.addClass(this.elements[`${screenName}Screen`], 'active');
        this.state = screenName;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new FocusGame();
});

