/**
 * Echo Garden - Sound Detection System
 * Detects humming, breathing, and pitch
 */

class SoundDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.bufferLength = 0;
        
        // Sound state
        this.volume = 0;
        this.smoothedVolume = 0;
        this.pitch = 0;
        this.smoothedPitch = 0;
        this.soundType = 'silence'; // silence, breath, hum, voice
        
        // Detection thresholds
        this.silenceThreshold = 0.02;
        this.breathThreshold = 0.08;
        this.humThreshold = 0.15;
        
        // Pitch tracking
        this.pitchHistory = [];
        this.pitchStability = 0;
        
        // Hum detection
        this.humDuration = 0;
        this.isHumming = false;
        this.humStartTime = 0;
        
        // Calibration
        this.baselineVolume = 0.02;
        this.isCalibrating = true;
        this.calibrationSamples = [];
        
        this.enabled = false;
        this.simulated = false;
    }
    
    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Float32Array(this.bufferLength);
            
            this.enabled = true;
            this.startCalibration();
            
            console.log('Sound detector initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize sound detector:', error);
            this.enableSimulation();
            return false;
        }
    }
    
    enableSimulation() {
        console.log('Using simulated sound detection');
        this.simulated = true;
        this.enabled = true;
        this.isCalibrating = false;
        this.simulationPhase = 0;
    }
    
    startCalibration() {
        this.isCalibrating = true;
        this.calibrationSamples = [];
        
        setTimeout(() => {
            this.finishCalibration();
        }, 2000);
    }
    
    finishCalibration() {
        if (this.calibrationSamples.length > 0) {
            const avg = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
            this.baselineVolume = avg * 1.2; // Set threshold slightly above baseline
            this.silenceThreshold = this.baselineVolume;
            this.breathThreshold = this.baselineVolume * 3;
            this.humThreshold = this.baselineVolume * 6;
        }
        
        this.isCalibrating = false;
        console.log('Sound calibration complete', {
            baseline: this.baselineVolume,
            breathThreshold: this.breathThreshold,
            humThreshold: this.humThreshold
        });
        
        GameEvents.emit('calibrationComplete');
    }
    
    update(deltaTime) {
        if (!this.enabled) return;
        
        if (this.simulated) {
            this.updateSimulated(deltaTime);
        } else {
            this.updateFromMic();
        }
        
        // Smooth values
        this.smoothedVolume = Utils.lerp(this.smoothedVolume, this.volume, 0.2);
        this.smoothedPitch = Utils.lerp(this.smoothedPitch, this.pitch, 0.1);
        
        // Detect sound type
        this.detectSoundType(deltaTime);
        
        // Track pitch stability
        this.updatePitchStability();
        
        // Emit state update
        GameEvents.emit('soundUpdate', {
            volume: this.smoothedVolume,
            pitch: this.smoothedPitch,
            soundType: this.soundType,
            isHumming: this.isHumming,
            humDuration: this.humDuration,
            pitchStability: this.pitchStability,
            isCalibrating: this.isCalibrating
        });
    }
    
    updateFromMic() {
        // Get time domain data for volume
        this.analyser.getFloatTimeDomainData(this.dataArray);
        
        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        this.volume = Math.sqrt(sum / this.bufferLength);
        
        if (this.isCalibrating) {
            this.calibrationSamples.push(this.volume);
        }
        
        // Detect pitch using autocorrelation
        if (this.volume > this.breathThreshold) {
            this.pitch = this.detectPitch();
        }
    }
    
    updateSimulated(deltaTime) {
        this.simulationPhase += deltaTime * 0.001;
        
        // Simulate varying sound input
        const wave1 = Math.sin(this.simulationPhase * 0.5) * 0.5 + 0.5;
        const wave2 = Math.sin(this.simulationPhase * 0.2) * 0.3;
        
        // Occasional "humming" simulation
        const humCycle = Math.sin(this.simulationPhase * 0.1);
        if (humCycle > 0.7) {
            this.volume = 0.3 + wave2 * 0.1;
            this.pitch = 220 + wave1 * 50; // Around A3
        } else if (humCycle > 0.3) {
            this.volume = 0.1 + wave1 * 0.05; // Breathing
            this.pitch = 0;
        } else {
            this.volume = 0.02 + Math.random() * 0.01; // Silence
            this.pitch = 0;
        }
    }
    
    detectPitch() {
        // Simple autocorrelation pitch detection
        const sampleRate = this.audioContext ? this.audioContext.sampleRate : 44100;
        const minFreq = 80;
        const maxFreq = 500;
        
        const minPeriod = Math.floor(sampleRate / maxFreq);
        const maxPeriod = Math.floor(sampleRate / minFreq);
        
        let bestCorrelation = 0;
        let bestPeriod = 0;
        
        for (let period = minPeriod; period < maxPeriod && period < this.bufferLength / 2; period++) {
            let correlation = 0;
            for (let i = 0; i < this.bufferLength - period; i++) {
                correlation += this.dataArray[i] * this.dataArray[i + period];
            }
            
            if (correlation > bestCorrelation) {
                bestCorrelation = correlation;
                bestPeriod = period;
            }
        }
        
        if (bestPeriod > 0 && bestCorrelation > 0.1) {
            return sampleRate / bestPeriod;
        }
        
        return 0;
    }
    
    detectSoundType(deltaTime) {
        const prevType = this.soundType;
        
        if (this.smoothedVolume < this.silenceThreshold) {
            this.soundType = 'silence';
            this.isHumming = false;
            this.humDuration = 0;
        } else if (this.smoothedVolume < this.breathThreshold) {
            this.soundType = 'breath';
            this.isHumming = false;
            this.humDuration = 0;
        } else if (this.smoothedVolume < this.humThreshold && this.pitchStability > 0.5) {
            this.soundType = 'hum';
            
            if (!this.isHumming) {
                this.isHumming = true;
                this.humStartTime = performance.now();
            }
            this.humDuration = performance.now() - this.humStartTime;
            
            // Emit hum events
            if (this.humDuration > 500 && this.humDuration < 600) {
                GameEvents.emit('humStart', { pitch: this.smoothedPitch });
            }
        } else {
            this.soundType = 'voice';
            this.isHumming = false;
        }
        
        // Emit type change
        if (this.soundType !== prevType) {
            GameEvents.emit('soundTypeChange', {
                from: prevType,
                to: this.soundType
            });
        }
    }
    
    updatePitchStability() {
        if (this.pitch > 0) {
            this.pitchHistory.push(this.pitch);
            if (this.pitchHistory.length > 20) {
                this.pitchHistory.shift();
            }
            
            if (this.pitchHistory.length >= 5) {
                const avg = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
                const variance = this.pitchHistory.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / this.pitchHistory.length;
                const stdDev = Math.sqrt(variance);
                
                // Stability is inverse of coefficient of variation
                const cv = stdDev / avg;
                this.pitchStability = Utils.clamp(1 - cv * 5, 0, 1);
            }
        } else {
            this.pitchStability = Utils.lerp(this.pitchStability, 0, 0.1);
        }
    }
    
    // Check if current pitch matches a target
    matchesPitch(targetFreq, tolerance = 20) {
        if (this.smoothedPitch === 0) return false;
        return Math.abs(this.smoothedPitch - targetFreq) < tolerance;
    }
    
    // Get normalized volume (0-1)
    getNormalizedVolume() {
        return Utils.clamp(this.smoothedVolume / 0.5, 0, 1);
    }
    
    destroy() {
        if (this.microphone) {
            this.microphone.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.enabled = false;
    }
}

