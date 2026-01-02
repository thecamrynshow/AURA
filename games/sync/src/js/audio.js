/**
 * Sync — Audio System
 * Warm, intimate soundscape for couples
 */

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientNodes = [];
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.25;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }
    
    async resume() {
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    // Warm ambient pad
    startAmbient() {
        if (!this.audioContext) return;
        
        // Root note
        this.createPad(220, 0.06); // A3
        this.createPad(277.18, 0.04); // C#4
        this.createPad(329.63, 0.05); // E4
        
        // Heartbeat-like pulse
        this.startHeartbeat();
    }
    
    createPad(frequency, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        // Gentle vibrato
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        lfo.start();
        
        this.ambientNodes.push({ osc, gain, filter, lfo, lfoGain });
    }
    
    startHeartbeat() {
        // Subtle low frequency pulse
        const beat = () => {
            if (!this.audioContext) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = 60;
            
            gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
        
        // Double beat like a heartbeat
        const heartbeat = () => {
            beat();
            setTimeout(beat, 150);
        };
        
        this.heartbeatInterval = setInterval(heartbeat, 2000);
    }
    
    // Play when partners sync their breath
    playSync() {
        if (!this.audioContext) return;
        
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(this.audioContext.currentTime + i * 0.1);
            osc.stop(this.audioContext.currentTime + 2);
        });
    }
    
    // Breath cue
    playBreathCue(type) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        
        if (type === 'inhale') {
            osc.frequency.setValueAtTime(330, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(440, this.audioContext.currentTime + 4);
        } else {
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(330, this.audioContext.currentTime + 6);
        }
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0.04, this.audioContext.currentTime + 3);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 6);
    }
    
    // Phase transition
    playPhaseChange() {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 880;
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 1.5);
    }
    
    // Completion
    playComplete() {
        if (!this.audioContext) return;
        
        const melody = [440, 554.37, 659.25, 880];
        
        melody.forEach((freq, i) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.value = freq;
                
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
                
                osc.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + 2);
            }, i * 300);
        });
    }
    
    stopAll() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        }
        
        setTimeout(() => {
            this.ambientNodes.forEach(node => {
                try {
                    node.osc?.stop();
                    node.lfo?.stop();
                } catch (e) {}
            });
            this.ambientNodes = [];
        }, 2000);
    }
}

const Audio = new AudioSystem();


