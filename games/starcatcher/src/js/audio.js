/* Star Catcher - Audio System */

class StarAudio {
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
        this.breathThreshold = this.isMobile ? 0.02 : 0.05;
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        this.baselineNoise = 0;
        this.calibrated = false;
        
        // Callbacks
        this.onBreathLevel = null;
        
        console.log(`Star Audio: ${this.isMobile ? 'Mobile' : 'Desktop'} mode`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Star audio initialized');
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
        
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            return Math.sqrt(sum / this.timeDataArray.length) * this.sensitivityMultiplier;
        }
        
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
        
        this.smoothedLevel = Utils.lerp(this.smoothedLevel, adjustedLevel, 0.3);
        this.breathLevel = this.smoothedLevel;
        
        if (this.onBreathLevel) {
            this.onBreathLevel(this.breathLevel);
        }
        
        return this.breathLevel;
    }

    // Catch star sound
    playCatch() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // Sparkle arpeggio
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.05;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Miss star sound
    playMiss() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Streak bonus sound
    playStreak(streakLevel) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const baseFreq = 400 + streakLevel * 50;
        
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = baseFreq * (1 + i * 0.5);
            
            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + 0.4);
        }
    }

    // Ambient night sounds
    startAmbient() {
        if (!this.audioContext) return;
        
        // Soft pad
        this.ambientOsc = this.audioContext.createOscillator();
        const filter = this.audioContext.createBiquadFilter();
        this.ambientGain = this.audioContext.createGain();
        
        this.ambientOsc.type = 'triangle';
        this.ambientOsc.frequency.value = 110;
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        
        this.ambientGain.gain.value = 0.03;
        
        this.ambientOsc.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        
        this.ambientOsc.start();
    }

    stopAmbient() {
        if (this.ambientOsc) {
            this.ambientGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
            setTimeout(() => {
                this.ambientOsc.stop();
            }, 500);
        }
    }

    // Completion celebration
    playComplete() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const melody = [523, 659, 784, 880, 1047, 880, 784, 1047];
        
        melody.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
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

const starAudio = new StarAudio();
console.log('Star Audio loaded');

