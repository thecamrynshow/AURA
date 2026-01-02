// ============================================
// Rise — Audio System
// ============================================

const AudioSystem = {
    context: null,
    initialized: false,
    
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Audio not available');
        }
    },
    
    // Soft morning chime
    playChime() {
        if (!this.context) return;
        
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0, this.context.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.8);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.8);
            }, i * 150);
        });
    },
    
    // Gentle breath in
    playBreathIn() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(220, this.context.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.context.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 4);
        
        osc.start();
        osc.stop(this.context.currentTime + 4);
    },
    
    // Gentle breath out
    playBreathOut() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 5);
        
        gain.gain.setValueAtTime(0.05, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 5);
        
        osc.start();
        osc.stop(this.context.currentTime + 5);
    },
    
    // Soft tap
    playTap() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        gain.gain.setValueAtTime(0.08, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // Sunrise flourish
    playSunrise() {
        if (!this.context) return;
        
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.08, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.6);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.6);
            }, i * 100);
        });
    },
    
    // Selection sound
    playSelect() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    }
};


