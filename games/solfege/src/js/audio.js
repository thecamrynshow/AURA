/* ============================================
   SOLFÈGE — Audio System
   Voice detection and piano sounds
   ============================================ */

class SolfegeAudio {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.timeDataArray = null;
        
        this.masterGain = null;
        
        // Detect mobile device
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Voice detection (mobile-optimized)
        this.isVocalizing = false;
        this.currentFrequency = 0;
        this.currentSolfege = null;
        this.vocalThreshold = this.isMobile ? 0.003 : 0.008;
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        
        // Callbacks
        this.onSolfegeDetected = null;
        this.onVoiceStart = null;
        this.onVoiceEnd = null;
        
        console.log(`Solfège: ${this.isMobile ? 'Mobile' : 'Desktop'} mode, threshold: ${this.vocalThreshold}`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.4;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Solfege audio initialized');
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
                // Fallback for mobile devices
                console.log('Using fallback audio constraints for mobile');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;  // Higher resolution for better pitch detection
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.4 : 0.6;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
            console.log(`Microphone connected for voice detection (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
            return true;
        } catch (e) {
            console.warn('Microphone access denied:', e);
            return false;
        }
    }

    processAudio() {
        if (!this.analyser) return null;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const frequency = this.detectPitch();
        const volume = this.getVolume();
        
        // Check if this is voice input (wider range for different voice types)
        const isVocalizing = frequency > 80 && frequency < 800 && volume > this.vocalThreshold;
        
        if (isVocalizing) {
            this.currentFrequency = frequency;
            const solfegeData = frequencyToSolfege(frequency);
            
            if (solfegeData && solfegeData.solfege !== this.currentSolfege) {
                this.currentSolfege = solfegeData.solfege;
                if (this.onSolfegeDetected) {
                    this.onSolfegeDetected(solfegeData);
                }
            }
            
            if (!this.isVocalizing) {
                this.isVocalizing = true;
                if (this.onVoiceStart) {
                    this.onVoiceStart();
                }
            }
            
            return solfegeData;
        } else {
            if (this.isVocalizing) {
                this.isVocalizing = false;
                this.currentSolfege = null;
                if (this.onVoiceEnd) {
                    this.onVoiceEnd();
                }
            }
            return null;
        }
    }

    detectPitch() {
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let maxIndex = 0;
        let maxValue = 0;
        
        // Look for voice frequencies (80Hz - 800Hz for different voice types)
        const minBin = Math.floor(80 / (this.audioContext.sampleRate / this.analyser.fftSize));
        const maxBin = Math.floor(800 / (this.audioContext.sampleRate / this.analyser.fftSize));
        
        // Find the strongest frequency component
        for (let i = minBin; i < maxBin && i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        
        // Only return if signal is strong enough
        if (maxValue < 30) return 0;
        
        return maxIndex * (this.audioContext.sampleRate / this.analyser.fftSize);
    }

    getVolume() {
        if (!this.analyser) return 0;
        
        // Use time-domain RMS for mobile (more accurate)
        if (this.isMobile && this.timeDataArray) {
            this.analyser.getByteTimeDomainData(this.timeDataArray);
            let sum = 0;
            for (let i = 0; i < this.timeDataArray.length; i++) {
                const val = (this.timeDataArray[i] - 128) / 128;
                sum += val * val;
            }
            return Math.sqrt(sum / this.timeDataArray.length) * this.sensitivityMultiplier;
        }
        
        // Desktop: use frequency sum
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / (this.dataArray.length * 255);
    }

    // Play piano note
    playNote(noteName, duration = 0.5) {
        if (!this.audioContext) return;
        
        const freq = NOTE_FREQUENCIES[noteName];
        if (!freq) return;
        
        // Main oscillator
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        // Piano-like envelope
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // Add harmonics for richer sound
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = freq * 2;
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.5);
        
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(this.masterGain);
        gain2.connect(this.masterGain);
        
        osc.start(now);
        osc2.start(now);
        osc.stop(now + duration);
        osc2.stop(now + duration);
    }

    // Play success chord
    playSuccess() {
        const notes = ['C4', 'E4', 'G4', 'C5'];
        notes.forEach((note, i) => {
            setTimeout(() => this.playNote(note, 0.3), i * 80);
        });
    }

    // Play match ding
    playMatch() {
        this.playNote('G5', 0.15);
    }

    // Play the scale
    playScale(speed = 300) {
        const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        scale.forEach((note, i) => {
            setTimeout(() => this.playNote(note, 0.4), i * speed);
        });
        return scale.length * speed;
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

const solfegeAudio = new SolfegeAudio();

console.log('Solfege Audio loaded');

