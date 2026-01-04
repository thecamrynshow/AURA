// ============================================
// Bounce — Audio System
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
    
    // Play a bounce sound
    playBounce(intensity = 1) {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        // Bounce: quick percussive pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 + (intensity * 100), this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3 * intensity, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    },
    
    // Play tap confirm
    playTap() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.08);
    },
    
    // Play success/completion
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
                
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.3);
            }, i * 100);
        });
    },
    
    // Soft hold tone
    startHoldTone() {
        if (!this.context) return null;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 180;
        
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.context.currentTime + 0.5);
        
        osc.start();
        
        return { osc, gain };
    },
    
    stopHoldTone(tone) {
        if (!tone || !this.context) return;
        
        tone.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);
        setTimeout(() => {
            tone.osc.stop();
        }, 200);
    },
    
    // Selection sound
    playSelect() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }
};



