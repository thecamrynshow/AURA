/* ============================================
   SONGBIRD — Audio System
   Whistle detection and bird calls
   ============================================ */

class SongbirdAudio {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.frequencyData = null;
        this.timeDataArray = null;
        
        this.masterGain = null;
        
        // Detect mobile device
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        // Whistle detection (mobile-optimized)
        this.isWhistling = false;
        this.currentFrequency = 0;
        this.currentNote = null;
        this.whistleThreshold = this.isMobile ? 0.003 : 0.01;
        this.sensitivityMultiplier = this.isMobile ? 3.0 : 1.0;
        
        // Callbacks
        this.onWhistleStart = null;
        this.onWhistleEnd = null;
        this.onNoteChange = null;
        this.onPitchChange = null;
        
        console.log(`Songbird: ${this.isMobile ? 'Mobile' : 'Desktop'} mode, threshold: ${this.whistleThreshold}`);
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Songbird audio initialized');
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
                console.log('Using fallback audio constraints for mobile');
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            // Create analyser for pitch detection
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;
            this.analyser.smoothingTimeConstant = this.isMobile ? 0.4 : 0.6;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -10;
            
            this.microphone.connect(this.analyser);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Uint8Array(this.analyser.fftSize);
            
            console.log(`Microphone connected for whistle detection (${this.isMobile ? 'mobile' : 'desktop'} mode)`);
            return true;
        } catch (e) {
            console.warn('Microphone access denied:', e);
            return false;
        }
    }

    processAudio() {
        if (!this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Find dominant frequency using autocorrelation-like approach
        const frequency = this.detectPitch();
        
        // Check if this looks like a whistle (clear tone in whistle range)
        const volume = this.getVolume();
        const isWhistling = frequency > 300 && frequency < 1500 && volume > this.whistleThreshold;
        
        if (isWhistling) {
            this.currentFrequency = frequency;
            
            // Get note name
            const note = frequencyToNote(frequency);
            
            if (note !== this.currentNote) {
                this.currentNote = note;
                if (this.onNoteChange) {
                    this.onNoteChange(note, frequency);
                }
            }
            
            if (this.onPitchChange) {
                this.onPitchChange(frequency, normalizePitch(frequency));
            }
            
            if (!this.isWhistling) {
                this.isWhistling = true;
                if (this.onWhistleStart) {
                    this.onWhistleStart(note, frequency);
                }
            }
        } else {
            if (this.isWhistling) {
                this.isWhistling = false;
                this.currentNote = null;
                if (this.onWhistleEnd) {
                    this.onWhistleEnd();
                }
            }
        }
    }

    detectPitch() {
        // Simple peak frequency detection
        this.analyser.getByteFrequencyData(this.dataArray);
        
        let maxIndex = 0;
        let maxValue = 0;
        
        // Look in the whistle frequency range (roughly 300Hz - 2000Hz)
        // With 44100 sample rate and 2048 FFT, each bin is ~21.5Hz
        const minBin = Math.floor(300 / (this.audioContext.sampleRate / this.analyser.fftSize));
        const maxBin = Math.floor(2000 / (this.audioContext.sampleRate / this.analyser.fftSize));
        
        for (let i = minBin; i < maxBin && i < this.dataArray.length; i++) {
            if (this.dataArray[i] > maxValue) {
                maxValue = this.dataArray[i];
                maxIndex = i;
            }
        }
        
        // Convert bin to frequency
        const frequency = maxIndex * (this.audioContext.sampleRate / this.analyser.fftSize);
        
        return frequency;
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

    // Play a note (for bird calls)
    playNote(noteName, duration = 0.3) {
        if (!this.audioContext) return;
        
        const freq = NOTES[noteName];
        if (!freq) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        // Bird-like tone (slightly complex)
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Add slight vibrato for bird-like sound
        const vibrato = this.audioContext.createOscillator();
        const vibratoGain = this.audioContext.createGain();
        vibrato.frequency.value = 6;
        vibratoGain.gain.value = 8;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        
        // Envelope
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        vibrato.start(now);
        osc.stop(now + duration);
        vibrato.stop(now + duration);
    }

    // Play a melody (sequence of notes)
    playMelody(notes, noteLength = 0.3, gap = 0.1) {
        notes.forEach((note, i) => {
            setTimeout(() => {
                this.playNote(note, noteLength);
            }, i * (noteLength + gap) * 1000);
        });
        
        return notes.length * (noteLength + gap) * 1000;
    }

    // Play success sound
    playSuccess() {
        const melody = ['C5', 'E5', 'G5', 'C5'];
        melody.forEach((note, i) => {
            setTimeout(() => {
                this.playNote(note, 0.2);
            }, i * 150);
        });
    }

    // Play match sound
    playMatch() {
        this.playNote('G5', 0.15);
        setTimeout(() => this.playNote('C5', 0.2), 100);
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

const songbirdAudio = new SongbirdAudio();

console.log('Songbird Audio loaded');

