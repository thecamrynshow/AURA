// Before Ritual — Pre-Performance
class BeforeRitual {
    constructor() {
        this.audioContext = null;
        this.audioEnabled = true;
        this.startTime = null;
        this.timerInterval = null;
        this.init();
    }
    
    init() { this.bindEvents(); }
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    bindEvents() {
        this.$('#beginBtn').addEventListener('click', () => { this.initAudio(); this.start(); });
        this.$('#audioBtn').addEventListener('click', () => this.toggleAudio());
        this.$('#doneBtn').addEventListener('click', () => window.location.href = '../index.html');
        this.$$('.cue-btn').forEach(btn => btn.addEventListener('click', (e) => {
            this.$$('.cue-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
        }));
    }
    
    initAudio() { try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
    toggleAudio() { this.audioEnabled = !this.audioEnabled; this.$('#audioBtn').classList.toggle('muted', !this.audioEnabled); }
    showScreen(id) { this.$$('.screen').forEach(s => s.classList.remove('active')); this.$(`#${id}`).classList.add('active'); }
    updateProgress(p) { this.$('#progressFill').style.width = `${p}%`; }
    wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const e = Math.floor((Date.now() - this.startTime) / 1000);
            this.$('#progressTime').textContent = `${Math.floor(e/60)}:${(e%60).toString().padStart(2,'0')}`;
        }, 1000);
    }
    
    playTone(f, d) {
        if (!this.audioContext || !this.audioEnabled) return;
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0, this.audioContext.currentTime);
        g.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.1);
        g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + d);
        o.start(); o.stop(this.audioContext.currentTime + d);
    }
    
    async start() {
        this.startTimer();
        await this.runAcknowledge();
        await this.runSigh();
        await this.runPower();
        await this.runVisualize();
        await this.runCue();
        this.complete();
    }
    
    async runAcknowledge() {
        this.updateProgress(10);
        this.showScreen('acknowledgeScreen');
        const t = this.$('#acknowledgeText');
        const prompts = [
            "It's normal to feel nervous...",
            "These feelings mean you care.",
            "Your body is preparing you.",
            "Let's use this energy."
        ];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(3000);
        }
        this.updateProgress(20);
    }
    
    async runSigh() {
        this.updateProgress(25);
        this.showScreen('sighScreen');
        const circle = this.$('#sighCircle');
        const inst = this.$('#sighInstruction');
        const count = this.$('#sighCount');
        
        for (let i = 0; i < 3; i++) {
            count.textContent = i + 1;
            
            // Double inhale
            inst.textContent = 'inhale';
            circle.className = 'sigh-circle inhale1';
            this.playTone(200, 1.5);
            await this.wait(1500);
            
            inst.textContent = 'inhale more';
            circle.className = 'sigh-circle inhale2';
            this.playTone(250, 1);
            await this.wait(1000);
            
            // Long exhale
            inst.textContent = 'long exhale';
            circle.className = 'sigh-circle exhale';
            this.playTone(150, 4);
            await this.wait(4000);
            
            circle.className = 'sigh-circle';
            await this.wait(500);
        }
        this.updateProgress(40);
    }
    
    async runPower() {
        this.updateProgress(45);
        this.showScreen('powerScreen');
        const t = this.$('#powerText');
        const timer = this.$('#powerTimer');
        
        const prompts = ["Stand tall. Take up space.", "Shoulders back. Chin up.", "You are powerful.", "Hold this posture..."];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(3000);
        }
        
        // 60 second countdown
        for (let i = 60; i >= 0; i--) {
            timer.textContent = i;
            await this.wait(1000);
            if (i === 30) { t.textContent = "You've got this."; }
            if (i === 10) { t.textContent = "Almost there..."; }
        }
        this.updateProgress(65);
    }
    
    async runVisualize() {
        this.updateProgress(70);
        this.showScreen('visualizeScreen');
        const t = this.$('#visualizeText');
        const prompts = [
            "Close your eyes...",
            "See yourself walking in, confident.",
            "See yourself performing at your best.",
            "Feel the success in your body.",
            "This is you. This is real."
        ];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(4000);
        }
        this.updateProgress(85);
    }
    
    async runCue() {
        this.updateProgress(90);
        this.showScreen('cueScreen');
        const t = this.$('#cueText');
        const prompts = ["One word. Your power word.", "The word that unlocks your best self.", "Choose it now..."];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(3000);
        }
        await this.wait(5000);
        this.updateProgress(100);
    }
    
    complete() {
        clearInterval(this.timerInterval);
        this.showScreen('completeScreen');
        this.playTone(523.25, 0.5);
    }
}
document.addEventListener('DOMContentLoaded', () => new BeforeRitual());



