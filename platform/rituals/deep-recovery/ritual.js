// Deep Recovery Ritual — Complete nervous system restoration
class DeepRecoveryRitual {
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
        g.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.5);
        g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + d);
        o.start(); o.stop(this.audioContext.currentTime + d);
    }
    
    async start() {
        this.startTimer();
        this.$('#ambientBg').classList.add('warm');
        await this.runAcknowledge();
        await this.runSafety();
        await this.runBreathing();
        await this.runRelease();
        await this.runCompassion();
        await this.runIntegration();
        this.complete();
    }
    
    async runAcknowledge() {
        this.updateProgress(5);
        this.showScreen('acknowledgeScreen');
        const t = this.$('#acknowledgeText');
        const prompts = [
            "You've been carrying a lot...",
            "It makes sense that you're tired.",
            "It makes sense that you're hurting.",
            "You've been doing your best.",
            "That's enough. You are enough."
        ];
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(800);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(5000);
        }
        this.updateProgress(15);
    }
    
    async runSafety() {
        this.updateProgress(18);
        this.showScreen('safetyScreen');
        const t = this.$('#safetyText');
        const signals = this.$$('.signal');
        
        t.textContent = "Right now, in this moment, you are safe.";
        await this.wait(4000);
        
        for (let i = 0; i < signals.length; i++) {
            signals[i].classList.add('visible');
            this.playTone(200 + i * 30, 3);
            await this.wait(5000);
        }
        
        t.textContent = "Let your body know it can rest.";
        await this.wait(4000);
        this.updateProgress(25);
    }
    
    async runBreathing() {
        this.updateProgress(28);
        this.showScreen('breathingScreen');
        const t = this.$('#breathingText');
        const sphere = this.$('#breathSphere');
        const inst = this.$('#breathInstruction');
        const count = this.$('#breathCount');
        
        t.textContent = "Long, slow breaths...";
        await this.wait(3000);
        
        for (let i = 0; i < 10; i++) {
            count.textContent = i + 1;
            
            // Inhale 5s
            inst.textContent = 'breathe in';
            sphere.className = 'breath-sphere expand';
            this.playTone(150, 5);
            await this.wait(5000);
            
            // Exhale 7s
            inst.textContent = 'breathe out';
            sphere.className = 'breath-sphere contract';
            this.playTone(120, 7);
            await this.wait(7000);
            
            sphere.className = 'breath-sphere';
            await this.wait(500);
        }
        this.updateProgress(50);
    }
    
    async runRelease() {
        this.updateProgress(52);
        this.showScreen('releaseScreen');
        const t = this.$('#releaseText');
        const bodyPart = this.$('.body-part');
        
        const parts = [
            { area: 'forehead', text: 'Release tension in your forehead...' },
            { area: 'eyes', text: 'Soften around your eyes...' },
            { area: 'jaw', text: 'Unclench your jaw...' },
            { area: 'throat', text: 'Relax your throat...' },
            { area: 'shoulders', text: 'Let your shoulders drop...' },
            { area: 'chest', text: 'Soften your chest...' },
            { area: 'belly', text: 'Release your belly...' },
            { area: 'back', text: 'Let your back be supported...' },
            { area: 'hands', text: 'Open your hands...' },
            { area: 'whole body', text: 'Your whole body... letting go...' }
        ];
        
        for (const part of parts) {
            t.textContent = part.text;
            bodyPart.textContent = part.area;
            this.playTone(100, 6);
            await this.wait(7000);
        }
        this.updateProgress(70);
    }
    
    async runCompassion() {
        this.updateProgress(72);
        this.showScreen('compassionScreen');
        const t = this.$('#compassionText');
        const aff = this.$('#affirmation');
        
        const prompts = [
            { text: "Place your hand on your heart...", aff: "" },
            { text: "Feel its steady rhythm...", aff: "" },
            { text: "Speak gently to yourself...", aff: "May I be kind to myself." },
            { text: "", aff: "May I give myself the compassion I need." },
            { text: "", aff: "May I be patient with my healing." },
            { text: "", aff: "May I know that I am worthy of love." },
            { text: "", aff: "I am doing the best I can." }
        ];
        
        for (const p of prompts) {
            if (p.text) {
                t.style.opacity = '0'; await this.wait(500);
                t.textContent = p.text; t.style.opacity = '1';
            }
            if (p.aff) {
                aff.style.opacity = '0'; await this.wait(500);
                aff.textContent = p.aff; aff.style.opacity = '1';
            }
            await this.wait(6000);
        }
        this.updateProgress(88);
    }
    
    async runIntegration() {
        this.updateProgress(90);
        this.showScreen('integrationScreen');
        const t = this.$('#integrationText');
        
        const prompts = [
            "Take your time returning...",
            "There's no rush.",
            "Notice how you feel now...",
            "Different. Softer. Lighter.",
            "Carry this feeling with you."
        ];
        
        for (const p of prompts) {
            t.style.opacity = '0'; await this.wait(800);
            t.textContent = p; t.style.opacity = '1';
            await this.wait(5000);
        }
        this.updateProgress(100);
    }
    
    complete() {
        clearInterval(this.timerInterval);
        this.showScreen('completeScreen');
        this.playTone(261.63, 0.5);
        setTimeout(() => this.playTone(329.63, 0.5), 200);
        setTimeout(() => this.playTone(392, 0.8), 400);
    }
}
document.addEventListener('DOMContentLoaded', () => new DeepRecoveryRitual());

