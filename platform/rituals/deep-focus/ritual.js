// ============================================
// Deep Focus Ritual
// Enter flow state on command
// ============================================

class DeepFocusRitual {
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
            window.close();
            // Fallback if window.close() doesn't work
            window.location.href = '../index.html';
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
    
    playFocusTone() {
        // A focused, clear tone
        this.playTone(440, 0.3);
    }
    
    async startRitual() {
        this.startTimer();
        this.$('#ambientBg').classList.add('focusing');
        
        await this.wait(500);
        await this.runClear();
        await this.runBoxBreathing();
        await this.runSinglePoint();
        await this.runLaunch();
        await this.complete();
    }
    
    async runClear() {
        this.updateProgress(10);
        this.showScreen('clearScreen');
        
        const textEl = this.$('#clearText');
        const thoughts = this.$$('.thought');
        
        const prompts = [
            { text: "Empty the mental space...", wait: 3000 },
            { text: "All the tabs open in your mind...", wait: 3000 },
            { text: "The worries, the to-dos, the noise...", wait: 3000 },
            { text: "Let them go, one by one...", wait: 2000 }
        ];
        
        for (const prompt of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = prompt.text;
            textEl.style.opacity = '1';
            await this.wait(prompt.wait);
        }
        
        // Clear thoughts one by one
        for (const thought of thoughts) {
            thought.classList.add('cleared');
            await this.wait(500);
        }
        
        textEl.textContent = "Clear.";
        await this.wait(1500);
        
        this.updateProgress(25);
    }
    
    async runBoxBreathing() {
        this.updateProgress(30);
        this.showScreen('boxScreen');
        
        const textEl = this.$('#boxText');
        const instruction = this.$('#boxInstruction');
        const dot = this.$('#boxDot');
        const sides = this.$$('.box-side');
        const counter = this.$('#breathCount');
        
        textEl.textContent = "Box breathing. 4 rounds.";
        await this.wait(2000);
        
        for (let round = 0; round < 4; round++) {
            counter.textContent = round + 1;
            
            // Inhale (top side)
            instruction.textContent = "breathe in";
            sides.forEach(s => s.classList.remove('active'));
            this.$('.box-side.top').classList.add('active');
            dot.className = 'box-dot';
            this.playTone(220, 4);
            await this.wait(100);
            dot.classList.add('top');
            await this.wait(3900);
            
            // Hold (right side)
            instruction.textContent = "hold";
            sides.forEach(s => s.classList.remove('active'));
            this.$('.box-side.right').classList.add('active');
            dot.className = 'box-dot top';
            await this.wait(100);
            dot.classList.remove('top');
            dot.classList.add('right');
            await this.wait(3900);
            
            // Exhale (bottom side)
            instruction.textContent = "breathe out";
            sides.forEach(s => s.classList.remove('active'));
            this.$('.box-side.bottom').classList.add('active');
            dot.className = 'box-dot right';
            this.playTone(180, 4);
            await this.wait(100);
            dot.classList.remove('right');
            dot.classList.add('bottom');
            await this.wait(3900);
            
            // Hold (left side)
            instruction.textContent = "hold";
            sides.forEach(s => s.classList.remove('active'));
            this.$('.box-side.left').classList.add('active');
            dot.className = 'box-dot bottom';
            await this.wait(100);
            dot.classList.remove('bottom');
            dot.classList.add('left');
            await this.wait(3900);
        }
        
        sides.forEach(s => s.classList.add('active'));
        instruction.textContent = "complete";
        await this.wait(1000);
        
        this.updateProgress(70);
    }
    
    async runSinglePoint() {
        this.updateProgress(75);
        this.showScreen('singlePointScreen');
        
        const textEl = this.$('#singleText');
        const prompt = this.$('#focusPrompt');
        
        const prompts = [
            { text: "One task. One focus. One moment.", wait: 3000 },
            { text: "Let everything else fall away.", wait: 3000 },
            { text: "There is only this.", wait: 3000 }
        ];
        
        for (const p of prompts) {
            textEl.style.opacity = '0';
            await this.wait(300);
            textEl.textContent = p.text;
            textEl.style.opacity = '1';
            await this.wait(p.wait);
        }
        
        prompt.textContent = "Lock in your single point of focus...";
        await this.wait(4000);
        
        this.updateProgress(85);
    }
    
    async runLaunch() {
        this.updateProgress(90);
        this.showScreen('launchScreen');
        
        const countdown = this.$('#launchCountdown');
        const text = this.$('#launchText');
        
        text.textContent = "Focus locked. Beginning in...";
        
        for (let i = 3; i >= 1; i--) {
            countdown.textContent = i;
            this.playFocusTone();
            await this.wait(1000);
        }
        
        countdown.textContent = "GO";
        this.playTone(523.25, 0.5);
        await this.wait(500);
        
        this.updateProgress(100);
    }
    
    async complete() {
        this.stopTimer();
        this.showScreen('completeScreen');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ritual = new DeepFocusRitual();
});



