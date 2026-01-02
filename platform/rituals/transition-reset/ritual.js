// ============================================
// Transition Reset Ritual
// Clean exits, clean entrances
// ============================================

class TransitionResetRitual {
    constructor() {
        this.audioContext = null;
        this.audioEnabled = true;
        this.startTime = null;
        this.timerInterval = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    $(selector) { return document.querySelector(selector); }
    $$(selector) { return document.querySelectorAll(selector); }
    
    bindEvents() {
        this.$('#beginBtn').addEventListener('click', () => {
            this.initAudio();
            this.startRitual();
        });
        
        this.$('#audioBtn').addEventListener('click', () => {
            this.toggleAudio();
        });
        
        this.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
        
        this.$('#repeatBtn').addEventListener('click', () => {
            this.restart();
        });
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not available');
        }
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.$('#audioBtn').classList.toggle('muted', !this.audioEnabled);
    }
    
    showScreen(screenId) {
        this.$$('.screen').forEach(s => s.classList.remove('active'));
        this.$(`#${screenId}`).classList.add('active');
    }
    
    updateProgress(percent) {
        this.$('#progressFill').style.width = `${percent}%`;
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            this.$('#progressTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    playTone(freq, duration) {
        if (!this.audioContext || !this.audioEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    playChime() {
        [392, 523.25, 659.25].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.5), i * 120);
        });
    }
    
    async startRitual() {
        this.startTimer();
        this.playChime();
        
        await this.wait(500);
        await this.runRelease();
        await this.runNeutral();
        await this.runIntention();
        await this.runArrive();
        await this.complete();
    }
    
    async runRelease() {
        this.updateProgress(10);
        this.showScreen('releaseScreen');
        this.$('#ambientBg').classList.add('releasing');
        
        const textEl = this.$('#releaseText');
        const orb = this.$('#releaseOrb');
        
        const prompts = [
            { text: "Let go of where you've been...", wait: 3000 },
            { text: "Whatever happened before this moment...", wait: 3000 },
            { text: "It's complete now.", wait: 3000 },
            { text: "Let it dissolve...", wait: 2000, fade: true },
            { text: "Release.", wait: 3000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            
            if (prompt.fade) {
                orb.classList.add('fading');
            }
            
            await this.wait(prompt.wait);
        }
        
        this.updateProgress(25);
    }
    
    async runNeutral() {
        this.updateProgress(35);
        this.showScreen('neutralScreen');
        this.$('#ambientBg').classList.remove('releasing');
        this.$('#ambientBg').classList.add('neutral');
        
        const textEl = this.$('#neutralText');
        const dot = this.$('#neutralDot');
        const counter = this.$('#breathCount');
        
        const intro = [
            { text: "Find the space between...", wait: 3000 },
            { text: "Not then. Not next. Just now.", wait: 3000 },
            { text: "Four neutral breaths.", wait: 2000 }
        ];
        
        for (const prompt of intro) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            await this.wait(prompt.wait);
        }
        
        textEl.textContent = "Breathe...";
        
        for (let i = 0; i < 4; i++) {
            counter.textContent = i + 1;
            
            // Inhale
            dot.classList.add('pulse');
            this.playTone(220, 3);
            await this.wait(3000);
            
            // Exhale
            dot.classList.remove('pulse');
            this.playTone(180, 3);
            await this.wait(3000);
        }
        
        textEl.textContent = "Centered.";
        await this.wait(1500);
        
        this.updateProgress(55);
    }
    
    async runIntention() {
        this.updateProgress(60);
        this.showScreen('intentionScreen');
        
        const textEl = this.$('#intentionText');
        
        const prompts = [
            { text: "What does the next context need from you?", wait: 4000 },
            { text: "Not what you have to do...", wait: 3000 },
            { text: "But who you want to be.", wait: 4000 },
            { text: "Choose one word...", wait: 5000 },
            { text: "Hold it as you transition.", wait: 3000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            await this.wait(prompt.wait);
        }
        
        this.updateProgress(75);
    }
    
    async runArrive() {
        this.updateProgress(80);
        this.showScreen('arriveScreen');
        this.$('#ambientBg').classList.remove('neutral');
        this.$('#ambientBg').classList.add('arriving');
        
        const textEl = this.$('#arriveText');
        const orb = this.$('#arriveOrb');
        const rings = this.$$('.arrive-ring');
        
        const prompts = [
            { text: "Step fully into this moment...", wait: 3000 },
            { text: "You are here now.", wait: 3000, showRings: true },
            { text: "Fresh. Present. Ready.", wait: 3000, showOrb: true },
            { text: "Arrive.", wait: 2000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            
            if (prompt.showRings) {
                rings.forEach(r => r.classList.add('visible'));
            }
            if (prompt.showOrb) {
                orb.classList.add('visible');
            }
            
            await this.wait(prompt.wait);
        }
        
        this.updateProgress(95);
    }
    
    async complete() {
        this.updateProgress(100);
        this.stopTimer();
        this.showScreen('completeScreen');
        this.playChime();
    }
    
    restart() {
        this.$('#ambientBg').classList.remove('releasing', 'neutral', 'arriving');
        this.$('#releaseOrb').classList.remove('fading');
        this.$('#neutralDot').classList.remove('pulse');
        this.$('#arriveOrb').classList.remove('visible');
        this.$$('.arrive-ring').forEach(r => r.classList.remove('visible'));
        this.updateProgress(0);
        this.$('#progressTime').textContent = '0:00';
        this.showScreen('welcomeScreen');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ritual = new TransitionResetRitual();
});


