/* ============================================
   THRESHOLD — Audio System
   Ambient sounds and breath cues
   ============================================ */

class ThresholdAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.ambientOsc = null;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = 0;
            this.ambientGain.connect(this.masterGain);
            
            console.log('Threshold audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    startAmbient() {
        if (!this.audioContext) return;
        
        // Create ambient drone
        this.ambientOsc = this.audioContext.createOscillator();
        const ambientOsc2 = this.audioContext.createOscillator();
        
        this.ambientOsc.type = 'sine';
        this.ambientOsc.frequency.value = 60;
        
        ambientOsc2.type = 'sine';
        ambientOsc2.frequency.value = 90;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        this.ambientOsc.connect(filter);
        ambientOsc2.connect(filter);
        filter.connect(this.ambientGain);
        
        this.ambientOsc.start();
        ambientOsc2.start();
        
        // Fade in
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 2);
    }

    stopAmbient() {
        if (this.ambientOsc && this.audioContext) {
            this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
            setTimeout(() => {
                if (this.ambientOsc) {
                    this.ambientOsc.stop();
                    this.ambientOsc = null;
                }
            }, 1000);
        }
    }

    // Play breath cue
    playBreathCue(phase) {
        if (!this.audioContext) return;
        
        const frequencies = {
            inhale: 220,
            hold: 330,
            exhale: 165
        };
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = frequencies[phase] || 220;
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    // Play transition complete
    playComplete() {
        if (!this.audioContext) return;
        
        const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.audioContext.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.8);
        });
    }

    // Play state selection
    playSelect() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    dispose() {
        this.stopAmbient();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

const thresholdAudio = new ThresholdAudio();

console.log('Threshold Audio loaded');



