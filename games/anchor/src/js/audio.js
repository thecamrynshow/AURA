/**
 * Anchor — Audio System
 * Underwater ambience, acknowledgment sounds
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientNodes = [];
        this.enabled = true;
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
    
    // Start underwater ambient
    startAmbient() {
        if (!this.audioContext) return;
        
        // Deep water drone
        this.createDrone(65, 0.1);
        this.createDrone(98, 0.06); // Fifth above
        
        // Water movement (filtered noise simulation)
        this.createWaterSound();
    }
    
    createDrone(frequency, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        // Slow pitch modulation
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        filter.type = 'lowpass';
        filter.frequency.value = 150;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        lfo.start();
        
        this.ambientNodes.push({ osc, gain, filter, lfo, lfoGain });
    }
    
    createWaterSound() {
        // Simulated water movement using oscillators
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc1.type = 'sine';
        osc1.frequency.value = 200;
        osc2.type = 'sine';
        osc2.frequency.value = 203; // Creates beating
        
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 5;
        
        // Modulate filter
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.1;
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        gain.gain.value = 0.02;
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc1.start();
        osc2.start();
        lfo.start();
        
        this.ambientNodes.push({ osc: osc1, gain, filter });
        this.ambientNodes.push({ osc: osc2 });
    }
    
    // Acknowledgment sound (when tapping item)
    playAcknowledge() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(780, this.audioContext.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
    
    // Phase transition sound
    playPhaseComplete() {
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
            }, i * 150);
        });
    }
    
    // Rising bubble sound
    playBubble() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, this.audioContext.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }
    
    // Completion sound
    playComplete() {
        if (!this.audioContext) return;
        
        const notes = [523, 659, 784, 1046]; // C major arpeggio
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 1.5);
            }, i * 200);
        });
    }
    
    stopAll() {
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        }
        
        setTimeout(() => {
            this.ambientNodes.forEach(node => {
                try {
                    node.osc?.stop();
                    node.lfo?.stop();
                } catch (e) {}
            });
            this.ambientNodes = [];
        }, 2000);
    }
}

const Audio = new AudioSystem();



