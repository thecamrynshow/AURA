/**
 * Tidepool - Audio System
 * Ambient underwater soundscape
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        
        // Sound layers
        this.ambientOscillators = [];
        this.bubbleTimeout = null;
        
        // State
        this.targetVolume = 0.3;
        this.presenceLevel = 0.5;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioContext.destination);
            
            // Create ambient drone layers
            this.createAmbientLayers();
            
            this.isInitialized = true;
            console.log('Audio system initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    createAmbientLayers() {
        // Base drone frequencies (underwater ambiance)
        const frequencies = [55, 82.5, 110, 165]; // A1, E2, A2, E3
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Low pass filter for underwater sound
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            filter.Q.value = 1;
            
            gain.gain.value = 0.05 - i * 0.01;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            
            this.ambientOscillators.push({ osc, gain, filter, baseFreq: freq });
        });
        
        // Add subtle LFO modulation
        this.createLFO();
    }
    
    createLFO() {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Very slow
        lfoGain.gain.value = 5;
        
        lfo.connect(lfoGain);
        
        // Connect LFO to oscillator frequencies for gentle warble
        this.ambientOscillators.forEach(layer => {
            lfoGain.connect(layer.osc.frequency);
        });
        
        lfo.start();
    }
    
    start() {
        if (!this.isInitialized) return;
        
        // Fade in
        this.masterGain.gain.setTargetAtTime(
            this.targetVolume,
            this.audioContext.currentTime,
            2
        );
        
        // Start bubble sounds
        this.scheduleBubble();
    }
    
    stop() {
        if (!this.isInitialized) return;
        
        // Fade out
        this.masterGain.gain.setTargetAtTime(
            0,
            this.audioContext.currentTime,
            2
        );
        
        // Stop bubble scheduling
        if (this.bubbleTimeout) {
            clearTimeout(this.bubbleTimeout);
        }
    }
    
    update(deltaTime, presenceLevel) {
        if (!this.isInitialized) return;
        
        this.presenceLevel = presenceLevel;
        
        // Adjust filter based on presence (more clarity = higher frequencies)
        const filterFreq = 300 + presenceLevel * 400;
        
        this.ambientOscillators.forEach(layer => {
            layer.filter.frequency.setTargetAtTime(
                filterFreq,
                this.audioContext.currentTime,
                0.5
            );
        });
        
        // Adjust volume based on presence
        const targetVol = 0.2 + presenceLevel * 0.15;
        this.masterGain.gain.setTargetAtTime(
            targetVol,
            this.audioContext.currentTime,
            1
        );
    }
    
    scheduleBubble() {
        // Random interval between bubbles
        const interval = 2000 + Math.random() * 5000;
        
        this.bubbleTimeout = setTimeout(() => {
            this.playBubble();
            this.scheduleBubble();
        }, interval);
    }
    
    playBubble() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Create bubble sound
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Bubble is a quick frequency sweep
        const baseFreq = 200 + Math.random() * 400;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.1);
        
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 5;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05 * this.presenceLevel, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
    
    playConnectionSound() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Gentle chime for connection
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const delay = i * 0.1;
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.1, now + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now + delay);
            osc.stop(now + delay + 1.1);
        });
    }
    
    playEndSessionSound() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Peaceful ending chord
        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
            gain.gain.setValueAtTime(0.08, now + 2);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now);
            osc.stop(now + 5.1);
        });
    }
    
    destroy() {
        if (this.bubbleTimeout) {
            clearTimeout(this.bubbleTimeout);
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

