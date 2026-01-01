/**
 * Drift — Audio System
 * Ambient sleep sounds, binaural beats, gentle transitions
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.masterGain = null;
        this.ambientNodes = [];
        this.binauralLeft = null;
        this.binauralRight = null;
        this.fadeInterval = null;
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0;
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
            this.stopAll();
        }
    }
    
    // Start ambient sleep soundscape
    startAmbient() {
        if (!this.enabled || !this.audioContext) return;
        
        // Fade in master
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 5);
        
        // Deep drone (very low frequency)
        this.createDrone(55, 0.08); // A1
        this.createDrone(82.5, 0.05); // E2 (fifth)
        
        // Subtle shimmer
        this.createShimmer();
        
        // Optional binaural beats (delta waves for sleep: 0.5-4 Hz)
        this.startBinaural(100, 2); // 100Hz base, 2Hz beat (delta)
    }
    
    createDrone(frequency, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        gain.gain.value = volume;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        
        this.ambientNodes.push({ osc, gain, filter });
    }
    
    createShimmer() {
        // Very subtle high frequency shimmer
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = 440;
        
        // Tremolo effect
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.1; // Very slow
        lfoGain.gain.value = 0.02;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        gain.gain.value = 0.02;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        lfo.start();
        
        this.ambientNodes.push({ osc, gain, filter, lfo, lfoGain });
    }
    
    startBinaural(baseFreq, beatFreq) {
        if (!this.enabled || !this.audioContext) return;
        
        // Create stereo panner for each ear
        const leftPan = this.audioContext.createStereoPanner();
        const rightPan = this.audioContext.createStereoPanner();
        leftPan.pan.value = -1;
        rightPan.pan.value = 1;
        
        // Left ear
        this.binauralLeft = this.audioContext.createOscillator();
        const leftGain = this.audioContext.createGain();
        this.binauralLeft.type = 'sine';
        this.binauralLeft.frequency.value = baseFreq;
        leftGain.gain.value = 0.03;
        
        this.binauralLeft.connect(leftGain);
        leftGain.connect(leftPan);
        leftPan.connect(this.masterGain);
        
        // Right ear (slightly different frequency creates the beat)
        this.binauralRight = this.audioContext.createOscillator();
        const rightGain = this.audioContext.createGain();
        this.binauralRight.type = 'sine';
        this.binauralRight.frequency.value = baseFreq + beatFreq;
        rightGain.gain.value = 0.03;
        
        this.binauralRight.connect(rightGain);
        rightGain.connect(rightPan);
        rightPan.connect(this.masterGain);
        
        this.binauralLeft.start();
        this.binauralRight.start();
        
        this.ambientNodes.push(
            { osc: this.binauralLeft, gain: leftGain },
            { osc: this.binauralRight, gain: rightGain }
        );
    }
    
    // Play breath cue (very subtle)
    playBreathCue(type) {
        if (!this.enabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        
        if (type === 'inhale') {
            // Rising tone
            osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(330, this.audioContext.currentTime + 4);
        } else if (type === 'exhale') {
            // Falling tone
            osc.frequency.setValueAtTime(330, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 8);
        }
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 8);
    }
    
    // Gradually reduce volume as session progresses
    fadeToSleep(duration = 60000) {
        if (!this.masterGain) return;
        
        const startVolume = this.masterGain.gain.value;
        const startTime = Date.now();
        
        this.fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const targetVolume = startVolume * (1 - progress * 0.7); // Fade to 30% of original
            
            this.masterGain.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
            
            if (progress >= 1) {
                clearInterval(this.fadeInterval);
            }
        }, 1000);
    }
    
    stopAll() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }
        
        // Fade out
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3);
        }
        
        // Stop all oscillators after fade
        setTimeout(() => {
            this.ambientNodes.forEach(node => {
                try {
                    node.osc?.stop();
                    node.lfo?.stop();
                } catch (e) {}
            });
            this.ambientNodes = [];
        }, 3000);
    }
}

const Audio = new AudioSystem();

