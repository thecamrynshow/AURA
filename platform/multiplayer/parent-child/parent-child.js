// ============================================
// Parent + Child — Attachment Co-Regulation
// Breathe together, regulate together
// ============================================

class ParentChildSession {
    constructor() {
        this.role = null;
        this.mode = null;
        this.sessionActive = false;
        this.breathCount = 0;
        this.connection = 0;
        this.peakConnection = 0;
        this.audioContext = null;
        
        this.modes = {
            calm: {
                name: 'Calm Together',
                duration: 180,
                inhale: 4,
                exhale: 6,
                guidance: [
                    "Sit close together...",
                    "Feel each other's presence...",
                    "Let's slow down together...",
                    "Breathe with me...",
                    "You're safe here...",
                    "We're doing this together..."
                ]
            },
            connect: {
                name: 'Connect',
                duration: 300,
                inhale: 4,
                exhale: 4,
                guidance: [
                    "Look into each other's eyes...",
                    "Notice how you feel right now...",
                    "Let's sync our breaths...",
                    "In... and out... together...",
                    "Feel our connection growing...",
                    "This moment is just for us..."
                ]
            },
            bedtime: {
                name: 'Bedtime',
                duration: 420,
                inhale: 4,
                exhale: 7,
                guidance: [
                    "The day is done...",
                    "Let's get sleepy together...",
                    "Slow, soft breaths...",
                    "Your body is getting heavy...",
                    "Safe and cozy...",
                    "Drifting off together..."
                ]
            },
            bigfeel: {
                name: 'Big Feelings',
                duration: 180,
                inhale: 3,
                exhale: 5,
                guidance: [
                    "I'm here with you...",
                    "It's okay to feel this...",
                    "Let's breathe through it...",
                    "In... and out...",
                    "The feeling is moving...",
                    "You're doing so well..."
                ]
            }
        };
        
        this.init();
    }
    
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        this.$('#parentBtn').addEventListener('click', () => this.selectRole('parent'));
        this.$('#childBtn').addEventListener('click', () => this.selectRole('child'));
        this.$('#backToRoleBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$('#childBackBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$('#endSessionBtn').addEventListener('click', () => this.endSession());
        this.$('#doneBtn').addEventListener('click', () => this.showScreen('roleScreen'));
        this.$('#againBtn').addEventListener('click', () => {
            if (this.role === 'parent') {
                this.showScreen('parentSetupScreen');
            } else {
                this.showScreen('roleScreen');
            }
        });
        
        this.$$('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startSession(mode);
            });
        });
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not available');
        }
    }
    
    playTone(freq, duration) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    showScreen(screenId) {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$(`#${screenId}`).classList.add('active');
    }
    
    selectRole(role) {
        this.role = role;
        
        if (role === 'parent') {
            this.showScreen('parentSetupScreen');
        } else {
            // In a real app, child would wait for parent to start
            // For demo, we'll simulate parent starting
            this.showScreen('childWaitingScreen');
            
            // Auto-start after 2 seconds for demo
            setTimeout(() => {
                if (this.$('#childWaitingScreen').classList.contains('active')) {
                    this.startSession('connect');
                }
            }, 2000);
        }
    }
    
    startSession(modeKey) {
        this.mode = this.modes[modeKey];
        this.sessionActive = true;
        this.breathCount = 0;
        this.connection = 0;
        this.peakConnection = 0;
        
        this.initAudio();
        this.showScreen('sessionScreen');
        
        this.$('#sessionMode').textContent = this.mode.name;
        
        // Start the experience
        this.runSession();
    }
    
    async runSession() {
        const guidance = this.$('#guidanceText');
        const breathInst = this.$('#breathInstruction');
        const parentOrb = this.$('#parentOrb');
        const childOrb = this.$('#childOrb');
        const connectionLine = this.$('#connectionLine');
        const connectionHeart = this.$('#connectionHeart');
        const connectionMeter = this.$('#connectionMeter');
        const connectionValue = this.$('#connectionValue');
        
        let guidanceIndex = 0;
        let elapsed = 0;
        const duration = this.mode.duration;
        
        // Guidance rotation
        const showGuidance = () => {
            if (!this.sessionActive) return;
            
            guidance.style.opacity = '0';
            setTimeout(() => {
                guidance.textContent = this.mode.guidance[guidanceIndex % this.mode.guidance.length];
                guidance.style.opacity = '1';
                guidanceIndex++;
            }, 300);
        };
        
        showGuidance();
        const guidanceInterval = setInterval(showGuidance, 10000);
        
        // Breathing cycle
        const breathCycle = async () => {
            if (!this.sessionActive) return;
            
            const inhale = this.mode.inhale * 1000;
            const exhale = this.mode.exhale * 1000;
            
            // Inhale
            breathInst.textContent = 'Breathe In...';
            parentOrb.classList.remove('exhale');
            parentOrb.classList.add('inhale');
            childOrb.classList.remove('exhale');
            childOrb.classList.add('inhale');
            this.playTone(220, inhale / 1000);
            
            await this.wait(inhale);
            if (!this.sessionActive) return;
            
            // Exhale
            breathInst.textContent = 'Breathe Out...';
            parentOrb.classList.remove('inhale');
            parentOrb.classList.add('exhale');
            childOrb.classList.remove('inhale');
            childOrb.classList.add('exhale');
            this.playTone(165, exhale / 1000);
            
            this.breathCount++;
            
            // Increase connection over time
            this.connection = Math.min(100, this.connection + 5 + Math.random() * 5);
            this.peakConnection = Math.max(this.peakConnection, this.connection);
            
            connectionMeter.style.width = this.connection + '%';
            connectionValue.textContent = Math.round(this.connection) + '%';
            
            // Visual feedback for connection
            if (this.connection > 50) {
                connectionLine.classList.add('strong');
            }
            if (this.connection > 70) {
                connectionHeart.classList.add('visible');
            }
            
            await this.wait(exhale);
            if (!this.sessionActive) return;
            
            elapsed += (inhale + exhale) / 1000;
            
            if (elapsed < duration && this.sessionActive) {
                breathCycle();
            } else {
                clearInterval(guidanceInterval);
                this.completeSession();
            }
        };
        
        // Start after initial guidance
        await this.wait(3000);
        breathCycle();
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    completeSession() {
        this.sessionActive = false;
        
        this.$('#statBreaths').textContent = this.breathCount;
        this.$('#statConnection').textContent = Math.round(this.peakConnection) + '%';
        
        const messages = [
            "You regulated together.",
            "Your nervous systems synced.",
            "You created safety together.",
            "That was beautiful."
        ];
        this.$('#completeMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // Celebration sound
        this.playTone(392, 0.3);
        setTimeout(() => this.playTone(523.25, 0.3), 150);
        setTimeout(() => this.playTone(659.25, 0.5), 300);
        
        this.showScreen('completeScreen');
    }
    
    endSession() {
        this.sessionActive = false;
        this.$('#parentOrb').classList.remove('inhale', 'exhale');
        this.$('#childOrb').classList.remove('inhale', 'exhale');
        this.$('#connectionLine').classList.remove('strong');
        this.$('#connectionHeart').classList.remove('visible');
        
        this.completeSession();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.parentChild = new ParentChildSession();
});


