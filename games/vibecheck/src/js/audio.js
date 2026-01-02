// ============================================
// Vibe Check — Audio System
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
    
    // Selection pop
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
    
    // Breath in tone
    playBreathIn() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(280, this.context.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.context.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 4);
        
        osc.start();
        osc.stop(this.context.currentTime + 4);
    },
    
    // Breath out tone
    playBreathOut() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(160, this.context.currentTime + 4);
        
        gain.gain.setValueAtTime(0.04, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 4);
        
        osc.start();
        osc.stop(this.context.currentTime + 4);
    },
    
    // Success chime
    playSuccess() {
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
                
                gain.gain.setValueAtTime(0.15, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.3);
            }, i * 120);
        });
    }
};


