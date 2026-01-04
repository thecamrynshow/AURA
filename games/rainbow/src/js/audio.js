/**
 * Rainbow Painter - Audio System
 * Breath detection and sound effects
 */

class BreathDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        
        this.isActive = false;
        this.volume = 0;
        this.smoothedVolume = 0;
        
        // Breath detection
        this.isBlowing = false;
        this.blowStartTime = 0;
        this.blowDuration = 0;
        
        // Calibration
        this.noiseFloor = 0.02;
        this.blowThreshold = 0.08;
        this.calibrationSamples = [];
        this.isCalibrating = true;
        this.calibrationDuration = 2000;
        this.calibrationStart = 0;
        
        // Mobile sensitivity boost
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.5;
        
        // Hysteresis for stable detection
        this.blowOnThreshold = 0.06;
        this.blowOffThreshold = 0.04;
    }
    
    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: true
                } 
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.3;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.isActive = true;
            this.calibrationStart = performance.now();
            
            console.log('🎤 Breath detector ready');
            return true;
        } catch (err) {
            console.error('Microphone error:', err);
            return false;
        }
    }
    
    update(deltaTime) {
        if (!this.isActive || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate RMS volume (better for breath detection)
        let sum = 0;
        const len = this.dataArray.length;
        for (let i = 0; i < len; i++) {
            const normalized = this.dataArray[i] / 255;
            sum += normalized * normalized;
        }
        this.volume = Math.sqrt(sum / len) * this.sensitivityMultiplier;
        
        // Smooth the volume
        this.smoothedVolume = Utils.lerp(this.smoothedVolume, this.volume, 0.3);
        
        // Calibration phase
        if (this.isCalibrating) {
            this.calibrationSamples.push(this.volume);
            
            if (performance.now() - this.calibrationStart > this.calibrationDuration) {
                this.finishCalibration();
            }
            return;
        }
        
        // Detect blowing with hysteresis
        const adjustedVolume = this.smoothedVolume - this.noiseFloor;
        
        if (!this.isBlowing && adjustedVolume > this.blowOnThreshold) {
            this.isBlowing = true;
            this.blowStartTime = performance.now();
            GameEvents.emit('blowStart', { volume: adjustedVolume });
        } else if (this.isBlowing && adjustedVolume < this.blowOffThreshold) {
            this.isBlowing = false;
            this.blowDuration = performance.now() - this.blowStartTime;
            GameEvents.emit('blowEnd', { duration: this.blowDuration });
        }
        
        // Update blow duration while blowing
        if (this.isBlowing) {
            this.blowDuration = performance.now() - this.blowStartTime;
        }
        
        // Emit continuous update
        GameEvents.emit('breathUpdate', {
            volume: this.smoothedVolume,
            adjustedVolume: Math.max(0, adjustedVolume),
            isBlowing: this.isBlowing,
            blowDuration: this.blowDuration
        });
    }
    
    finishCalibration() {
        if (this.calibrationSamples.length > 0) {
            // Use 75th percentile as noise floor
            const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
            const idx = Math.floor(sorted.length * 0.75);
            this.noiseFloor = sorted[idx] * 1.2;
            
            // Adjust thresholds based on noise floor
            this.blowOnThreshold = Math.max(0.05, this.noiseFloor + 0.04);
            this.blowOffThreshold = Math.max(0.03, this.noiseFloor + 0.02);
        }
        
        this.isCalibrating = false;
        console.log(`🎤 Calibrated - noise floor: ${this.noiseFloor.toFixed(3)}`);
        GameEvents.emit('calibrationComplete');
    }
    
    getBreathIntensity() {
        if (!this.isBlowing) return 0;
        const adjusted = Math.max(0, this.smoothedVolume - this.noiseFloor);
        return Utils.clamp(adjusted / 0.3, 0, 1);
    }
    
    destroy() {
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isActive = false;
    }
}

class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isReady = false;
    }
    
    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.4;
        this.masterGain.connect(this.audioContext.destination);
        this.isReady = true;
    }
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    // Play a colorful chime based on rainbow color
    playColorChime(colorIndex) {
        if (!this.isReady) return;
        
        // Musical notes for each color (pentatonic scale feels magical)
        const frequencies = [
            523.25,  // C5 - Red
            587.33,  // D5 - Orange  
            659.25,  // E5 - Yellow
            783.99,  // G5 - Green
            880.00,  // A5 - Blue
            987.77,  // B5 - Indigo
            1046.50  // C6 - Violet
        ];
        
        const freq = frequencies[colorIndex] || 523.25;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Add slight detune for warmth
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 1.005;
        osc2.detune.value = 5;
        
        const gain2 = this.audioContext.createGain();
        gain2.gain.value = 0.3;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        gain2.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
        
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc.start();
        osc2.start();
        osc.stop(this.audioContext.currentTime + 1.5);
        osc2.stop(this.audioContext.currentTime + 1.2);
    }
    
    // Play rainbow complete celebration
    playRainbowComplete() {
        if (!this.isReady) return;
        
        // Play ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 0.8);
            }, i * 150);
        });
        
        // Add a shimmer
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.value = Utils.random(1500, 3000);
                    
                    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    osc.connect(gain);
                    gain.connect(this.masterGain);
                    
                    osc.start();
                    osc.stop(this.audioContext.currentTime + 0.3);
                }, i * 50);
            }
        }, 600);
    }
}

