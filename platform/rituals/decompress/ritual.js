// Decompress Ritual — After Stress
class DecompressRitual {
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
        g.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 0.2);
        g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + d);
        o.start(); o.stop(this.audioContext.currentTime + d);
    }
    
    async start() {
        this.startTimer();
        await this.runScan();
        await this.runRelease();
        await this.runBreathe();
        await this.runGratitude();
        this.complete();
    }
    
    async runScan() {
        this.updateProgress(10);
        this.showScreen('scanScreen');
        const t = this.$('#scanText');
        const zones = this.$$('.body-zone');
        
        const prompts = ["Where are you holding tension?", "Notice without judgment...", "Just observe..."];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(3000);
        }
        
        for (const zone of zones) {
            zone.classList.add('active');
            t.textContent = `Notice your ${zone.textContent}...`;
            await this.wait(3000);
            zone.classList.remove('active');
        }
        this.updateProgress(25);
    }
    
    async runRelease() {
        this.updateProgress(30);
        this.showScreen('releaseScreen');
        const t = this.$('#releaseText');
        const fill = this.$('#tensionFill');
        const label = this.$('#tensionLabel');
        const bodyParts = ['shoulders', 'jaw', 'hands', 'belly', 'whole body'];
        
        t.textContent = "Tense... and release.";
        await this.wait(2000);
        
        for (const part of bodyParts) {
            label.textContent = part;
            
            // Tense
            t.textContent = `Tense your ${part}...`;
            fill.style.width = '0%';
            await this.wait(500);
            fill.style.width = '100%';
            this.playTone(150, 3);
            await this.wait(3000);
            
            // Release
            t.textContent = 'Release...';
            fill.style.width = '0%';
            this.playTone(100, 3);
            await this.wait(3000);
        }
        this.updateProgress(55);
    }
    
    async runBreathe() {
        this.updateProgress(60);
        this.showScreen('breatheScreen');
        const t = this.$('#breatheText');
        const wave = this.$('#breathWave');
        const count = this.$('#breathCount');
        
        t.textContent = "Slow it all the way down...";
        await this.wait(2000);
        
        for (let i = 0; i < 6; i++) {
            count.textContent = i + 1;
            
            // Inhale 5s
            t.textContent = 'Breathe in slowly...';
            wave.classList.remove('exhale');
            wave.classList.add('inhale');
            this.playTone(180, 5);
            await this.wait(5000);
            
            // Exhale 7s
            t.textContent = 'Breathe out even slower...';
            wave.classList.remove('inhale');
            wave.classList.add('exhale');
            this.playTone(140, 7);
            await this.wait(7000);
        }
        wave.classList.remove('inhale', 'exhale');
        t.textContent = 'Peaceful.';
        await this.wait(2000);
        this.updateProgress(85);
    }
    
    async runGratitude() {
        this.updateProgress(88);
        this.showScreen('gratitudeScreen');
        const t = this.$('#gratitudeText');
        const items = this.$$('.gratitude-item');
        
        const prompts = ["Before we close...", "Three things from today..."];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(300);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(2500);
        }
        
        for (let i = 0; i < items.length; i++) {
            items[i].classList.add('visible');
            await this.wait(4000);
        }
        
        t.textContent = 'Let gratitude settle...';
        await this.wait(3000);
        this.updateProgress(100);
    }
    
    complete() {
        clearInterval(this.timerInterval);
        this.showScreen('completeScreen');
        this.playTone(392, 0.5);
        setTimeout(() => this.playTone(523.25, 0.5), 200);
    }
}
document.addEventListener('DOMContentLoaded', () => new DecompressRitual());



