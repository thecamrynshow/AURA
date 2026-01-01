// ============================================
// Decompress — Main Game Logic
// ============================================

class DecompressGame {
    constructor() {
        this.carrying = [];
        this.sighCount = 0;
        this.bodyParts = [
            { emoji: '🫁', desc: 'let your shoulders drop', instruction: 'breathe and release tension' },
            { emoji: '🙆', desc: 'unclench your jaw', instruction: 'let it fall open slightly' },
            { emoji: '👐', desc: 'open your hands', instruction: 'release any grip' },
            { emoji: '🦶', desc: 'feel your feet on the ground', instruction: 'you are supported' }
        ];
        this.currentBodyPart = 0;
        this.arriveCount = 0;
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
            this.showAcknowledgeScreen();
        });
        
        // Carry selection
        Utils.$$('.carry-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleCarry(btn);
            });
        });
        
        // Acknowledge continue
        Utils.$('#acknowledgeContinue').addEventListener('click', () => {
            if (this.carrying.length > 0) {
                AudioSystem.playTap();
                this.showReleaseScreen();
            }
        });
        
        // Release circle (click to breathe)
        Utils.$('#releaseCircle').addEventListener('click', () => {
            if (!this.isBreathing) {
                this.doSighBreath();
            }
        });
        
        // Body release
        Utils.$('#bodyRelease').addEventListener('click', () => {
            this.releaseBodyPart();
        });
        
        // Close door
        Utils.$('#closeDoor').addEventListener('click', () => {
            this.closeDoor();
        });
        
        // Intention selection
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
    
    showAcknowledgeScreen() {
        Utils.updateProgress(1);
        Utils.showScreen('acknowledgeScreen');
        Utils.setSunPosition(null);
    }
    
    toggleCarry(btn) {
        btn.classList.toggle('selected');
        
        const carry = btn.dataset.carry;
        if (this.carrying.includes(carry)) {
            this.carrying = this.carrying.filter(c => c !== carry);
        } else {
            this.carrying.push(carry);
        }
        
        AudioSystem.playTap();
        
        // Enable continue button
        Utils.$('#acknowledgeContinue').disabled = this.carrying.length === 0;
    }
    
    showReleaseScreen() {
        Utils.updateProgress(2);
        Utils.showScreen('releaseScreen');
        Utils.setSunPosition('setting');
        
        this.sighCount = 0;
        Utils.$('#sighCount').textContent = '0';
    }
    
    async doSighBreath() {
        if (this.sighCount >= 5) return;
        this.isBreathing = true;
        
        const circle = Utils.$('#releaseCircle');
        const text = Utils.$('#releaseText');
        
        // Inhale
        text.textContent = 'breathe in deep';
        circle.classList.add('inhale');
        circle.classList.remove('exhale');
        AudioSystem.playSighIn();
        await Utils.wait(3000);
        
        // Exhale with sigh
        text.textContent = 'sigh it out...';
        circle.classList.add('exhale');
        circle.classList.remove('inhale');
        AudioSystem.playSighOut();
        await Utils.wait(4000);
        
        this.sighCount++;
        Utils.$('#sighCount').textContent = this.sighCount;
        
        circle.classList.remove('inhale', 'exhale');
        text.textContent = 'breathe in deep';
        
        this.isBreathing = false;
        
        if (this.sighCount >= 5) {
            text.textContent = 'released ✓';
            await Utils.wait(1000);
            this.showBodyScreen();
        }
    }
    
    showBodyScreen() {
        Utils.updateProgress(3);
        this.currentBodyPart = 0;
        this.updateBodyPart();
        Utils.showScreen('bodyScreen');
    }
    
    updateBodyPart() {
        const part = this.bodyParts[this.currentBodyPart];
        Utils.$('.part-emoji').textContent = part.emoji;
        Utils.$('#bodyDesc').textContent = part.desc;
        Utils.$('#bodyInstruction').textContent = part.instruction;
    }
    
    async releaseBodyPart() {
        AudioSystem.playTap();
        
        this.currentBodyPart++;
        
        if (this.currentBodyPart >= this.bodyParts.length) {
            Utils.$('#bodyRelease').textContent = 'complete ✓';
            Utils.$('#bodyRelease').disabled = true;
            await Utils.wait(800);
            this.showTransitionScreen();
        } else {
            this.updateBodyPart();
        }
    }
    
    showTransitionScreen() {
        Utils.updateProgress(4);
        Utils.showScreen('transitionScreen');
    }
    
    async closeDoor() {
        AudioSystem.playDoorClose();
        
        const door = Utils.$('#door');
        door.classList.add('closed');
        
        Utils.$('#transitionPrompt').textContent = 'work is closed';
        Utils.$('#closeDoor').textContent = 'closed ✓';
        Utils.$('#closeDoor').disabled = true;
        
        await Utils.wait(1500);
        this.showArriveScreen();
    }
    
    showArriveScreen() {
        Utils.updateProgress(5);
        Utils.showScreen('arriveScreen');
        Utils.setSunPosition('set');
        
        this.arriveCount = 0;
        Utils.$('#arriveCount').textContent = '0';
        
        // Start breathing automatically
        this.startArriveBreathing();
    }
    
    async startArriveBreathing() {
        const text = Utils.$('#arriveText');
        
        for (let i = 0; i < 3; i++) {
            text.textContent = 'breathe in slowly';
            AudioSystem.playArriveBreath();
            await Utils.wait(4000);
            
            text.textContent = 'breathe out slowly';
            await Utils.wait(4000);
            
            this.arriveCount++;
            Utils.$('#arriveCount').textContent = this.arriveCount;
        }
        
        text.textContent = 'you are here ✓';
        await Utils.wait(1000);
        this.showCompleteScreen();
    }
    
    showCompleteScreen() {
        Utils.showScreen('completeScreen');
        AudioSystem.playComplete();
    }
    
    selectIntention(btn) {
        Utils.$$('.intention-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        AudioSystem.playTap();
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DecompressGame();
});

