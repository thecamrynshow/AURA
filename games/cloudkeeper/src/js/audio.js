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
        
        this.masterGain = null;
        
        // Breath detection (improved sensitivity)
        this.isBlowing = false;
        this.blowLevel = 0;
        this.blowThreshold = 0.05;
        this.baselineNoise = 0;
        this.calibrated = false;
        
        // Callbacks
        this.onBlowStart = null;
        this.onBlowEnd = null;
        this.onBlowLevel = null;
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
            this.analyser.smoothingTimeConstant = 0.5;
            
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Quick calibration
            await this.calibrate();
            
            console.log('Microphone connected');
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
        
        // Smooth
        this.blowLevel = lerp(this.blowLevel, adjustedLevel, 0.4);
        
        // Detect blowing
        const wasBlowing = this.isBlowing;
        this.isBlowing = this.blowLevel > this.blowThreshold;
        
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

