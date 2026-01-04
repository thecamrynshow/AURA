/**
 * Chill — Main Game Controller
 * Social Anxiety Cool-Down for Teens
 */

class ChillGame {
    constructor() {
        this.state = 'title';
        this.situation = 'other';
        this.anxietyBefore = 5;
        this.anxietyAfter = 3;
        this.breathCount = 0;
        this.totalBreaths = 4;
        this.startTime = 0;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            situationScreen: Utils.$('situationScreen'),
            anxietyScreen: Utils.$('anxietyScreen'),
            groundScreen: Utils.$('groundScreen'),
            breatheScreen: Utils.$('breatheScreen'),
            reframeScreen: Utils.$('reframeScreen'),
            launchScreen: Utils.$('launchScreen'),
            completeScreen: Utils.$('completeScreen'),
            
            // Elements
            timer: Utils.$('timer'),
            startBtn: Utils.$('startBtn'),
            situationBtns: Utils.$$('.situation-btn'),
            anxietySlider: Utils.$('anxietySlider'),
            anxietyValue: Utils.$('anxietyValue'),
            anxietyContinue: Utils.$('anxietyContinue'),
            groundInstruction: Utils.$('groundInstruction'),
            groundTap: Utils.$('groundTap'),
            breathCircle: Utils.$('breathCircle'),
            breathText: Utils.$('breathText'),
            breathCount: Utils.$('breathCount'),
            reframeText: Utils.$('reframeText'),
            reframeContinue: Utils.$('reframeContinue'),
            launchTitle: Utils.$('launchTitle'),
            launchAffirmation: Utils.$('launchAffirmation'),
            countdown: Utils.$('countdown'),
            statBefore: Utils.$('statBefore'),
            statAfter: Utils.$('statAfter'),
            doneBtn: Utils.$('doneBtn'),
            againBtn: Utils.$('againBtn')
        };
    }
    
    bindEvents() {
        // Start
        this.elements.startBtn.addEventListener('click', () => this.start());
        
        // Situation selection
        this.elements.situationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectSituation(btn));
        });
        
        // Anxiety slider
        this.elements.anxietySlider.addEventListener('input', (e) => {
            this.anxietyBefore = parseInt(e.target.value);
            Utils.setText(this.elements.anxietyValue, this.anxietyBefore);
        });
        
        // Continue buttons
        this.elements.anxietyContinue.addEventListener('click', () => this.startGround());
        this.elements.reframeContinue.addEventListener('click', () => this.startLaunch());
        
        // Ground tap
        this.elements.groundTap.addEventListener('click', () => this.completeGround());
        
        // End buttons
        this.elements.doneBtn.addEventListener('click', () => this.finish());
        this.elements.againBtn.addEventListener('click', () => this.reset());
    }
    
    async start() {
        await Audio.init();
        Audio.playTap();
        
        this.startTime = Date.now();
        this.showScreen('situation');
    }
    
    selectSituation(btn) {
        // Remove selected from all
        this.elements.situationBtns.forEach(b => Utils.removeClass(b, 'selected'));
        
        // Select this one
        Utils.addClass(btn, 'selected');
        this.situation = btn.dataset.situation;
        
        Audio.playTap();
        
        // Auto-advance after brief delay
        setTimeout(() => {
            this.showScreen('anxiety');
        }, 300);
    }
    
    startGround() {
        Audio.playTap();
        
        Utils.addClass(this.elements.timer, 'visible');
        this.startTimer();
        
        // Set grounding instruction
        Utils.setText(this.elements.groundInstruction, Content.getGrounding());
        
        this.showScreen('ground');
    }
    
    completeGround() {
        const tapCircle = this.elements.groundTap.querySelector('.tap-circle');
        Utils.addClass(tapCircle, 'tapped');
        Audio.playTap();
        
        setTimeout(() => {
            this.startBreathing();
        }, 500);
    }
    
    startBreathing() {
        this.breathCount = 0;
        this.showScreen('breathe');
        this.runBreathCycle();
    }
    
    runBreathCycle() {
        if (this.breathCount >= this.totalBreaths) {
            this.startReframe();
            return;
        }
        
        const circle = this.elements.breathCircle;
        const text = this.elements.breathText;
        const count = this.elements.breathCount;
        
        // Update count
        Utils.setText(count.querySelector('.count-current'), this.breathCount + 1);
        
        // Inhale
        Utils.removeClass(circle, 'exhale');
        Utils.addClass(circle, 'inhale');
        Utils.setText(text, 'breathe in');
        Audio.playInhale();
        
        setTimeout(() => {
            // Exhale
            Utils.removeClass(circle, 'inhale');
            Utils.addClass(circle, 'exhale');
            Utils.setText(text, 'breathe out');
            Audio.playExhale();
            
            setTimeout(() => {
                this.breathCount++;
                this.runBreathCycle();
            }, 4000);
        }, 4000);
    }
    
    startReframe() {
        // Get situation-specific reframe
        const reframe = Content.getReframe(this.situation);
        Utils.setText(this.elements.reframeText, reframe);
        
        this.showScreen('reframe');
    }
    
    startLaunch() {
        Audio.playTap();
        
        // Get situation-specific affirmation
        const affirmation = Content.getAffirmation(this.situation);
        Utils.setText(this.elements.launchAffirmation, affirmation);
        
        this.showScreen('launch');
        
        // Run countdown
        this.runCountdown();
    }
    
    runCountdown() {
        let count = 3;
        const countdownEl = this.elements.countdown.querySelector('.countdown-number');
        
        const tick = () => {
            Utils.setText(countdownEl, count);
            Audio.playTick();
            
            count--;
            
            if (count >= 0) {
                setTimeout(tick, 1000);
            } else {
                this.complete();
            }
        };
        
        tick();
    }
    
    complete() {
        // Calculate "after" anxiety (roughly 2-4 points lower)
        this.anxietyAfter = Math.max(1, this.anxietyBefore - Utils.randomInt(2, 4));
        
        Utils.setText(this.elements.statBefore, this.anxietyBefore);
        Utils.setText(this.elements.statAfter, this.anxietyAfter);
        
        Audio.playSuccess();
        
        this.showScreen('complete');
        Utils.removeClass(this.elements.timer, 'visible');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            Utils.setText(this.elements.timer.querySelector('.timer-value'), Utils.formatTime(elapsed));
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    finish() {
        // Close the game / return
        window.location.href = '../../platform/games/';
    }
    
    reset() {
        this.state = 'title';
        this.situation = 'other';
        this.anxietyBefore = 5;
        this.breathCount = 0;
        
        // Reset UI
        this.elements.situationBtns.forEach(b => Utils.removeClass(b, 'selected'));
        this.elements.anxietySlider.value = 5;
        Utils.setText(this.elements.anxietyValue, 5);
        Utils.removeClass(this.elements.groundTap.querySelector('.tap-circle'), 'tapped');
        Utils.removeClass(this.elements.breathCircle, 'inhale');
        Utils.removeClass(this.elements.breathCircle, 'exhale');
        
        this.stopTimer();
        
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        const screens = ['title', 'situation', 'anxiety', 'ground', 'breathe', 'reframe', 'launch', 'complete'];
        
        screens.forEach(name => {
            Utils.removeClass(this.elements[`${name}Screen`], 'active');
        });
        
        Utils.addClass(this.elements[`${screenName}Screen`], 'active');
        this.state = screenName;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ChillGame();
});



