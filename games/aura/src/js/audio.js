/**
 * Project AURA - Dynamic Audio System
 * Music tempo slows as breath slows, harmonics increase with coherence
 */

class AudioSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.initialized = false;
        
        // Oscillators and nodes
        this.drones = [];
        this.melodicLayer = null;
        this.bassLayer = null;
        this.ambientLayer = null;
        
        // State
        this.baseFrequency = 110; // A2
        this.currentTempo = 60;
        this.targetTempo = 60;
        this.coherenceLevel = 0.5;
        this.breathLevel = 0.5;
        
        // Scales for generative music
        this.scale = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
        this.pentatonic = [0, 2, 4, 7, 9];    // Pentatonic scale
        
        // Effects
        this.reverb = null;
        this.delay = null;
        this.filter = null;
        
        // Timing
        this.lastNoteTime = 0;
        this.noteInterval = 2000;
        this.melodyPhase = 0;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.context.destination);
            
            // Create effects chain
            await this.createEffects();
            
            // Create drone layers
            this.createDrones();
            
            // Create ambient pad
            this.createAmbientPad();
            
            this.initialized = true;
            console.log('Audio system initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    async createEffects() {
        // Create reverb using convolution
        this.reverb = this.context.createConvolver();
        const reverbBuffer = await this.createReverbImpulse(3, 2);
        this.reverb.buffer = reverbBuffer;
        
        // Create delay
        this.delay = this.context.createDelay(2);
        this.delay.delayTime.value = 0.4;
        
        const delayFeedback = this.context.createGain();
        delayFeedback.gain.value = 0.3;
        
        const delayFilter = this.context.createBiquadFilter();
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 2000;
        
        this.delay.connect(delayFeedback);
        delayFeedback.connect(delayFilter);
        delayFilter.connect(this.delay);
        
        // Create main filter
        this.filter = this.context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 2000;
        this.filter.Q.value = 1;
        
        // Connect effects chain
        this.filter.connect(this.reverb);
        this.reverb.connect(this.masterGain);
        this.delay.connect(this.masterGain);
    }

    createReverbImpulse(duration, decay) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.context.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        
        return buffer;
    }

    createDrones() {
        // Create layered drone sounds
        const frequencies = [
            this.baseFrequency,           // Root
            this.baseFrequency * 1.5,     // Perfect fifth
            this.baseFrequency * 2,       // Octave
        ];
        
        frequencies.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0;
            
            // Add slight detuning for warmth
            const detune = this.context.createOscillator();
            const detuneGain = this.context.createGain();
            detune.type = 'sine';
            detune.frequency.value = freq * 1.003;
            detuneGain.gain.value = 0;
            
            osc.connect(gain);
            detune.connect(detuneGain);
            gain.connect(this.filter);
            detuneGain.connect(this.filter);
            
            osc.start();
            detune.start();
            
            this.drones.push({ osc, gain, detune, detuneGain, baseFreq: freq });
        });
    }

    createAmbientPad() {
        // Create a soft ambient pad using multiple oscillators
        this.ambientOscillators = [];
        
        const padFreqs = [
            this.baseFrequency * 4,
            this.baseFrequency * 5,
            this.baseFrequency * 6,
        ];
        
        padFreqs.forEach(freq => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            
            gain.gain.value = 0;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.reverb);
            
            osc.start();
            
            this.ambientOscillators.push({ osc, gain, filter, baseFreq: freq });
        });
    }

    start() {
        if (!this.initialized) return;
        
        // Resume context if suspended
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        
        // Fade in drones
        const now = this.context.currentTime;
        this.drones.forEach((drone, i) => {
            const volume = 0.08 - i * 0.02;
            drone.gain.gain.setTargetAtTime(volume, now, 2);
            drone.detuneGain.gain.setTargetAtTime(volume * 0.5, now, 2);
        });
        
        // Fade in ambient
        this.ambientOscillators.forEach((pad, i) => {
            pad.gain.gain.setTargetAtTime(0.02, now, 3);
        });
    }

    stop() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Fade out all
        this.drones.forEach(drone => {
            drone.gain.gain.setTargetAtTime(0, now, 1);
            drone.detuneGain.gain.setTargetAtTime(0, now, 1);
        });
        
        this.ambientOscillators.forEach(pad => {
            pad.gain.gain.setTargetAtTime(0, now, 1);
        });
    }

    update(deltaTime, breathState) {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Update state from breath
        this.coherenceLevel = (breathState.coherence || 50) / 100;
        this.breathLevel = breathState.level || 0.5;
        
        // Adjust tempo based on breath coherence
        this.targetTempo = Utils.lerp(40, 80, 1 - this.coherenceLevel);
        this.currentTempo = Utils.lerp(this.currentTempo, this.targetTempo, 0.01);
        
        // Update filter based on breath state
        const filterFreq = Utils.lerp(800, 4000, this.coherenceLevel);
        this.filter.frequency.setTargetAtTime(filterFreq, now, 0.5);
        
        // Update drone volumes based on breath level
        this.drones.forEach((drone, i) => {
            const baseVol = 0.08 - i * 0.02;
            const breathMod = 1 + (this.breathLevel - 0.5) * 0.5;
            const coherenceMod = 0.5 + this.coherenceLevel * 0.5;
            drone.gain.gain.setTargetAtTime(baseVol * breathMod * coherenceMod, now, 0.3);
        });
        
        // Update ambient pad based on coherence (more harmonic when calm)
        this.ambientOscillators.forEach((pad, i) => {
            const volume = 0.01 + this.coherenceLevel * 0.03;
            pad.gain.gain.setTargetAtTime(volume, now, 0.5);
            pad.filter.frequency.setTargetAtTime(400 + this.coherenceLevel * 1200, now, 0.5);
        });
        
        // Play melodic notes occasionally when coherent
        this.melodyPhase += deltaTime;
        this.noteInterval = Utils.lerp(3000, 1000, this.coherenceLevel);
        
        if (this.melodyPhase > this.noteInterval && this.coherenceLevel > 0.4) {
            this.playMelodyNote();
            this.melodyPhase = 0;
        }
    }

    playMelodyNote() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Choose note from pentatonic scale
        const noteIndex = Math.floor(Math.random() * this.pentatonic.length);
        const semitones = this.pentatonic[noteIndex];
        const octave = Math.floor(Math.random() * 2) + 2;
        const frequency = this.baseFrequency * Math.pow(2, octave + semitones / 12);
        
        // Create note
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = frequency;
        
        const volume = 0.03 + this.coherenceLevel * 0.04;
        const duration = Utils.lerp(0.5, 2, this.coherenceLevel);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gain);
        gain.connect(this.delay);
        gain.connect(this.reverb);
        
        osc.start(now);
        osc.stop(now + duration + 0.1);
    }

    // Special sound effects for challenges
    playWindSound(intensity) {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Create wind using filtered noise
        const bufferSize = this.context.sampleRate * 2;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.context.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        
        const gain = this.context.createGain();
        gain.gain.value = intensity * 0.1;
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start();
        
        // Modulate for wind effect
        const lfo = this.context.createOscillator();
        const lfoGain = this.context.createGain();
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        
        return {
            stop: () => {
                gain.gain.setTargetAtTime(0, this.context.currentTime, 0.5);
                setTimeout(() => {
                    noise.stop();
                    lfo.stop();
                }, 1000);
            },
            setIntensity: (val) => {
                gain.gain.setTargetAtTime(val * 0.1, this.context.currentTime, 0.1);
            }
        };
    }

    playCrystalTone(index, synced = false) {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Crystal frequencies based on index
        const frequencies = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
        const freq = frequencies[index % frequencies.length];
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const volume = synced ? 0.15 : 0.08;
        const duration = synced ? 3 : 1;
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gain);
        gain.connect(this.reverb);
        
        // Add harmonics for synced crystals
        if (synced) {
            const harmonic = this.context.createOscillator();
            const harmGain = this.context.createGain();
            harmonic.type = 'sine';
            harmonic.frequency.value = freq * 2;
            harmGain.gain.setValueAtTime(0.05, now);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            harmonic.connect(harmGain);
            harmGain.connect(this.reverb);
            harmonic.start(now);
            harmonic.stop(now + duration);
        }
        
        osc.start(now);
        osc.stop(now + duration + 0.1);
    }

    playAnimalApproach(distance) {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Soft, warm tone that gets louder as animal approaches
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 330; // E4 - warm, friendly tone
        
        const volume = (1 - distance) * 0.08;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 2);
        
        osc.connect(gain);
        gain.connect(this.reverb);
        
        osc.start(now);
        osc.stop(now + 2.5);
    }

    playAuroraAmbient() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Create ethereal aurora soundscape with layered pads
        const frequencies = [
            { freq: 82.41, type: 'sine', vol: 0.04 },      // E2 - deep bass drone
            { freq: 123.47, type: 'sine', vol: 0.03 },     // B2 - fifth
            { freq: 164.81, type: 'triangle', vol: 0.02 }, // E3 - octave
            { freq: 329.63, type: 'sine', vol: 0.015 },    // E4 - high shimmer
            { freq: 493.88, type: 'sine', vol: 0.01 },     // B4 - ethereal high
        ];
        
        this.auroraOscillators = [];
        
        frequencies.forEach((note, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            osc.type = note.type;
            osc.frequency.value = note.freq;
            
            // Add slight detuning for ethereal effect
            osc.detune.value = Math.sin(i) * 5;
            
            filter.type = 'lowpass';
            filter.frequency.value = 1000 + i * 200;
            filter.Q.value = 0.5;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(note.vol, now + 3);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.reverb);
            
            // Add slow LFO modulation to frequency for shimmer
            const lfo = this.context.createOscillator();
            const lfoGain = this.context.createGain();
            lfo.frequency.value = 0.1 + i * 0.05;
            lfoGain.gain.value = note.freq * 0.01;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start(now);
            
            osc.start(now);
            
            this.auroraOscillators.push({ osc, gain, lfo, filter });
        });
        
        // Add sparkling high notes occasionally
        this.auroraSparkleInterval = setInterval(() => {
            if (Math.random() < 0.3) {
                this.playAuroraSparkle();
            }
        }, 2000);
        
        return {
            stop: () => {
                const stopTime = this.context.currentTime;
                this.auroraOscillators.forEach(({ osc, gain, lfo }) => {
                    gain.gain.setTargetAtTime(0, stopTime, 1);
                    setTimeout(() => {
                        osc.stop();
                        lfo.stop();
                    }, 3000);
                });
                if (this.auroraSparkleInterval) {
                    clearInterval(this.auroraSparkleInterval);
                }
            }
        };
    }

    playAuroraSparkle() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // High, delicate sparkle notes
        const sparkleFreqs = [1318.51, 1567.98, 1975.53, 2349.32]; // E6, G6, B6, D7
        const freq = sparkleFreqs[Math.floor(Math.random() * sparkleFreqs.length)];
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
        
        osc.connect(gain);
        gain.connect(this.reverb);
        
        osc.start(now);
        osc.stop(now + 2.5);
    }

    playSuccessChime() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C major arpeggio
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
            
            osc.connect(gain);
            gain.connect(this.reverb);
            
            osc.start(startTime);
            osc.stop(startTime + 2);
        });
    }

    playEndSessionSound() {
        if (!this.initialized) return;
        
        const now = this.context.currentTime;
        
        // Soft, resolving chord
        const frequencies = [220, 277.18, 329.63, 440]; // A minor 7
        
        frequencies.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 1);
            gain.gain.linearRampToValueAtTime(0.06, now + 4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 8);
            
            osc.connect(gain);
            gain.connect(this.reverb);
            
            osc.start(now);
            osc.stop(now + 9);
        });
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(volume * 0.3, this.context.currentTime, 0.5);
        }
    }

    destroy() {
        this.stop();
        if (this.context) {
            this.context.close();
        }
    }
}
