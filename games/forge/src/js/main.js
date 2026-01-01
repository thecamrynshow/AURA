// ============================================
// Forge — Main Game Logic
// ============================================

class ForgeGame {
    constructor() {
        this.target = null;
        this.isBreathing = false;
        
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
            this.showTargetScreen();
        });
        
        // Target selection
        Utils.$$('.target-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTarget(btn);
            });
        });
        
        // Complete actions
        Utils.$('#doneBtn').addEventListener('click', () => {
            Utils.stopEmbers();
            window.location.href = '../../platform/games/';
        });
        
        Utils.$('#againBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    showTargetScreen() {
        Utils.updateProgress(10);
        Utils.showScreen('targetScreen');
    }
    
    selectTarget(btn) {
        Utils.$$('.target-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.target = btn.dataset.target;
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.startFoundation();
        }, 400);
    }
    
    async startFoundation() {
        Utils.updateProgress(20);
        Utils.showScreen('foundationScreen');
        Utils.startEmbers();
        
        const text = Utils.$('#foundationText');
        const rounds = 4;
        
        for (let i = 0; i < rounds; i++) {
            Utils.$('#foundationRound').textContent = i + 1;
            
            // Breathe in (4s)
            text.textContent = 'breathe in';
            AudioSystem.playPowerIn(1);
            await Utils.wait(4000);
            
            // Hold (4s)
            text.textContent = 'hold';
            await Utils.wait(4000);
            
            // Breathe out (4s)
            text.textContent = 'breathe out';
            AudioSystem.playPowerOut(1);
            await Utils.wait(4000);
            
            // Hold (4s)
            text.textContent = 'hold';
            await Utils.wait(4000);
        }
        
        this.startBuild();
    }
    
    async startBuild() {
        Utils.updateProgress(45);
        Utils.showScreen('buildScreen');
        
        const text = Utils.$('#buildText');
        const rounds = 4;
        
        for (let i = 0; i < rounds; i++) {
            Utils.$('#buildRound').textContent = i + 1;
            
            // Breathe in (3s)
            text.textContent = 'breathe in';
            AudioSystem.playPowerIn(2);
            await Utils.wait(3000);
            
            // Breathe out (3s)
            text.textContent = 'breathe out';
            AudioSystem.playPowerOut(2);
            await Utils.wait(3000);
        }
        
        this.startIgnite();
    }
    
    async startIgnite() {
        Utils.updateProgress(70);
        Utils.showScreen('igniteScreen');
        
        const text = Utils.$('#igniteText');
        const rounds = 6;
        
        for (let i = 0; i < rounds; i++) {
            Utils.$('#igniteRound').textContent = i + 1;
            
            // Power in (2s)
            text.textContent = 'power in';
            AudioSystem.playIgniteIn();
            await Utils.wait(2000);
            
            // Power out (2s)
            text.textContent = 'power out';
            AudioSystem.playIgniteOut();
            await Utils.wait(2000);
        }
        
        this.startLock();
    }
    
    async startLock() {
        Utils.updateProgress(90);
        Utils.showScreen('lockScreen');
        
        const text = Utils.$('#lockText');
        const timer = Utils.$('#lockTimer');
        
        // Deep breath in
        text.textContent = 'deep breath in';
        AudioSystem.playPowerIn(3);
        await Utils.wait(4000);
        
        // Hold and lock
        text.textContent = 'hold and lock';
        AudioSystem.playLockHold();
        
        for (let i = 5; i >= 1; i--) {
            timer.textContent = i;
            await Utils.wait(1000);
        }
        
        timer.textContent = '✓';
        text.textContent = 'forged';
        
        await Utils.wait(1000);
        this.showComplete();
    }
    
    showComplete() {
        Utils.updateProgress(100);
        Utils.stopEmbers();
        
        // Set message and affirmation
        Utils.$('#completeMessage').textContent = Content.getMessage(this.target);
        Utils.$('#affirmation').textContent = Content.getAffirmation(this.target);
        
        Utils.showScreen('completeScreen');
        AudioSystem.playForged();
    }
    
    restart() {
        this.target = null;
        this.isBreathing = false;
        
        // Reset UI
        Utils.$$('.target-btn').forEach(b => b.classList.remove('selected'));
        Utils.$('#foundationRound').textContent = '1';
        Utils.$('#buildRound').textContent = '1';
        Utils.$('#igniteRound').textContent = '1';
        Utils.$('#lockTimer').textContent = '5';
        
        Utils.updateProgress(0);
        Utils.showScreen('titleScreen');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ForgeGame();
});

