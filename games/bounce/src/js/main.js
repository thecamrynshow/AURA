// ============================================
// Bounce — Main Game Logic
// ============================================

class BounceGame {
    constructor() {
        this.rejectionType = null;
        this.currentStep = 0;
        this.truths = [];
        this.currentTruthIndex = 0;
        this.bounceCount = 0;
        this.requiredBounces = 10;
        this.holdTone = null;
        this.holdProgress = 0;
        this.holdInterval = null;
        this.forwardAction = null;
        
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
            this.showWhatScreen();
        });
        
        // Rejection type selection
        Utils.$$('.rejection-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectRejectionType(btn);
            });
        });
        
        // Feel it - hold interaction
        const feelingBall = Utils.$('#feelingBall');
        feelingBall.addEventListener('mousedown', () => this.startHold());
        feelingBall.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startHold();
        });
        feelingBall.addEventListener('mouseup', () => this.endHold());
        feelingBall.addEventListener('mouseleave', () => this.endHold());
        feelingBall.addEventListener('touchend', () => this.endHold());
        feelingBall.addEventListener('touchcancel', () => this.endHold());
        
        // Ground tap
        Utils.$('#groundTap').addEventListener('click', () => {
            AudioSystem.playTap();
            this.completeGround();
        });
        
        // Truth card swipe
        const truthCard = Utils.$('#truthCard');
        let startX = 0;
        truthCard.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        truthCard.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) {
                this.nextTruth();
            }
        });
        truthCard.addEventListener('click', () => {
            this.nextTruth();
        });
        
        // Perspective continue
        Utils.$('#perspectiveContinue').addEventListener('click', () => {
            AudioSystem.playTap();
            this.showBounceScreen();
        });
        
        // Bounce ball
        Utils.$('#activeBall').addEventListener('click', () => {
            this.doBounce();
        });
        Utils.$('#activeBall').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.doBounce();
        });
        
        // Forward options
        Utils.$$('.forward-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectForward(btn);
            });
        });
        
        // Complete actions
        Utils.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../../platform/games/';
        });
        Utils.$('#againBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    showWhatScreen() {
        this.currentStep = 1;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('whatScreen');
    }
    
    selectRejectionType(btn) {
        Utils.$$('.rejection-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.rejectionType = btn.dataset.type;
        this.truths = Content.getTruths(this.rejectionType);
        
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showFeelScreen();
        }, 300);
    }
    
    showFeelScreen() {
        this.currentStep = 2;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('feelScreen');
    }
    
    startHold() {
        const ball = Utils.$('#feelingBall');
        ball.classList.add('holding');
        
        this.holdProgress = 0;
        this.holdTone = AudioSystem.startHoldTone();
        
        Utils.$('#feelingPrompt').textContent = 'hold it...';
        
        this.holdInterval = setInterval(() => {
            this.holdProgress += 2;
            Utils.$('#holdFill').style.width = `${this.holdProgress}%`;
            
            if (this.holdProgress >= 100) {
                this.completeHold();
            }
        }, 50);
    }
    
    endHold() {
        const ball = Utils.$('#feelingBall');
        ball.classList.remove('holding');
        
        if (this.holdInterval) {
            clearInterval(this.holdInterval);
            this.holdInterval = null;
        }
        
        if (this.holdTone) {
            AudioSystem.stopHoldTone(this.holdTone);
            this.holdTone = null;
        }
        
        // Reset if not complete
        if (this.holdProgress < 100) {
            this.holdProgress = 0;
            Utils.$('#holdFill').style.width = '0%';
            Utils.$('#feelingPrompt').textContent = 'tap and hold the feeling';
        }
    }
    
    completeHold() {
        if (this.holdInterval) {
            clearInterval(this.holdInterval);
            this.holdInterval = null;
        }
        
        if (this.holdTone) {
            AudioSystem.stopHoldTone(this.holdTone);
            this.holdTone = null;
        }
        
        AudioSystem.playSuccess();
        
        Utils.$('#feelingPrompt').textContent = 'acknowledged ✓';
        Utils.$('#feelingBall').classList.remove('holding');
        
        setTimeout(() => {
            this.showGroundScreen();
        }, 1000);
    }
    
    showGroundScreen() {
        this.currentStep = 2;
        Utils.updateProgress(this.currentStep);
        
        const grounding = Content.getGrounding();
        Utils.$('#groundDesc').textContent = grounding.desc;
        Utils.$('#groundPrompt').textContent = grounding.prompt;
        
        Utils.showScreen('groundScreen');
        
        // Animate feet
        setTimeout(() => {
            Utils.$('#footLeft').classList.add('active');
        }, 300);
        setTimeout(() => {
            Utils.$('#footRight').classList.add('active');
        }, 500);
    }
    
    completeGround() {
        Utils.$('#groundTap').textContent = 'grounded ✓';
        Utils.$('#groundTap').disabled = true;
        
        setTimeout(() => {
            this.showPerspectiveScreen();
        }, 500);
    }
    
    showPerspectiveScreen() {
        this.currentStep = 3;
        Utils.updateProgress(this.currentStep);
        
        this.currentTruthIndex = 0;
        this.updateTruthCard();
        
        Utils.showScreen('perspectiveScreen');
    }
    
    updateTruthCard() {
        const card = Utils.$('#truthCard');
        const text = Utils.$('#truthText');
        
        // Animate out
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            text.textContent = this.truths[this.currentTruthIndex];
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, 200);
    }
    
    nextTruth() {
        if (this.currentTruthIndex < this.truths.length - 1) {
            this.currentTruthIndex++;
            AudioSystem.playTap();
            this.updateTruthCard();
        }
    }
    
    showBounceScreen() {
        this.currentStep = 4;
        Utils.updateProgress(this.currentStep);
        
        this.bounceCount = 0;
        Utils.$('#bounceCount').textContent = '0';
        
        Utils.showScreen('bounceScreen');
    }
    
    doBounce() {
        if (this.bounceCount >= this.requiredBounces) return;
        
        const ball = Utils.$('#activeBall');
        
        if (ball.classList.contains('bouncing')) return;
        
        ball.classList.add('bouncing');
        this.bounceCount++;
        
        // Increase intensity as you go
        const intensity = 0.5 + (this.bounceCount / this.requiredBounces) * 0.5;
        AudioSystem.playBounce(intensity);
        
        Utils.$('#bounceCount').textContent = this.bounceCount;
        
        setTimeout(() => {
            ball.classList.remove('bouncing');
            
            if (this.bounceCount >= this.requiredBounces) {
                AudioSystem.playSuccess();
                setTimeout(() => {
                    this.showForwardScreen();
                }, 500);
            }
        }, 400);
    }
    
    showForwardScreen() {
        this.currentStep = 4;
        Utils.updateProgress(this.currentStep);
        Utils.showScreen('forwardScreen');
    }
    
    selectForward(btn) {
        Utils.$$('.forward-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        this.forwardAction = btn.dataset.action;
        AudioSystem.playSelect();
        
        setTimeout(() => {
            this.showCompleteScreen();
        }, 500);
    }
    
    showCompleteScreen() {
        this.currentStep = 5;
        Utils.updateProgress(this.currentStep);
        
        // Set affirmation based on rejection type
        const affirmation = Content.getAffirmation(this.rejectionType);
        Utils.$('#affirmation').textContent = affirmation;
        
        Utils.showScreen('completeScreen');
        AudioSystem.playSuccess();
    }
    
    restart() {
        this.rejectionType = null;
        this.currentStep = 0;
        this.truths = [];
        this.currentTruthIndex = 0;
        this.bounceCount = 0;
        this.holdProgress = 0;
        this.forwardAction = null;
        
        // Reset UI
        Utils.$$('.rejection-btn').forEach(b => b.classList.remove('selected'));
        Utils.$('#holdFill').style.width = '0%';
        Utils.$('#feelingPrompt').textContent = 'tap and hold the feeling';
        Utils.$('#groundTap').textContent = 'i feel it';
        Utils.$('#groundTap').disabled = false;
        Utils.$('#footLeft').classList.remove('active');
        Utils.$('#footRight').classList.remove('active');
        Utils.$$('.forward-btn').forEach(b => b.classList.remove('selected'));
        
        Utils.updateProgress(0);
        Utils.showScreen('titleScreen');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.game = new BounceGame();
});

