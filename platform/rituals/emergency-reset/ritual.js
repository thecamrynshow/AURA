// Emergency Reset Ritual — Fast-acting crisis intervention
class EmergencyResetRitual {
    constructor() {
        this.audioContext = null;
        this.init();
    }
    
    init() { this.bindEvents(); }
    $(s) { return document.querySelector(s); }
    $$(s) { return document.querySelectorAll(s); }
    
    bindEvents() {
        this.$('#beginBtn').addEventListener('click', () => { this.initAudio(); this.start(); });
        this.$('#betterBtn').addEventListener('click', () => this.showSafe());
        this.$('#againBtn').addEventListener('click', () => this.restart());
        this.$('#doneBtn').addEventListener('click', () => window.location.href = '../index.html');
    }
    
    initAudio() { try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
    showScreen(id) { this.$$('.screen').forEach(s => s.classList.remove('active')); this.$(`#${id}`).classList.add('active'); }
    wait(ms) { return new Promise(r => setTimeout(r, ms)); }
    
    playTone(f, d) {
        if (!this.audioContext) return;
        const o = this.audioContext.createOscillator();
        const g = this.audioContext.createGain();
        o.connect(g); g.connect(this.audioContext.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        g.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + d);
        o.start(); o.stop(this.audioContext.currentTime + d);
    }
    
    async start() {
        await this.runGround();
        await this.runSigh();
        await this.runCold();
        this.showReassess();
    }
    
    async runGround() {
        this.showScreen('groundScreen');
        const items = this.$$('.ground-item');
        const text = this.$('#groundText');
        
        text.textContent = "Look around. Find:";
        await this.wait(2000);
        
        for (let i = 0; i < items.length; i++) {
            items.forEach(item => item.classList.remove('active'));
            items[i].classList.add('active');
            this.playTone(300 + i * 50, 0.3);
            await this.wait(5000);
            items[i].classList.remove('active');
            items[i].classList.add('done');
        }
        
        text.textContent = "Good. You're here.";
        await this.wait(2000);
    }
    
    async runSigh() {
        this.showScreen('sighScreen');
        this.$('#ambientBg').classList.add('calming');
        
        const circle = this.$('#sighCircle');
        const inst = this.$('#sighInstruction');
        const count = this.$('#sighCount');
        
        for (let i = 0; i < 5; i++) {
            count.textContent = i + 1;
            
            // Double inhale
            inst.textContent = 'inhale';
            circle.className = 'sigh-circle inhale1';
            this.playTone(200, 1);
            await this.wait(1500);
            
            inst.textContent = 'inhale more';
            circle.className = 'sigh-circle inhale2';
            this.playTone(250, 0.8);
            await this.wait(1000);
            
            // Long exhale
            inst.textContent = 'long exhale';
            circle.className = 'sigh-circle exhale';
            this.playTone(150, 3);
            await this.wait(4000);
            
            circle.className = 'sigh-circle';
            await this.wait(500);
        }
    }
    
    async runCold() {
        this.showScreen('coldScreen');
        const timer = this.$('#coldTimer');
        const text = this.$('#coldText');
        
        text.textContent = "Cold water on your wrists activates your dive reflex.";
        
        for (let i = 30; i >= 0; i--) {
            timer.textContent = i;
            await this.wait(1000);
        }
        
        timer.textContent = '✓';
    }
    
    showReassess() {
        this.showScreen('reassessScreen');
    }
    
    showSafe() {
        this.showScreen('safeScreen');
        this.playTone(392, 0.3);
        setTimeout(() => this.playTone(523.25, 0.3), 150);
        setTimeout(() => this.playTone(659.25, 0.5), 300);
    }
    
    restart() {
        this.$('#ambientBg').classList.remove('calming');
        this.$$('.ground-item').forEach(item => {
            item.classList.remove('active', 'done');
        });
        this.start();
    }
}
document.addEventListener('DOMContentLoaded', () => new EmergencyResetRitual());

