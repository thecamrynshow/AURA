/**
 * Project AURA - Breath Detection System
 * Detects breath patterns via microphone input
 */

class BreathDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.timeDataArray = null;
        this.bufferLength = 0;
        
        // Detect mobile device
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Breath state
        this.breathLevel = 0;           // Current breath intensity (0-1)
        this.smoothedLevel = 0;         // Smoothed breath level
        this.breathPhase = 'neutral';   // 'inhale', 'exhale', 'hold', 'neutral'
        this.breathRate = 0;            // Breaths per minute
        this.coherence = 0;             // How steady/regular the breathing is (0-100)
        this.stability = 0;             // Overall stability score (0-100)
        
        // Calibration
        this.isCalibrating = true;
        this.calibrationSamples = [];
        this.baselineLevel = 0.1;
        this.peakLevel = 0.5;
        
        // History for analysis
        this.levelHistory = [];
        this.phaseHistory = [];
        this.breathTimes = [];
        this.maxHistoryLength = 300;    // ~5 seconds at 60fps
        
        // Detection thresholds (mobile-optimized)
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        this.inhaleThreshold = this.isMobile ? 0.05 : 0.15;
        this.exhaleThreshold = this.isMobile ? 0.025 : 0.08;
        this.holdThreshold = this.isMobile ? 0.01 : 0.03;
        
        // State tracking
        this.lastPhaseChange = 0;
        this.currentPhaseDuration = 0;
        this.lastBreathTime = 0;
        
        // Callbacks
        this.onStateChange = null;
        
        this.enabled = false;
        
        console.log(`Project AURA: ${this.isMobile ? 'Mobile' : 'Desktop'} mode`);
    }

    async init() {
        try {
            // Request microphone access
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
                // Fallback for mobile devices
                console.log('Using fallback audio constraints for mobile');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.isMobile ? 2048 : 1024;
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.4 : 0.6;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
            this.enabled = true;
            this.startCalibration();
            
            console.log(`Breath detector initialized (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
            return true;
        } catch (error) {
            console.error('Failed to initialize breath detector:', error);
            // Fall back to simulated breath for demo
            this.enableSimulation();
            return false;
        }
    }

    enableSimulation() {
        console.log('Using simulated breath detection');
        this.enabled = true;
        this.isCalibrating = false;
        this.simulated = true;
        this.simulationPhase = 0;
    }

    startCalibration() {
        this.isCalibrating = true;
        this.calibrationSamples = [];
        
        setTimeout(() => {
            this.finishCalibration();
        }, 3000);
    }

    finishCalibration() {
        if (this.calibrationSamples.length > 0) {
            // Calculate baseline from quiet samples
            const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
            this.baselineLevel = sorted[Math.floor(sorted.length * 0.2)] || 0.1;
            this.peakLevel = sorted[Math.floor(sorted.length * 0.9)] || 0.5;
            
            // Adjust thresholds based on calibration
            const range = this.peakLevel - this.baselineLevel;
            this.inhaleThreshold = this.baselineLevel + range * 0.5;
            this.exhaleThreshold = this.baselineLevel + range * 0.25;
        }
        
        this.isCalibrating = false;
        console.log('Calibration complete', {
            baseline: this.baselineLevel,
            peak: this.peakLevel
        });
        
        GameEvents.emit('calibrationComplete');
    }

    update(deltaTime) {
        if (!this.enabled) return;
        
        const now = performance.now();
        
        if (this.simulated) {
            this.updateSimulated(deltaTime);
        } else {
            this.updateFromMic();
        }
        
        // Smooth the breath level
        this.smoothedLevel = Utils.lerp(this.smoothedLevel, this.breathLevel, 0.15);
        
        // Add to history
        this.levelHistory.push(this.smoothedLevel);
        if (this.levelHistory.length > this.maxHistoryLength) {
            this.levelHistory.shift();
        }
        
        // Detect breath phase
        this.detectPhase(now);
        
        // Calculate coherence
        this.calculateCoherence();
        
        // Calculate stability
        this.calculateStability();
        
        // Emit state update
        GameEvents.emit('breathUpdate', {
            level: this.smoothedLevel,
            phase: this.breathPhase,
            coherence: this.coherence,
            stability: this.stability,
            rate: this.breathRate,
            isCalibrating: this.isCalibrating
        });
    }

    updateFromMic() {
        let rawLevel;
        
        // Use time-domain RMS for mobile (more reliable for breath)
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            rawLevel = Math.sqrt(sum / this.timeDataArray.length) * this.sensitivityMultiplier;
        } else {
            // Desktop: use frequency data
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Focus on lower frequencies where breath is most prominent
            let sum = 0;
            const breathRange = Math.floor(this.bufferLength * 0.3); // Lower 30% of frequencies
            
            for (let i = 0; i < breathRange; i++) {
                sum += this.dataArray[i];
            }
            
            rawLevel = sum / breathRange / 255;
        }
        
        this.breathLevel = rawLevel;
        
        if (this.isCalibrating) {
            this.calibrationSamples.push(rawLevel);
        }
    }

    updateSimulated(deltaTime) {
        // Simulate natural breath pattern
        this.simulationPhase += deltaTime * 0.0004; // ~4 second breath cycle
        
        // Natural breath curve: longer exhale than inhale
        const phase = this.simulationPhase % 1;
        let level;
        
        if (phase < 0.35) {
            // Inhale (35% of cycle)
            level = Utils.smoothStep(phase / 0.35);
        } else if (phase < 0.45) {
            // Hold at top (10% of cycle)
            level = 1;
        } else if (phase < 0.9) {
            // Exhale (45% of cycle)
            level = 1 - Utils.smoothStep((phase - 0.45) / 0.45);
        } else {
            // Hold at bottom (10% of cycle)
            level = 0;
        }
        
        // Add some natural variation
        level += Math.sin(this.simulationPhase * 3) * 0.05;
        level = Utils.clamp(level, 0, 1);
        
        this.breathLevel = level * 0.6 + 0.1; // Scale to realistic range
    }

    detectPhase(now) {
        const prevPhase = this.breathPhase;
        const level = this.smoothedLevel;
        const derivative = this.getDerivative();
        
        // Determine phase based on level and rate of change
        if (derivative > 0.002 && level > this.exhaleThreshold) {
            this.breathPhase = 'inhale';
        } else if (derivative < -0.002 && level > this.holdThreshold) {
            this.breathPhase = 'exhale';
        } else if (level < this.holdThreshold) {
            this.breathPhase = 'hold';
        } else {
            this.breathPhase = 'neutral';
        }
        
        // Track phase changes
        if (this.breathPhase !== prevPhase) {
            this.currentPhaseDuration = 0;
            
            // Track breath timing for rate calculation
            if (this.breathPhase === 'inhale' && prevPhase !== 'inhale') {
                const timeSinceLastBreath = now - this.lastBreathTime;
                if (timeSinceLastBreath > 1500 && timeSinceLastBreath < 15000) {
                    this.breathTimes.push(timeSinceLastBreath);
                    if (this.breathTimes.length > 10) {
                        this.breathTimes.shift();
                    }
                    this.calculateBreathRate();
                }
                this.lastBreathTime = now;
            }
            
            this.phaseHistory.push({
                phase: this.breathPhase,
                time: now,
                duration: this.currentPhaseDuration
            });
            
            if (this.phaseHistory.length > 50) {
                this.phaseHistory.shift();
            }
            
            if (this.onStateChange) {
                this.onStateChange(this.breathPhase, prevPhase);
            }
        }
        
        this.currentPhaseDuration += 16; // Approximate frame time
    }

    getDerivative() {
        if (this.levelHistory.length < 5) return 0;
        
        const recent = this.levelHistory.slice(-5);
        return (recent[4] - recent[0]) / 4;
    }

    calculateBreathRate() {
        if (this.breathTimes.length < 2) {
            this.breathRate = 0;
            return;
        }
        
        const avgTime = this.breathTimes.reduce((a, b) => a + b, 0) / this.breathTimes.length;
        this.breathRate = Math.round(60000 / avgTime); // Breaths per minute
    }

    calculateCoherence() {
        // Coherence = how rhythmic and consistent the breathing is
        if (this.breathTimes.length < 3) {
            this.coherence = 50; // Default middle value
            return;
        }
        
        // Calculate variance in breath timing
        const avg = this.breathTimes.reduce((a, b) => a + b, 0) / this.breathTimes.length;
        const variance = this.breathTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / this.breathTimes.length;
        const stdDev = Math.sqrt(variance);
        
        // Lower variance = higher coherence
        const cv = stdDev / avg; // Coefficient of variation
        this.coherence = Math.round(Utils.clamp((1 - cv) * 100, 0, 100));
        
        // Bonus for ideal breath rate (4-7 breaths per minute is optimal for HRV)
        if (this.breathRate >= 4 && this.breathRate <= 7) {
            this.coherence = Math.min(100, this.coherence + 10);
        }
    }

    calculateStability() {
        if (this.levelHistory.length < 30) {
            this.stability = 50;
            return;
        }
        
        // Calculate how smooth the breath curve is
        const recent = this.levelHistory.slice(-30);
        let jitter = 0;
        
        for (let i = 2; i < recent.length; i++) {
            // Look for sudden changes (second derivative)
            const d1 = recent[i] - recent[i-1];
            const d2 = recent[i-1] - recent[i-2];
            jitter += Math.abs(d1 - d2);
        }
        
        // Lower jitter = higher stability
        const avgJitter = jitter / (recent.length - 2);
        this.stability = Math.round(Utils.clamp((1 - avgJitter * 20) * 100, 0, 100));
    }

    getRegulationState() {
        // Returns overall regulation state
        const score = (this.coherence + this.stability) / 2;
        
        if (score >= 70) return 'regulated';
        if (score >= 40) return 'neutral';
        return 'dysregulated';
    }

    isCalm() {
        return this.coherence >= 60 && this.stability >= 60;
    }

    isChaotic() {
        return this.coherence < 30 || this.stability < 30;
    }

    getBreathPower() {
        // Returns a 0-1 value of how "powerful" the current breath state is
        // Used for gameplay mechanics
        const regulation = (this.coherence + this.stability) / 200;
        const depth = this.smoothedLevel;
        
        return regulation * 0.7 + depth * 0.3;
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

// Breath guide - visual/audio guide for breath pacing
class BreathGuide {
    constructor() {
        this.element = document.getElementById('breath-guide');
        this.circle = this.element.querySelector('.guide-circle');
        this.text = this.element.querySelector('.guide-text');
        
        this.active = false;
        this.pattern = 'relaxed'; // 'relaxed', 'energizing', 'calming'
        this.phase = 0;
        this.cycleTime = 8000; // ms for full breath cycle
    }

    show(pattern = 'relaxed') {
        this.pattern = pattern;
        this.active = true;
        this.phase = 0;
        this.element.classList.remove('hidden');
        
        // Set cycle time based on pattern
        switch (pattern) {
            case 'calming':
                this.cycleTime = 10000; // 4-6 breaths per minute
                break;
            case 'energizing':
                this.cycleTime = 5000; // 12 breaths per minute
                break;
            default:
                this.cycleTime = 8000; // ~7-8 breaths per minute
        }
    }

    hide() {
        this.active = false;
        this.element.classList.add('hidden');
    }

    update(deltaTime) {
        if (!this.active) return;
        
        this.phase += deltaTime / this.cycleTime;
        if (this.phase > 1) this.phase -= 1;
        
        // Calculate scale and update visual
        let scale, instruction;
        
        if (this.phase < 0.4) {
            // Inhale
            scale = 1 + Utils.smoothStep(this.phase / 0.4) * 0.4;
            instruction = 'Breathe in...';
        } else if (this.phase < 0.5) {
            // Hold
            scale = 1.4;
            instruction = 'Hold...';
        } else if (this.phase < 0.9) {
            // Exhale
            scale = 1.4 - Utils.smoothStep((this.phase - 0.5) / 0.4) * 0.4;
            instruction = 'Breathe out...';
        } else {
            // Rest
            scale = 1;
            instruction = 'Rest...';
        }
        
        this.circle.style.transform = `scale(${scale})`;
        this.text.textContent = instruction;
        
        return this.phase;
    }

    getCurrentPhase() {
        if (this.phase < 0.4) return 'inhale';
        if (this.phase < 0.5) return 'hold';
        if (this.phase < 0.9) return 'exhale';
        return 'rest';
    }
}
