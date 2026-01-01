/**
 * Chill — Audio System
 * Minimal, modern sounds
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.25;
        } catch (e) {
            console.warn('Audio not available');
        }
    }
    
    async resume() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    // Soft tap sound
    playTap() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Breath in cue
    playInhale() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(450, this.audioContext.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 3.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
    }
    
    // Breath out cue
    playExhale() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 4);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 3.5);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
    }
    
    // Success chime
    playSuccess() {
        if (!this.audioContext) return;
        
        const notes = [523, 659, 784]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.8);
            }, i * 120);
        });
    }
    
    // Countdown tick
    playTick() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 600;
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }
}

const Audio = new AudioSystem();

