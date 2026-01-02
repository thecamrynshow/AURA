/* Rhythm Islands - Audio System */

class RhythmAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        
        // Beat timing
        this.bpm = 80; // Calm tempo
        this.beatInterval = 60000 / this.bpm;
        this.lastBeatTime = 0;
        
        // Scales for melody
        this.scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major
        this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00]; // C pentatonic
        
        this.beatCallback = null;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Rhythm audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    startBeatLoop() {
        this.lastBeatTime = performance.now();
        this.scheduleBeat();
    }

    scheduleBeat() {
        const now = performance.now();
        const elapsed = now - this.lastBeatTime;
        
        if (elapsed >= this.beatInterval) {
            this.lastBeatTime = now - (elapsed % this.beatInterval);
            
            // Play beat sound
            this.playMetronome();
            
            // Notify callback
            if (this.beatCallback) {
                this.beatCallback();
            }
        }
        
        requestAnimationFrame(() => this.scheduleBeat());
    }

    playMetronome() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Play when player taps
    playTap(quality = 'good') {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        if (quality === 'perfect') {
            // Sparkly chord
            const freqs = [523, 659, 784];
            freqs.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const start = now + i * 0.03;
                gain.gain.setValueAtTime(0.15, start);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(start);
                osc.stop(start + 0.4);
            });
        } else if (quality === 'good') {
            // Single nice tone
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = this.pentatonic[Utils.randomInt(0, this.pentatonic.length - 1)];
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.3);
        } else {
            // Miss sound
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    // Island completion fanfare
    playIslandComplete() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const melody = [523, 659, 784, 1047];
        
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const start = now + i * 0.12;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.5);
        });
    }

    // Ambient ocean sounds
    startAmbient() {
        if (!this.audioContext) return;
        
        // Ocean wave noise
        const bufferSize = this.audioContext.sampleRate * 4;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        this.oceanNoise = this.audioContext.createBufferSource();
        this.oceanNoise.buffer = buffer;
        this.oceanNoise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        // LFO for wave-like volume modulation
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.15;
        lfoGain.gain.value = 0.015;
        
        this.oceanGain = this.audioContext.createGain();
        this.oceanGain.gain.value = 0.03;
        
        lfo.connect(lfoGain);
        lfoGain.connect(this.oceanGain.gain);
        
        this.oceanNoise.connect(filter);
        filter.connect(this.oceanGain);
        this.oceanGain.connect(this.masterGain);
        
        this.oceanNoise.start();
        lfo.start();
    }

    stopAmbient() {
        if (this.oceanNoise) {
            this.oceanGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => {
                this.oceanNoise.stop();
            }, 500);
        }
    }

    // Session complete
    playComplete() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const chords = [
            [261, 329, 392],
            [293, 369, 440],
            [329, 415, 493],
            [349, 440, 523]
        ];
        
        chords.forEach((chord, ci) => {
            chord.forEach((freq, fi) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const start = now + ci * 0.4;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, start + 0.8);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(start);
                osc.stop(start + 1);
            });
        });
    }

    setBpm(bpm) {
        this.bpm = bpm;
        this.beatInterval = 60000 / bpm;
    }

    getBeatInterval() {
        return this.beatInterval;
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

const rhythmAudio = new RhythmAudio();
console.log('Rhythm Audio loaded');

