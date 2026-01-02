/* ============================================
   Pulse — Audio System
   Breath detection & dynamic music
   ============================================ */

class BreathDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.timeDataArray = null;
        this.isActive = false;
        
        // Detect mobile device
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Breath state
        this.breathLevel = 0;
        this.smoothedLevel = 0;
        this.isInhaling = false;
        this.breathPhase = 0; // 0-1, where 0-0.5 is inhale, 0.5-1 is exhale
        
        // Detection parameters (mobile-optimized)
        this.sensitivity = this.isMobile ? 3.0 : 1.5;
        this.smoothing = this.isMobile ? 0.3 : 0.2;
        this.threshold = this.isMobile ? 0.015 : 0.04;
        this.lastPeakTime = 0;
        this.breathCycle = [];
        this.avgBreathDuration = 4000; // 4 seconds default
        
        console.log(`Pulse: ${this.isMobile ? 'Mobile' : 'Desktop'} mode, threshold: ${this.threshold}`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: { 
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    } 
                });
            } catch (constraintError) {
                // Fallback for mobile devices that don't support these constraints
                console.log('Using fallback audio constraints for mobile');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isMobile ? 1024 : 512;
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.4 : 0.6;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
            this.isActive = true;
            console.log(`Microphone connected (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
            return true;
        } catch (error) {
            console.error('Microphone access denied:', error);
            return false;
        }
    }

    update() {
        if (!this.isActive || !this.analyser) return;

        let rawLevel;
        
        // Use time-domain RMS for mobile (more reliable for breath)
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            rawLevel = Math.sqrt(sum / this.timeDataArray.length) * this.sensitivity;
        } else {
            // Desktop: use frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            let sum = 0;
            const lowFreqBins = Math.floor(this.dataArray.length * 0.4);
            for (let i = 0; i < lowFreqBins; i++) {
                sum += this.dataArray[i];
            }
            rawLevel = (sum / lowFreqBins / 255) * this.sensitivity;
        }
        
        this.breathLevel = rawLevel;
        this.smoothedLevel = Utils.lerp(this.smoothedLevel, this.breathLevel, this.smoothing);
        
        // Detect breath phase changes
        const now = Date.now();
        if (this.smoothedLevel > this.threshold) {
            if (!this.isInhaling) {
                this.isInhaling = true;
                
                // Record breath cycle
                if (this.lastPeakTime > 0) {
                    const duration = now - this.lastPeakTime;
                    this.breathCycle.push(duration);
                    if (this.breathCycle.length > 5) {
                        this.breathCycle.shift();
                    }
                    // Calculate average breath duration
                    this.avgBreathDuration = this.breathCycle.reduce((a, b) => a + b, 0) / this.breathCycle.length;
                }
                this.lastPeakTime = now;
            }
        } else {
            if (this.isInhaling && this.smoothedLevel < this.threshold * 0.5) {
                this.isInhaling = false;
            }
        }
        
        // Update breath phase (continuous 0-1 cycle)
        if (this.lastPeakTime > 0) {
            const elapsed = now - this.lastPeakTime;
            this.breathPhase = (elapsed / this.avgBreathDuration) % 1;
        }
    }

    getBreathLevel() {
        return this.smoothedLevel;
    }

    getBreathPhase() {
        return this.breathPhase;
    }

    isBreathing() {
        return this.smoothedLevel > this.threshold;
    }

    getBreathBPM() {
        if (this.avgBreathDuration > 0) {
            return Math.round(60000 / this.avgBreathDuration);
        }
        return 15; // Default 15 breaths per minute
    }

    stop() {
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isActive = false;
    }
}

class AudioEngine {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.isInitialized = false;
        
        // Oscillators for rhythm tones
        this.bassOsc = null;
        this.bassGain = null;
        this.padOsc = null;
        this.padGain = null;
        
        // Beat sounds
        this.beatScheduled = [];
    }

    async init() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        
        // Master gain
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.context.destination);
        
        // Create ambient pad
        this.createAmbientPad();
        
        this.isInitialized = true;
    }

    createAmbientPad() {
        // Deep ambient pad
        this.padOsc = this.context.createOscillator();
        this.padOsc.type = 'sine';
        this.padOsc.frequency.value = 55; // Low A
        
        this.padGain = this.context.createGain();
        this.padGain.gain.value = 0;
        
        // Add subtle movement with LFO
        const lfo = this.context.createOscillator();
        lfo.frequency.value = 0.1;
        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(this.padOsc.frequency);
        lfo.start();
        
        // Filter for warmth
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 1;
        
        this.padOsc.connect(filter);
        filter.connect(this.padGain);
        this.padGain.connect(this.masterGain);
        this.padOsc.start();
    }

    setAmbientLevel(level) {
        if (this.padGain) {
            const targetGain = Utils.clamp(level * 0.15, 0, 0.15);
            this.padGain.gain.setTargetAtTime(targetGain, this.context.currentTime, 0.3);
        }
    }

    playBeat(type = 'normal', intensity = 0.5) {
        if (!this.isInitialized) return;
        
        const now = this.context.currentTime;
        
        // Create beat sound based on type
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        switch (type) {
            case 'hit':
                // Perfect hit - bright, satisfying
                osc.type = 'triangle';
                osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.3 * intensity, now);
                gain.gain.exponentialDecayTo = 0.001;
                gain.gain.setTargetAtTime(0.001, now + 0.1, 0.1);
                
                // Add harmonic
                const osc2 = this.context.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.value = 880;
                const gain2 = this.context.createGain();
                gain2.gain.setValueAtTime(0.15 * intensity, now);
                gain2.gain.setTargetAtTime(0.001, now + 0.08, 0.05);
                osc2.connect(gain2);
                gain2.connect(this.masterGain);
                osc2.start(now);
                osc2.stop(now + 0.2);
                break;
                
            case 'miss':
                // Miss - soft, muted
                osc.type = 'sine';
                osc.frequency.value = 220;
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.setTargetAtTime(0.001, now + 0.1, 0.05);
                break;
                
            case 'pulse':
                // Pulse beat - rhythmic kick
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                gain.gain.setValueAtTime(0.25 * intensity, now);
                gain.gain.setTargetAtTime(0.001, now + 0.15, 0.08);
                break;
                
            default:
                // Normal beat
                osc.type = 'sine';
                osc.frequency.value = 330;
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.setTargetAtTime(0.001, now + 0.1, 0.05);
        }
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playNote(frequency, duration = 0.3, type = 'sine') {
        if (!this.isInitialized) return;
        
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.setTargetAtTime(0.001, now + duration * 0.8, duration * 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }

    // Play a chord based on flow state
    playFlowChord(flow) {
        if (!this.isInitialized) return;
        
        const baseFreq = 220;
        const now = this.context.currentTime;
        
        // Choose chord quality based on flow
        let intervals;
        if (flow > 0.7) {
            intervals = [1, 1.25, 1.5, 2]; // Major with octave
        } else if (flow > 0.4) {
            intervals = [1, 1.2, 1.5]; // Minor
        } else {
            intervals = [1, 1.5]; // Power chord
        }
        
        intervals.forEach((interval, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = baseFreq * interval;
            
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.setTargetAtTime(0.001, now + 0.8, 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + i * 0.02);
            osc.stop(now + 1.2);
        });
    }

    stop() {
        if (this.padOsc) {
            this.padOsc.stop();
        }
        if (this.context) {
            this.context.close();
        }
    }
}


