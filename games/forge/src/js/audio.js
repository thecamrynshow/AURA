// ============================================
// Forge — Audio System
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
    
    // Power breath in - rising tone
    playPowerIn(intensity = 1) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        const baseFreq = 100 + (intensity * 50);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq + 100, this.context.currentTime + 3);
        
        const vol = 0.05 + (intensity * 0.02);
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.context.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(vol * 0.8, this.context.currentTime + 3);
        
        osc.start();
        osc.stop(this.context.currentTime + 3);
    },
    
    // Power breath out
    playPowerOut(intensity = 1) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        const baseFreq = 150 + (intensity * 50);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(baseFreq - 50, this.context.currentTime + 3);
        
        const vol = 0.04 + (intensity * 0.02);
        gain.gain.setValueAtTime(vol, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 3);
        
        osc.start();
        osc.stop(this.context.currentTime + 3);
    },
    
    // Ignite breath - more intense
    playIgniteIn() {
        if (!this.context) return;
        
        for (let i = 0; i < 2; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = i === 0 ? 'sawtooth' : 'square';
            osc.frequency.setValueAtTime(180 + (i * 60), this.context.currentTime);
            osc.frequency.linearRampToValueAtTime(280 + (i * 60), this.context.currentTime + 2);
            
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.06 - (i * 0.02), this.context.currentTime + 0.2);
            gain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 2);
            
            osc.start();
            osc.stop(this.context.currentTime + 2);
        }
    },
    
    playIgniteOut() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(150, this.context.currentTime + 2);
        
        gain.gain.setValueAtTime(0.06, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 2);
        
        osc.start();
        osc.stop(this.context.currentTime + 2);
    },
    
    // Lock hold tone
    playLockHold() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 220;
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.context.currentTime + 5);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 6);
        
        osc.start();
        osc.stop(this.context.currentTime + 6);
    },
    
    // Tap sound
    playTap() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.08);
    },
    
    // Selection
    playSelect() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.12, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // Forged complete
    playForged() {
        if (!this.context) return;
        
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.15, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.5);
            }, i * 80);
        });
    }
};



