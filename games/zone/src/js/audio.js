/* ============================================
   ZONE — Audio System
   Ambient sounds and feedback
   ============================================ */

class ZoneAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.feedbackGain = null;
        
        this.oscillators = [];
        this.currentZone = null;
        this.isPlaying = false;
        
        // Zone-specific frequencies (calming, natural harmonics)
        this.zoneFrequencies = {
            blue: [110, 165, 220],      // A2, E3, A3 - gentle, low
            green: [261.63, 329.63, 392], // C4, E4, G4 - balanced, pleasant
            yellow: [196, 246.94, 293.66], // G3, B3, D4 - slightly tense
            red: [146.83, 174.61, 220]   // D3, F3, A3 - grounding
        };
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioContext.destination);
            
            // Ambient gain
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = 0.15;
            this.ambientGain.connect(this.masterGain);
            
            // Feedback gain
            this.feedbackGain = this.audioContext.createGain();
            this.feedbackGain.gain.value = 0.3;
            this.feedbackGain.connect(this.masterGain);
            
            console.log('Zone audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Start ambient sound for a zone
    startAmbient(zoneName) {
        if (!this.audioContext) return;
        
        this.resume();
        this.stopAmbient();
        
        this.currentZone = zoneName;
        const frequencies = this.zoneFrequencies[zoneName] || this.zoneFrequencies.green;
        
        // Create oscillators for ambient drone
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const oscGain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Stagger gains for depth
            oscGain.gain.value = 0.1 / (i + 1);
            
            osc.connect(oscGain);
            oscGain.connect(this.ambientGain);
            
            osc.start();
            this.oscillators.push({ osc, gain: oscGain });
        });
        
        // Fade in
        this.masterGain.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.5);
        this.isPlaying = true;
    }

    // Stop ambient sound
    stopAmbient() {
        if (!this.audioContext) return;
        
        this.oscillators.forEach(({ osc, gain }) => {
            gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => {
                try { osc.stop(); } catch (e) {}
            }, 500);
        });
        
        this.oscillators = [];
        this.isPlaying = false;
    }

    // Transition ambient to new zone
    transitionTo(zoneName, duration = 2) {
        if (!this.audioContext || zoneName === this.currentZone) return;
        
        const frequencies = this.zoneFrequencies[zoneName] || this.zoneFrequencies.green;
        
        // Smoothly transition existing oscillators
        this.oscillators.forEach(({ osc }, i) => {
            const targetFreq = frequencies[i] || frequencies[0];
            osc.frequency.setTargetAtTime(targetFreq, this.audioContext.currentTime, duration / 2);
        });
        
        this.currentZone = zoneName;
    }

    // Play feedback tone (for UI interactions)
    playFeedback(type = 'tap') {
        if (!this.audioContext) return;
        this.resume();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        switch (type) {
            case 'tap':
                osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.001, this.audioContext.currentTime + 0.1);
                break;
            case 'success':
                osc.frequency.value = 523.25; // C5
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                setTimeout(() => {
                    osc.frequency.value = 659.25; // E5
                }, 100);
                setTimeout(() => {
                    osc.frequency.value = 783.99; // G5
                }, 200);
                break;
            case 'complete':
                osc.frequency.value = 392; // G4
                gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                break;
            default:
                osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        }
        
        osc.type = 'sine';
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.feedbackGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }

    // Play breathing guide tones
    playBreathTone(phase) {
        if (!this.audioContext) return;
        this.resume();
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        
        if (phase === 'inhale') {
            // Rising tone
            osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(330, this.audioContext.currentTime + 4);
        } else if (phase === 'exhale') {
            // Falling tone
            osc.frequency.setValueAtTime(330, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 4);
        } else {
            // Hold - gentle pulse
            osc.frequency.value = 275;
        }
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 3.9);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.feedbackGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
        
        return osc;
    }

    // Set master volume
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(clamp(value, 0, 1), this.audioContext.currentTime, 0.1);
        }
    }

    // Mute/unmute
    mute() {
        this.setVolume(0);
    }

    unmute() {
        this.setVolume(1);
    }

    // Cleanup
    dispose() {
        this.stopAmbient();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Global audio instance
const zoneAudio = new ZoneAudio();

console.log('ZONE Audio loaded');


