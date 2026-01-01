// ============================================
// Rise — Main Game Logic
// ============================================

class RiseGame {
    constructor() {
        this.intention = null;
        this.affirmation = '';
        this.currentStretch = 0;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Start button
        Utils.$('#startBtn').addEventListener('click', () => {
            AudioSystem.init();
            AudioSystem.playChime();
            this.startAwaken();
        });
        
        // Intention buttons
        Utils.$$('.intention-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectIntention(btn);
            });
        });
        
        // Done button
        Utils.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../../platform/games/';
        });
    }
    
    async startAwaken() {
        Utils.updateProgress(10);
        Utils.showScreen('awakenScreen');
        
        // Transition to dawn
        await Utils.wait(1500);
        Utils.setSkyState('dawn');
        
        // Open eye animation
        const eyelid = Utils.$('#eyelid');
        const awakenSub = Utils.$('#awakenSub');
        const instruction = Utils.$('#awakenInstruction');
        
        instruction.textContent = 'slowly open your eyes';
        await Utils.wait(2000);
        
        eyelid.classList.add('open');
        await Utils.wait(2000);
        
        awakenSub.textContent = 'let light in gently';
        await Utils.wait(2500);
        
        instruction.textContent = 'you are here. you are awake.';
        awakenSub.textContent = '';
        await Utils.wait(2000);
        
        this.startStretch();
    }
    
    async startStretch() {
        Utils.updateProgress(25);
        Utils.showScreen('stretchScreen');
        
        const instruction = Utils.$('#stretchInstruction');
        const armLeft = Utils.$('#armLeft');
        const armRight = Utils.$('#armRight');
        const counter = Utils.$('#stretchCount');
        
        for (let i = 0; i < Content.stretches.length; i++) {
            this.currentStretch = i;
            counter.textContent = i + 1;
            
            const stretch = Content.stretches[i];
            instruction.textContent = stretch.instruction;
            
            // Arm animation for first stretch
            if (i === 0) {
                await Utils.wait(1000);
                armLeft.classList.add('up');
                armRight.classList.add('up');
            }
            
            await Utils.wait(3000);
            
            if (i === 0) {
                armLeft.classList.remove('up');
                armRight.classList.remove('up');
            }
            
            await Utils.wait(500);
        }
        
        this.startBreathe();
    }
    
    async startBreathe() {
        Utils.updateProgress(45);
        Utils.showScreen('breatheScreen');
        Utils.setSkyState('sunrise');
        
        const orb = Utils.$('#breathOrb');
        const text = Utils.$('#breathText');
        const counter = Utils.$('#breathCount');
        
        for (let i = 0; i < 5; i++) {
            counter.textContent = i + 1;
            
            // Breathe in (4s)
            text.textContent = 'breathe in through your nose';
            orb.classList.remove('exhale');
            orb.classList.add('inhale');
            AudioSystem.playBreathIn();
            await Utils.wait(4000);
            
            // Breathe out (5s)
            text.textContent = 'slowly breathe out';
            orb.classList.remove('inhale');
            orb.classList.add('exhale');
            AudioSystem.playBreathOut();
            await Utils.wait(5000);
        }
        
        orb.classList.remove('inhale', 'exhale');
        text.textContent = 'beautiful ✓';
        await Utils.wait(1000);
        
        this.startIntention();
    }
    
    startIntention() {
        Utils.updateProgress(60);
        Utils.showScreen('intentionScreen');
    }
    
    async selectIntention(btn) {
        Utils.$$('.intention-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.intention = btn.dataset.intention;
        this.affirmation = Content.getAffirmation(this.intention);
        AudioSystem.playSelect();
        
        await Utils.wait(600);
        this.startAffirmation();
    }
    
    async startAffirmation() {
        Utils.updateProgress(75);
        Utils.showScreen('affirmationScreen');
        
        const text = Utils.$('#affirmationText');
        const instruction = Utils.$('#affirmationInstruction');
        const counter = Utils.$('#affirmCount');
        
        text.textContent = this.affirmation;
        
        for (let i = 0; i < 3; i++) {
            counter.textContent = i + 1;
            
            // Breathe in
            instruction.textContent = 'breathe in...';
            AudioSystem.playBreathIn();
            await Utils.wait(4000);
            
            // Say affirmation
            instruction.textContent = 'breathe out and feel it...';
            AudioSystem.playBreathOut();
            await Utils.wait(5000);
        }
        
        instruction.textContent = 'let it settle ✓';
        await Utils.wait(1500);
        
        this.startRise();
    }
    
    async startRise() {
        Utils.updateProgress(90);
        Utils.showScreen('riseScreen');
        Utils.setSkyState('day');
        
        const text = Utils.$('#riseText');
        
        AudioSystem.playSunrise();
        
        await Utils.wait(2000);
        text.textContent = 'the sun is up';
        
        await Utils.wait(2000);
        text.textContent = 'and so are you';
        
        await Utils.wait(2500);
        
        this.showComplete();
    }
    
    showComplete() {
        Utils.updateProgress(100);
        Utils.showScreen('completeScreen');
        
        // Set intention message
        Utils.$('#completeIntention').textContent = `today you choose ${this.intention}`;
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RiseGame();
});

