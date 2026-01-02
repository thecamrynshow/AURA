/* ============================================
   THE DEEP — Audio System
   Breath detection and underwater ambience
   ============================================ */

class DeepAudio {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        
        this.masterGain = null;
        this.ambientGain = null;
        
        this.oscillators = [];
        
        // Breath detection (improved sensitivity)
        this.breathState = 'neutral'; // 'inhale', 'exhale', 'neutral'
        this.breathLevel = 0;
        this.breathThreshold = {
            inhale: 0.08,
            exhale: 0.04
        };
        this.calibrated = false;
        this.baselineNoise = 0;
        
        // Callbacks
        this.onBreathChange = null;
        this.onBreathLevel = null;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioContext.destination);
            
            // Ambient gain
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = 0.2;
            this.ambientGain.connect(this.masterGain);
            
            console.log('Deep audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    async requestMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.6;
            
            this.microphone.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            console.log('Microphone connected');
            return true;
        } catch (e) {
            console.warn('Microphone access denied:', e);
            return false;
        }
    }

    // Calibrate baseline noise
    async calibrate() {
        return new Promise((resolve) => {
            let samples = [];
            let sampleCount = 0;
            const targetSamples = 30;
            
            const sample = () => {
                if (sampleCount >= targetSamples) {
                    this.baselineNoise = samples.reduce((a, b) => a + b) / samples.length;
                    this.calibrated = true;
                    console.log('Calibrated baseline noise:', this.baselineNoise);
                    resolve(true);
                    return;
                }
                
                const level = this.getRawBreathLevel();
                samples.push(level);
                sampleCount++;
                
                setTimeout(sample, 100);
            };
            
            sample();
        });
    }

    // Get raw breath level from microphone
    getRawBreathLevel() {
        if (!this.analyser || !this.dataArray) return 0;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Focus on lower frequencies for breath detection
        let sum = 0;
        const breathRange = Math.floor(this.dataArray.length * 0.3);
        for (let i = 0; i < breathRange; i++) {
            sum += this.dataArray[i];
        }
        
        return sum / (breathRange * 255);
    }

    // Process breath and detect state
    processBreath() {
        if (!this.calibrated) return;
        
        const rawLevel = this.getRawBreathLevel();
        const adjustedLevel = Math.max(0, rawLevel - this.baselineNoise);
        
        // Smooth the breath level
        this.breathLevel = lerp(this.breathLevel, adjustedLevel, 0.3);
        
        // Detect breath state
        let newState = 'neutral';
        
        if (this.breathLevel > this.breathThreshold.inhale) {
            newState = 'inhale';
        } else if (this.breathLevel > this.breathThreshold.exhale) {
            newState = 'exhale';
        }
        
        // Notify on state change
        if (newState !== this.breathState) {
            this.breathState = newState;
            if (this.onBreathChange) {
                this.onBreathChange(newState);
            }
        }
        
        // Notify breath level
        if (this.onBreathLevel) {
            this.onBreathLevel(this.breathLevel);
        }
        
        return {
            state: this.breathState,
            level: this.breathLevel
        };
    }

    // Start ambient underwater sounds
    startAmbient(depth = 0) {
        if (!this.audioContext) return;
        
        this.stopAmbient();
        
        // Base frequencies for underwater ambience
        const baseFreqs = [55, 82.5, 110]; // Low rumble
        
        baseFreqs.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            gain.gain.value = 0.05 / (i + 1);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambientGain);
            
            osc.start();
            this.oscillators.push({ osc, gain, filter });
        });
        
        // Add some noise for water texture
        this.addWaterNoise();
    }

    addWaterNoise() {
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 100;
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.value = 0.02;
        
        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambientGain);
        
        whiteNoise.start();
        this.oscillators.push({ osc: whiteNoise, gain: noiseGain, filter: noiseFilter });
    }

    // Update ambient based on depth
    updateAmbientForDepth(depth) {
        if (!this.oscillators.length) return;
        
        // Deepen the sound as we go deeper
        const depthFactor = Math.min(depth / 1000, 1);
        
        this.oscillators.forEach(({ osc, filter }, i) => {
            if (osc.frequency) {
                // Lower frequency as depth increases
                const baseFreq = [55, 82.5, 110][i] || 55;
                osc.frequency.setTargetAtTime(
                    baseFreq * (1 - depthFactor * 0.3),
                    this.audioContext.currentTime,
                    0.5
                );
            }
            
            if (filter) {
                // Muffle sound at depth
                filter.frequency.setTargetAtTime(
                    200 - depthFactor * 150,
                    this.audioContext.currentTime,
                    0.5
                );
            }
        });
    }

    // Stop ambient sounds
    stopAmbient() {
        this.oscillators.forEach(({ osc, gain }) => {
            gain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => {
                try { osc.stop(); } catch (e) {}
            }, 500);
        });
        this.oscillators = [];
    }

    // Play discovery sound
    playDiscovery() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.6);
    }

    // Play completion sound
    playComplete() {
        if (!this.audioContext) return;
        
        const notes = [261.63, 329.63, 392, 523.25]; // C major arpeggio
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.audioContext.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
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

// Global audio instance
const deepAudio = new DeepAudio();

console.log('The Deep Audio loaded');

