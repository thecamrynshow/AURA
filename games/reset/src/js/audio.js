/**
 * Reset — Audio System
 * Minimal, professional sounds for workplace use
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.masterGain = null;
        this.ambientOsc = null;
        this.ambientGain = null;
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.3;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }
    
    async resume() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopAmbient();
        }
    }
    
    // Soft chime for breath transitions
    playChime(frequency = 440) {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }
    
    // Inhale sound (rising tone)
    playInhale() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(330, this.audioContext.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 3.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
    }
    
    // Exhale sound (falling tone)
    playExhale() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 3.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
    }
    
    // Completion sound
    playComplete() {
        if (!this.enabled || !this.audioContext) return;
        
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playChime(freq);
            }, i * 200);
        });
    }
    
    // Soft click for UI
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Soft ambient drone
    startAmbient() {
        if (!this.enabled || !this.audioContext || this.ambientOsc) return;
        
        this.ambientOsc = this.audioContext.createOscillator();
        this.ambientGain = this.audioContext.createGain();
        
        this.ambientOsc.type = 'sine';
        this.ambientOsc.frequency.value = 110; // A2
        
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 2);
        
        this.ambientOsc.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        
        this.ambientOsc.start();
    }
    
    stopAmbient() {
        if (this.ambientOsc) {
            try {
                this.ambientGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
                setTimeout(() => {
                    this.ambientOsc?.stop();
                    this.ambientOsc = null;
                    this.ambientGain = null;
                }, 1000);
            } catch (e) {
                this.ambientOsc = null;
            }
        }
    }
}

const Audio = new AudioSystem();

