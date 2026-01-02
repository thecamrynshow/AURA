/* ============================================
   CLOUD KEEPER — Audio System
   Gentle sounds and breath detection
   ============================================ */

class CloudAudio {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.timeDataArray = null;
        
        this.masterGain = null;
        
        // Detect mobile device
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Breath detection (mobile devices need MUCH lower threshold)
        this.isBlowing = false;
        this.blowLevel = 0;
        // Mobile mics are often less sensitive, so use lower threshold
        this.blowThreshold = this.isMobile ? 0.015 : 0.05;
        this.baselineNoise = 0;
        this.calibrated = false;
        
        // Sensitivity multiplier for mobile
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        
        // Callbacks
        this.onBlowStart = null;
        this.onBlowEnd = null;
        this.onBlowLevel = null;
        
        console.log(`Cloud Keeper: ${this.isMobile ? 'Mobile' : 'Desktop'} mode, threshold: ${this.blowThreshold}`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Cloud audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    async requestMicrophone() {
        try {
            // Mobile devices may not support all constraints, so we try both
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
                // Fallback for devices that don't support these constraints
                console.log('Using fallback audio constraints for mobile');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            // Use larger FFT for better low-frequency detection on mobile
            this.analyser.fftSize = this.isMobile ? 1024 : 512;
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.3 : 0.5;
            
            // Increase sensitivity range
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
            // Quick calibration
            await this.calibrate();
            
            console.log(`Microphone connected (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
            return true;
        } catch (e) {
            console.warn('Microphone access denied:', e);
            return false;
        }
    }

    async calibrate() {
        return new Promise((resolve) => {
            let samples = [];
            let count = 0;
            
            const sample = () => {
                if (count >= 20) {
                    this.baselineNoise = samples.reduce((a, b) => a + b) / samples.length;
                    this.calibrated = true;
                    console.log('Calibrated:', this.baselineNoise);
                    resolve(true);
                    return;
                }
                
                const level = this.getRawLevel();
                samples.push(level);
                count++;
                setTimeout(sample, 50);
            };
            
            sample();
        });
    }

    getRawLevel() {
        if (!this.analyser || !this.dataArray) return 0;
        
        // Use time-domain for more reliable breath detection on mobile
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            
            // Calculate RMS (root mean square) for volume
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            const rms = Math.sqrt(sum / this.timeDataArray.length);
            
            // Apply sensitivity multiplier
            return rms * this.sensitivityMultiplier;
        }
        
        // Desktop: use frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Focus on breath frequencies (lower range)
        let sum = 0;
        const range = Math.floor(this.dataArray.length * 0.4);
        for (let i = 0; i < range; i++) {
            sum += this.dataArray[i];
        }
        
        return sum / (range * 255);
    }

    processBreath() {
        if (!this.calibrated) return;
        
        const rawLevel = this.getRawLevel();
        const adjustedLevel = Math.max(0, rawLevel - this.baselineNoise);
        
        // Faster smoothing on mobile for more responsive feel
        const smoothFactor = this.isMobile ? 0.5 : 0.4;
        this.blowLevel = lerp(this.blowLevel, adjustedLevel, smoothFactor);
        
        // Detect blowing with hysteresis to prevent flickering
        const wasBlowing = this.isBlowing;
        const onThreshold = this.blowThreshold;
        const offThreshold = this.blowThreshold * 0.6; // Lower threshold to stop
        
        if (!this.isBlowing && this.blowLevel > onThreshold) {
            this.isBlowing = true;
        } else if (this.isBlowing && this.blowLevel < offThreshold) {
            this.isBlowing = false;
        }
        
        // Callbacks
        if (this.isBlowing && !wasBlowing && this.onBlowStart) {
            this.onBlowStart();
        }
        
        if (!this.isBlowing && wasBlowing && this.onBlowEnd) {
            this.onBlowEnd();
        }
        
        if (this.onBlowLevel) {
            this.onBlowLevel(this.blowLevel);
        }
        
        return this.blowLevel;
    }

    // Play gentle whoosh sound
    playWhoosh() {
        if (!this.audioContext) return;
        
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / buffer.length);
        }
        
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        noise.start();
    }

    // Play gentle chime
    playChime(note = 0) {
        if (!this.audioContext) return;
        
        const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const freq = frequencies[note % frequencies.length];
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    // Play star found sound
    playStarFound() {
        if (!this.audioContext) return;
        
        const notes = [523.25, 659.25, 783.99]; // C, E, G
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.audioContext.currentTime + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    }

    // Play celebration
    playCelebration() {
        if (!this.audioContext) return;
        
        const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.5];
        
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = this.audioContext.currentTime + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

const cloudAudio = new CloudAudio();

console.log('Cloud Keeper Audio loaded');

