// Sleep Descent Ritual
class SleepDescentRitual {
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
        g.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + d);
        o.start(); o.stop(this.audioContext.currentTime + d);
    }
    
    async start() {
        this.startTimer();
        await this.runCompletion();
        await this.runBreathing();
        await this.runBodyScan();
        await this.runCounting();
        await this.runDrift();
    }
    
    async runCompletion() {
        this.updateProgress(5);
        this.showScreen('completionScreen');
        const t = this.$('#completionText');
        const prompts = [
            "The day is done...",
            "Whatever happened, it's complete.",
            "There's nothing left to do tonight.",
            "Only rest awaits."
        ];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(500);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(4000);
        }
        this.updateProgress(15);
    }
    
    async runBreathing() {
        this.updateProgress(20);
        this.showScreen('breathScreen');
        this.$('#ambientBg').classList.add('dimming');
        
        const orb = this.$('#sleepOrb');
        const phase = this.$('#breathPhase');
        const countdown = this.$('#breathCountdown');
        const count = this.$('#breathCount');
        const text = this.$('#breathText');
        
        text.textContent = "The sleep breath: 4 in, 7 hold, 8 out...";
        await this.wait(3000);
        
        for (let round = 0; round < 4; round++) {
            count.textContent = round + 1;
            
            // Inhale 4
            phase.textContent = 'inhale';
            orb.className = 'sleep-orb expand';
            for (let i = 4; i >= 1; i--) {
                countdown.textContent = i;
                this.playTone(150 + (4-i) * 10, 1);
                await this.wait(1000);
            }
            
            // Hold 7
            phase.textContent = 'hold';
            orb.className = 'sleep-orb hold';
            for (let i = 7; i >= 1; i--) {
                countdown.textContent = i;
                await this.wait(1000);
            }
            
            // Exhale 8
            phase.textContent = 'exhale';
            orb.className = 'sleep-orb contract';
            for (let i = 8; i >= 1; i--) {
                countdown.textContent = i;
                this.playTone(120 - (8-i) * 5, 1);
                await this.wait(1000);
            }
            
            orb.className = 'sleep-orb';
            await this.wait(500);
        }
        this.updateProgress(50);
    }
    
    async runBodyScan() {
        this.updateProgress(55);
        this.showScreen('bodyScanScreen');
        const t = this.$('#bodyScanText');
        
        const parts = [
            "Let your face relax... jaw loosening...",
            "Shoulders melting into the bed...",
            "Arms growing heavy... hands open...",
            "Chest soft... breathing easy...",
            "Belly rising and falling...",
            "Legs releasing... feet warm...",
            "Your whole body... sinking... supported..."
        ];
        
        for (const p of parts) {
            t.style.opacity = '0'; await this.wait(500);
            t.textContent = p; t.style.opacity = '1';
            this.playTone(100, 5);
            await this.wait(6000);
        }
        this.updateProgress(75);
    }
    
    async runCounting() {
        this.updateProgress(80);
        this.showScreen('countingScreen');
        this.$('#ambientBg').classList.add('dark');
        
        const num = this.$('#countNumber');
        
        for (let i = 10; i >= 1; i--) {
            num.textContent = i;
            num.style.opacity = (i / 10) * 0.6;
            this.playTone(80 + i * 5, 2);
            await this.wait(3000);
        }
        
        num.textContent = '...';
        num.style.opacity = '0.2';
        await this.wait(2000);
        this.updateProgress(95);
    }
    
    async runDrift() {
        this.updateProgress(100);
        this.showScreen('driftScreen');
        clearInterval(this.timerInterval);
        
        const t = this.$('#driftText');
        const words = ['drifting...', 'floating...', 'peaceful...', 'sleep...'];
        
        let i = 0;
        const cycle = async () => {
            t.textContent = words[i % words.length];
            i++;
            await this.wait(8000);
            cycle();
        };
        cycle();
    }
}
document.addEventListener('DOMContentLoaded', () => new SleepDescentRitual());


