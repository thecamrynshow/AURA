// ============================================
// Partners — Couple Co-Regulation
// Sync your nervous systems
// ============================================

class PartnersSession {
    constructor() {
        this.isHost = false;
        this.mode = null;
        this.sessionActive = false;
        this.sync = 0;
        this.peakSync = 0;
        this.breathCount = 0;
        this.startTime = null;
        this.audioContext = null;
        
        this.modes = {
            'connect': {
                name: 'Just Connect',
                duration: 300,
                inhale: 4,
                exhale: 4,
                guidance: [
                    "Face each other...",
                    "Look into their eyes...",
                    "Let everything else fade...",
                    "Just the two of you...",
                    "Breathe together...",
                    "Feel your connection..."
                ]
            },
            'before-talk': {
                name: 'Before a Conversation',
                duration: 180,
                inhale: 4,
                exhale: 6,
                guidance: [
                    "We're about to talk...",
                    "Let's get grounded first...",
                    "I want to hear you...",
                    "I want you to hear me...",
                    "From a calm place...",
                    "We can do this together..."
                ]
            },
            'after-conflict': {
                name: 'After Conflict',
                duration: 240,
                inhale: 4,
                exhale: 7,
                guidance: [
                    "That was hard...",
                    "But we're still here...",
                    "Let's come back to each other...",
                    "Slow breaths...",
                    "We're on the same team...",
                    "Reconnecting now..."
                ]
            },
            'intimacy': {
                name: 'Build Intimacy',
                duration: 420,
                inhale: 5,
                exhale: 5,
                guidance: [
                    "Come closer...",
                    "Feel the warmth between you...",
                    "Let your guard down...",
                    "Be fully present...",
                    "I see you...",
                    "You see me..."
                ]
            },
            'stress': {
                name: 'Decompress Together',
                duration: 300,
                inhale: 4,
                exhale: 8,
                guidance: [
                    "The day is done...",
                    "Let it go together...",
                    "You're home now...",
                    "Safe with each other...",
                    "Release the tension...",
                    "Just us, just now..."
                ]
            }
        };
        
        this.init();
    }
    
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    init() {
        this.bindEvents();
        this.generateCode();
    }
    
    generateCode() {
        const code = 'SYNC-' + Math.floor(1000 + Math.random() * 9000);
        this.$('#sessionCode').textContent = code;
    }
    
    bindEvents() {
        // Welcome screen
        this.$('#createBtn').addEventListener('click', () => this.createSession());
        this.$('#joinBtn').addEventListener('click', () => this.joinSession());
        
        // Waiting room
        this.$('#copyBtn').addEventListener('click', () => this.copyCode());
        this.$('#cancelBtn').addEventListener('click', () => this.showScreen('welcomeScreen'));
        
        // Mode selection
        this.$$('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startSession(mode);
            });
        });
        
        // Session
        this.$('#endBtn').addEventListener('click', () => this.endSession());
        
        // Completion
        this.$('#doneBtn').addEventListener('click', () => {
            this.showScreen('welcomeScreen');
            this.generateCode();
        });
        this.$('#againBtn').addEventListener('click', () => this.showScreen('modeScreen'));
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
    
    createSession() {
        this.isHost = true;
        this.showScreen('waitingScreen');
        
        // Simulate partner joining after 2 seconds for demo
        setTimeout(() => {
            if (this.$('#waitingScreen').classList.contains('active')) {
                this.showScreen('modeScreen');
            }
        }, 2500);
    }
    
    joinSession() {
        const code = this.$('#joinCode').value.trim().toUpperCase();
        if (code.length < 4) return;
        
        this.isHost = false;
        // In real app, would connect to session
        // For demo, go straight to mode selection
        this.showScreen('modeScreen');
    }
    
    copyCode() {
        const code = this.$('#sessionCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.$('#copyBtn').textContent = 'Copied!';
            setTimeout(() => {
                this.$('#copyBtn').textContent = 'Copy Code';
            }, 2000);
        });
    }
    
    startSession(modeKey) {
        this.mode = this.modes[modeKey];
        this.sessionActive = true;
        this.sync = 0;
        this.peakSync = 0;
        this.breathCount = 0;
        this.startTime = Date.now();
        
        this.initAudio();
        this.showScreen('sessionScreen');
        
        this.$('#modeLabel').textContent = this.mode.name;
        
        this.runSession();
    }
    
    async runSession() {
        const guidance = this.$('#guidanceText');
        const breathCue = this.$('#breathCue');
        const leftOrb = this.$('#leftOrb');
        const rightOrb = this.$('#rightOrb');
        const bridgeLine = this.$('#bridgeLine');
        const syncHeart = this.$('#syncHeart');
        const syncFill = this.$('#syncFill');
        const syncValue = this.$('#syncValue');
        const timer = this.$('#sessionTimer');
        
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
        const guidanceInterval = setInterval(showGuidance, 8000);
        
        // Timer
        const timerInterval = setInterval(() => {
            if (!this.sessionActive) {
                clearInterval(timerInterval);
                return;
            }
            
            const remaining = duration - elapsed;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
        
        // Breathing cycle
        const breathCycle = async () => {
            if (!this.sessionActive) return;
            
            const inhale = this.mode.inhale * 1000;
            const exhale = this.mode.exhale * 1000;
            
            // Inhale
            breathCue.textContent = 'Breathe In...';
            leftOrb.classList.remove('exhale');
            leftOrb.classList.add('inhale');
            rightOrb.classList.remove('exhale');
            rightOrb.classList.add('inhale');
            this.playTone(220, inhale / 1000);
            
            await this.wait(inhale);
            if (!this.sessionActive) return;
            
            // Exhale
            breathCue.textContent = 'Breathe Out...';
            leftOrb.classList.remove('inhale');
            leftOrb.classList.add('exhale');
            rightOrb.classList.remove('inhale');
            rightOrb.classList.add('exhale');
            this.playTone(165, exhale / 1000);
            
            this.breathCount++;
            
            // Increase sync over time
            this.sync = Math.min(100, this.sync + 4 + Math.random() * 4);
            this.peakSync = Math.max(this.peakSync, this.sync);
            
            syncFill.style.width = this.sync + '%';
            syncValue.textContent = Math.round(this.sync) + '%';
            
            // Visual feedback
            if (this.sync > 50) {
                bridgeLine.classList.add('strong');
            }
            if (this.sync > 70) {
                syncHeart.classList.add('visible');
            }
            
            await this.wait(exhale);
            if (!this.sessionActive) return;
            
            elapsed += (inhale + exhale) / 1000;
            
            if (elapsed < duration && this.sessionActive) {
                breathCycle();
            } else {
                clearInterval(guidanceInterval);
                clearInterval(timerInterval);
                this.completeSession();
            }
        };
        
        // Start after intro
        await this.wait(3000);
        breathCycle();
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    completeSession() {
        this.sessionActive = false;
        
        // Calculate duration
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        this.$('#statDuration').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.$('#statSync').textContent = Math.round(this.peakSync) + '%';
        this.$('#statBreaths').textContent = this.breathCount;
        
        const messages = [
            "Your nervous systems connected.",
            "You found each other again.",
            "That was beautiful.",
            "Closer than before."
        ];
        this.$('#completeMessage').textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // Celebration
        this.playTone(392, 0.3);
        setTimeout(() => this.playTone(523.25, 0.3), 150);
        setTimeout(() => this.playTone(659.25, 0.5), 300);
        
        this.showScreen('completeScreen');
    }
    
    endSession() {
        this.sessionActive = false;
        
        this.$('#leftOrb').classList.remove('inhale', 'exhale');
        this.$('#rightOrb').classList.remove('inhale', 'exhale');
        this.$('#bridgeLine').classList.remove('strong');
        this.$('#syncHeart').classList.remove('visible');
        
        this.completeSession();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.partners = new PartnersSession();
});

