/* Dragon's Breath - Audio System */

class DragonAudio {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.timeDataArray = null;
        
        this.masterGain = null;
        
        // Mobile detection
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Breath detection
        this.breathLevel = 0;
        this.smoothedLevel = 0;
        this.isBreathing = false;
        this.breathThreshold = this.isMobile ? 0.02 : 0.05;
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        this.baselineNoise = 0;
        this.calibrated = false;
        
        // Callbacks
        this.onBreathLevel = null;
        
        console.log(`Dragon Audio: ${this.isMobile ? 'Mobile' : 'Desktop'} mode`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Dragon audio initialized');
            return true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
            return false;
        }
    }

    async requestMicrophone() {
        try {
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
                console.log('Using fallback audio constraints');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isMobile ? 1024 : 512;
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.4 : 0.5;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
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
        
        // Use time-domain RMS for mobile
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            return Math.sqrt(sum / this.timeDataArray.length) * this.sensitivityMultiplier;
        }
        
        // Desktop: frequency data
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        const range = Math.floor(this.dataArray.length * 0.4);
        for (let i = 0; i < range; i++) {
            sum += this.dataArray[i];
        }
        return sum / (range * 255);
    }

    processBreath() {
        if (!this.calibrated) return 0;
        
        const rawLevel = this.getRawLevel();
        const adjustedLevel = Math.max(0, rawLevel - this.baselineNoise);
        
        // Smooth
        this.smoothedLevel = Utils.lerp(this.smoothedLevel, adjustedLevel, 0.3);
        this.breathLevel = this.smoothedLevel;
        
        // Detect breathing
        const wasBreathing = this.isBreathing;
        this.isBreathing = this.breathLevel > this.breathThreshold;
        
        if (this.onBreathLevel) {
            this.onBreathLevel(this.breathLevel, this.isBreathing);
        }
        
        return this.breathLevel;
    }

    // Play collection sound
    playCollect(type = 'star') {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        if (type === 'star') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        } else if (type === 'gem') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, now);
            osc.frequency.exponentialRampToValueAtTime(1047, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        }
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Play flap/rise sound
    playFlap() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Whoosh sound
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 0.5;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
    }

    // Level complete celebration
    playLevelComplete() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523, 659, 784, 1047]; // C major
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.12;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        });
    }

    // Ambient wind
    startAmbient() {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * 4;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        this.ambientNoise = this.audioContext.createBufferSource();
        this.ambientNoise.buffer = buffer;
        this.ambientNoise.loop = true;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0.03;
        
        this.ambientNoise.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        this.ambientNoise.start();
    }

    stopAmbient() {
        if (this.ambientNoise) {
            this.ambientGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => {
                this.ambientNoise.stop();
            }, 500);
        }
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

const dragonAudio = new DragonAudio();
console.log('Dragon Audio loaded');


