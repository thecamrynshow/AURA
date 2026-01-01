// ============================================
// Squad — Audio System
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
    
    // Soft tap
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
    
    // Selection sound
    playSelect() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.12, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // Group breath in - layered tones
    playGroupBreathIn(count) {
        if (!this.context) return;
        
        const baseFreq = 150;
        
        for (let i = 0; i < Math.min(count, 3); i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'sine';
            const freq = baseFreq + (i * 50);
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            osc.frequency.linearRampToValueAtTime(freq + 80, this.context.currentTime + 4);
            
            const volume = 0.05 - (i * 0.01);
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.5);
            gain.gain.linearRampToValueAtTime(volume * 0.7, this.context.currentTime + 4);
            
            osc.start();
            osc.stop(this.context.currentTime + 4);
        }
    },
    
    // Group breath out
    playGroupBreathOut(count) {
        if (!this.context) return;
        
        const baseFreq = 230;
        
        for (let i = 0; i < Math.min(count, 3); i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.type = 'sine';
            const freq = baseFreq + (i * 50);
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            osc.frequency.linearRampToValueAtTime(freq - 60, this.context.currentTime + 4);
            
            const volume = 0.04 - (i * 0.01);
            gain.gain.setValueAtTime(volume, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 4);
            
            osc.start();
            osc.stop(this.context.currentTime + 4);
        }
    },
    
    // Success chord
    playSuccess() {
        if (!this.context) return;
        
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.12, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.5);
            }, i * 100);
        });
    },
    
    // Round complete
    playRoundComplete() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.context.currentTime);
        osc.frequency.setValueAtTime(659.25, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    }
};

