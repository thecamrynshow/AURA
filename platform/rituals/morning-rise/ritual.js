// ============================================
// Morning Rise Ritual
// Guided audio/text experience
// ============================================

class MorningRiseRitual {
    constructor() {
        this.audioContext = null;
        this.audioEnabled = true;
        this.startTime = null;
        this.timerInterval = null;
        this.intention = 'present';
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    // DOM helpers
    $(selector) {
        return document.querySelector(selector);
    }
    
    $$(selector) {
        return document.querySelectorAll(selector);
    }
    
    bindEvents() {
        // Begin button
        this.$('#beginBtn').addEventListener('click', () => {
            this.initAudio();
            this.startRitual();
        });
        
        // Audio toggle
        this.$('#audioBtn').addEventListener('click', () => {
            this.toggleAudio();
        });
        
        // Done button
        this.$('#doneBtn').addEventListener('click', () => {
            window.location.href = '../index.html';
        });
        
        // Repeat button
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
        this.$$('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
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
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Audio
    playTone(freq, duration, type = 'sine') {
        if (!this.audioContext || !this.audioEnabled) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }
    
    playChime() {
        if (!this.audioContext || !this.audioEnabled) return;
        
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.6), i * 150);
        });
    }
    
    playBreathIn() {
        this.playTone(200, 4);
    }
    
    playBreathOut() {
        this.playTone(150, 5);
    }
    
    // Ritual Flow
    async startRitual() {
        this.startTimer();
        this.$('#ambientBg').classList.add('awakening');
        this.playChime();
        
        await this.wait(500);
        await this.runBodyScan();
        await this.runBreathActivation();
        await this.runIntention();
        await this.runEnergy();
        await this.complete();
    }
    
    async runBodyScan() {
        this.updateProgress(10);
        this.showScreen('bodyScanScreen');
        
        const textEl = this.$('#bodyScanText');
        const scanLine = this.$('#scanLine');
        
        const prompts = [
            { text: "Before you move, simply notice...", wait: 3000 },
            { text: "How does your body feel right now?", wait: 4000 },
            { text: "Notice any areas of tension...", wait: 4000 },
            { text: "And any areas of ease...", wait: 4000 },
            { text: "Let's scan from head to toe...", wait: 2000, scan: true },
            { text: "Notice your head... your face...", wait: 4000 },
            { text: "Your neck... your shoulders...", wait: 4000 },
            { text: "Your chest... your belly...", wait: 4000 },
            { text: "Your hips... your legs... your feet...", wait: 4000 },
            { text: "Your whole body, awake and here.", wait: 3000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            
            if (prompt.scan) {
                scanLine.classList.add('scanning');
            }
            
            await this.wait(prompt.wait);
        }
        
        this.updateProgress(25);
    }
    
    async runBreathActivation() {
        this.updateProgress(30);
        this.showScreen('breathScreen');
        this.$('#ambientBg').classList.add('bright');
        
        const textEl = this.$('#breathText');
        const circle = this.$('#breathCircle');
        const instruction = this.$('#breathInstruction');
        const counter = this.$('#breathCount');
        
        const intro = [
            { text: "Now let's wake up the body with breath...", wait: 3000 },
            { text: "We'll take 6 activating breaths.", wait: 2000 },
            { text: "Inhale through the nose, exhale through the mouth.", wait: 3000 }
        ];
        
        for (const prompt of intro) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            await this.wait(prompt.wait);
        }
        
        textEl.textContent = "Follow the circle...";
        
        for (let i = 0; i < 6; i++) {
            counter.textContent = i + 1;
            
            // Inhale
            instruction.textContent = "breathe in";
            circle.classList.remove('exhale');
            circle.classList.add('inhale');
            this.playBreathIn();
            await this.wait(4000);
            
            // Exhale
            instruction.textContent = "breathe out";
            circle.classList.remove('inhale');
            circle.classList.add('exhale');
            this.playBreathOut();
            await this.wait(5000);
        }
        
        circle.classList.remove('inhale', 'exhale');
        instruction.textContent = "✓";
        textEl.textContent = "Beautiful. Feel the energy.";
        await this.wait(2000);
        
        this.updateProgress(55);
    }
    
    async runIntention() {
        this.updateProgress(60);
        this.showScreen('intentionScreen');
        
        const textEl = this.$('#intentionText');
        
        const prompts = [
            { text: "How do you want to meet this day?", wait: 4000 },
            { text: "Not what you need to do...", wait: 3000 },
            { text: "But how you want to be.", wait: 4000 },
            { text: "Choose a word that resonates...", wait: 5000 },
            { text: "Hold it gently. Let it be your anchor.", wait: 5000 },
            { text: "Today, I choose to be...", wait: 4000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            await this.wait(prompt.wait);
        }
        
        // Pick a random intention for display
        const intentions = ['present', 'patient', 'open', 'focused', 'kind', 'grateful'];
        this.intention = intentions[Math.floor(Math.random() * intentions.length)];
        
        this.updateProgress(75);
    }
    
    async runEnergy() {
        this.updateProgress(80);
        this.showScreen('energyScreen');
        
        const textEl = this.$('#energyText');
        const meter = this.$('#meterLevel');
        const note = this.$('#energyNote');
        
        const prompts = [
            { text: "Finally, let's calibrate your energy...", wait: 3000 },
            { text: "What level of activation do you need today?", wait: 4000, level: 'low' },
            { text: "Not too sleepy...", wait: 3000, level: 'mid' },
            { text: "Not too wired...", wait: 3000, level: 'high' },
            { text: "Find your optimal zone.", wait: 4000, level: 'mid' },
            { text: "Take one more breath to lock it in.", wait: 4000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            
            if (prompt.level) {
                meter.classList.remove('low', 'mid', 'high');
                meter.classList.add(prompt.level);
            }
            
            await this.wait(prompt.wait);
        }
        
        note.textContent = "You're calibrated. You're ready.";
        await this.wait(2000);
        
        this.updateProgress(95);
    }
    
    async complete() {
        this.updateProgress(100);
        this.stopTimer();
        this.showScreen('completeScreen');
        
        this.$('#reminderText').textContent = `"Today, I choose to be ${this.intention}."`;
        
        this.playChime();
    }
    
    restart() {
        // Reset everything
        this.$('#ambientBg').classList.remove('awakening', 'bright');
        this.$('#scanLine').classList.remove('scanning');
        this.$('#breathCircle').classList.remove('inhale', 'exhale');
        this.$('#meterLevel').classList.remove('low', 'mid', 'high');
        this.updateProgress(0);
        this.$('#progressTime').textContent = '0:00';
        
        this.showScreen('welcomeScreen');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.ritual = new MorningRiseRitual();
});

