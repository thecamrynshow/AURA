/**
 * Echo Garden - Audio Output System
 * Generative ambient sounds that respond to player
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        
        // Sound layers
        this.drones = [];
        this.harmonicOscillators = [];
        
        // State
        this.harmonyLevel = 0;
        this.currentPitch = 0;
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.audioContext.destination);
            
            this.createAmbientDrones();
            
            this.isInitialized = true;
            console.log('Audio output system initialized');
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }
    
    createAmbientDrones() {
        // Base ambient frequencies (nature-inspired)
        const frequencies = [65.41, 98.00, 130.81]; // C2, G2, C3
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            filter.Q.value = 1;
            
            gain.gain.value = 0.03;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            
            this.drones.push({ osc, gain, filter, baseFreq: freq });
        });
        
        // Add subtle LFO for movement
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 3;
        
        lfo.connect(lfoGain);
        this.drones.forEach(drone => {
            lfoGain.connect(drone.osc.frequency);
        });
        
        lfo.start();
    }
    
    start() {
        if (!this.isInitialized) return;
        
        this.masterGain.gain.setTargetAtTime(0.2, this.audioContext.currentTime, 2);
    }
    
    stop() {
        if (!this.isInitialized) return;
        
        this.masterGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 2);
    }
    
    update(deltaTime, soundState) {
        if (!this.isInitialized) return;
        
        // Adjust ambient based on player's pitch stability
        if (soundState) {
            this.harmonyLevel = Utils.lerp(this.harmonyLevel, soundState.pitchStability, 0.05);
            
            // Brighten filter with harmony
            const filterFreq = 300 + this.harmonyLevel * 500;
            this.drones.forEach(drone => {
                drone.filter.frequency.setTargetAtTime(
                    filterFreq,
                    this.audioContext.currentTime,
                    0.5
                );
            });
            
            // Adjust volume with sound
            const targetVol = 0.15 + soundState.volume * 0.1;
            this.masterGain.gain.setTargetAtTime(
                targetVol,
                this.audioContext.currentTime,
                0.3
            );
        }
    }
    
    playPlantSound(plantType) {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Different sounds for different plants
        let frequencies;
        switch (plantType) {
            case 'flower':
                frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
                break;
            case 'mushroom':
                frequencies = [196.00, 246.94, 293.66]; // G3, B3, D4
                break;
            case 'crystal':
                frequencies = [880.00, 1108.73, 1318.51]; // A5, C#6, E6
                break;
            case 'vine':
                frequencies = [329.63, 392.00, 493.88]; // E4, G4, B4
                break;
            default:
                frequencies = [440, 550, 660];
        }
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const delay = i * 0.08;
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.08, now + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now + delay);
            osc.stop(now + delay + 0.9);
        });
    }
    
    playGrowSound() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    playHarmonySound() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Magical harmony chord
        const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major spread
        
        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
            gain.gain.setValueAtTime(0.06, now + 1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(now);
            osc.stop(now + 2.1);
        });
    }
    
    playEndSessionSound() {
        if (!this.isInitialized) return;
        
        const now = this.audioContext.currentTime;
        
        // Peaceful ending
        const frequencies = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
        
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
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

