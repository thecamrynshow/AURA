// ============================================
// Decompress — Audio System
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
        osc.frequency.value = 400;
        
        gain.gain.setValueAtTime(0.08, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // Sigh breath in
    playSighIn() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.linearRampToValueAtTime(200, this.context.currentTime + 3);
        
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.context.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.05, this.context.currentTime + 3);
        
        osc.start();
        osc.stop(this.context.currentTime + 3);
    },
    
    // Sigh breath out - release sound
    playSighOut() {
        if (!this.context) return;
        
        // Main sigh
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 4);
        
        gain.gain.setValueAtTime(0.07, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.context.currentTime + 4);
        
        osc.start();
        osc.stop(this.context.currentTime + 4);
        
        // Noise for breathy quality
        const bufferSize = this.context.sampleRate * 4;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.02;
        }
        
        const noise = this.context.createBufferSource();
        const noiseGain = this.context.createGain();
        
        noise.buffer = buffer;
        noise.connect(noiseGain);
        noiseGain.connect(this.context.destination);
        
        noiseGain.gain.setValueAtTime(0.03, this.context.currentTime);
        noiseGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 4);
        
        noise.start();
        noise.stop(this.context.currentTime + 4);
    },
    
    // Door close
    playDoorClose() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.context.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    },
    
    // Gentle arrive breath
    playArriveBreath() {
        if (!this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 180;
        
        gain.gain.setValueAtTime(0, this.context.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.context.currentTime + 2);
        gain.gain.linearRampToValueAtTime(0.04, this.context.currentTime + 4);
        gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 8);
        
        osc.start();
        osc.stop(this.context.currentTime + 8);
    },
    
    // Complete chime
    playComplete() {
        if (!this.context) return;
        
        const notes = [392.00, 493.88, 587.33]; // G4, B4, D5
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                
                osc.connect(gain);
                gain.connect(this.context.destination);
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.12, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.6);
                
                osc.start();
                osc.stop(this.context.currentTime + 0.6);
            }, i * 200);
        });
    }
};



