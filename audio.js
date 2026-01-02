/**
 * PNEUOMA Audio System
 * Ambient soundscapes and UI sound effects
 * Creates an immersive, calming audio experience
 */

class PneuomaAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.uiGain = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.ambientNodes = [];
        
        // Settings
        this.ambientVolume = 0.12; // Soft background
        this.uiVolume = 0.25;
        
        // Load saved preference
        this.isMuted = localStorage.getItem('pneuoma_audio_muted') === 'true';
        
        this.init();
    }
    
    init() {
        // Wait for user interaction to start audio (browser policy)
        const startAudio = () => {
            if (!this.audioContext) {
                this.createAudioContext();
                if (!this.isMuted) {
                    this.startAmbient();
                }
            }
            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('touchstart', startAudio);
        };
        
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
        document.addEventListener('touchstart', startAudio, { once: true });
        
        // Create audio toggle button
        this.createAudioToggle();
        
        // Bind UI sounds to interactive elements
        this.bindUISounds();
    }
    
    createAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.isMuted ? 0 : 1;
            this.masterGain.connect(this.audioContext.destination);
            
            // Ambient gain
            this.ambientGain = this.audioContext.createGain();
            this.ambientGain.gain.value = this.ambientVolume;
            this.ambientGain.connect(this.masterGain);
            
            // UI gain
            this.uiGain = this.audioContext.createGain();
            this.uiGain.gain.value = this.uiVolume;
            this.uiGain.connect(this.masterGain);
            
            console.log('🔊 PNEUOMA Audio initialized');
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }
    
    // ==================== AMBIENT SOUNDSCAPE ====================
    
    startAmbient() {
        if (!this.audioContext || this.isPlaying) return;
        
        this.isPlaying = true;
        
        // Create layered ambient drone
        // Layer 1: Deep sub bass drone
        this.createDrone(55, 0.15, 'sine');      // A1
        
        // Layer 2: Warm pad
        this.createDrone(110, 0.08, 'sine');     // A2
        this.createDrone(165, 0.05, 'sine');     // E3 (fifth)
        
        // Layer 3: Shimmer/air
        this.createShimmer();
        
        // Layer 4: Gentle pulses
        this.createPulse();
        
        // Fade in
        this.ambientGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.ambientGain.gain.linearRampToValueAtTime(
            this.ambientVolume, 
            this.audioContext.currentTime + 3
        );
    }
    
    createDrone(frequency, volume, type = 'sine') {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = type;
        osc.frequency.value = frequency;
        
        // Gentle detuning for warmth
        osc.detune.value = Math.random() * 10 - 5;
        
        // Low-pass filter for softness
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        
        gain.gain.value = volume;
        
        // Subtle LFO for movement
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.1 + Math.random() * 0.1; // Very slow
        lfoGain.gain.value = volume * 0.3;
        
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        osc.start();
        
        this.ambientNodes.push({ osc, gain, lfo, filter });
    }
    
    createShimmer() {
        // High frequency shimmer using filtered noise
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        // Band-pass filter for airy quality
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        filter.Q.value = 2;
        
        // Very quiet
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.015;
        
        // LFO on filter frequency for movement
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.frequency.value = 0.05;
        lfoGain.gain.value = 1000;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);
        
        noise.start();
        
        this.ambientNodes.push({ noise, gain, lfo, filter });
    }
    
    createPulse() {
        // Gentle rhythmic pulse - like a slow heartbeat
        const pulse = () => {
            if (!this.isPlaying || !this.audioContext) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = 82.41; // E2
            
            filter.type = 'lowpass';
            filter.frequency.value = 200;
            
            const now = this.audioContext.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambientGain);
            
            osc.start(now);
            osc.stop(now + 4);
            
            // Random interval between 6-10 seconds
            const nextPulse = 6000 + Math.random() * 4000;
            setTimeout(pulse, nextPulse);
        };
        
        // Start after a delay
        setTimeout(pulse, 3000);
    }
    
    stopAmbient() {
        // Fade out
        if (this.ambientGain && this.audioContext) {
            this.ambientGain.gain.linearRampToValueAtTime(
                0, 
                this.audioContext.currentTime + 1
            );
        }
        
        // Stop all nodes after fade
        setTimeout(() => {
            this.ambientNodes.forEach(node => {
                try {
                    if (node.osc) node.osc.stop();
                    if (node.noise) node.noise.stop();
                    if (node.lfo) node.lfo.stop();
                } catch (e) {}
            });
            this.ambientNodes = [];
            this.isPlaying = false;
        }, 1100);
    }
    
    // ==================== UI SOUNDS ====================
    
    playBubble(pitch = 1) {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Main bubble tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Bubble frequency sweep
        const baseFreq = 400 * pitch;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * 0.8, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.15);
        
        // Soft filter
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        // Quick envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.uiGain);
        
        osc.start(now);
        osc.stop(now + 0.25);
    }
    
    playHover() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Soft high tone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.uiGain);
        
        osc.start(now);
        osc.stop(now + 0.12);
    }
    
    playClick() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Two-tone bubble click
        [1, 1.25].forEach((mult, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600 * mult, now);
            osc.frequency.exponentialRampToValueAtTime(900 * mult, now + 0.04);
            osc.frequency.exponentialRampToValueAtTime(500 * mult, now + 0.12);
            
            gain.gain.setValueAtTime(0, now + i * 0.02);
            gain.gain.linearRampToValueAtTime(0.2 - i * 0.08, now + 0.02 + i * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + i * 0.02);
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.start(now);
            osc.stop(now + 0.2);
        });
    }
    
    playSuccess() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Rising arpeggio
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        });
    }
    
    playNavigate() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Whoosh + bubble
        // Noise whoosh
        const bufferSize = this.audioContext.sampleRate * 0.15;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.1);
        filter.Q.value = 1;
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.uiGain);
        
        noise.start(now);
        
        // Add bubble
        setTimeout(() => this.playBubble(1.2), 50);
    }
    
    // ==================== TOGGLE & CONTROLS ====================
    
    createAudioToggle() {
        // Create floating audio toggle button
        const toggle = document.createElement('button');
        toggle.className = 'audio-toggle';
        toggle.setAttribute('aria-label', 'Toggle sound');
        toggle.innerHTML = this.isMuted ? '🔇' : '🔊';
        
        toggle.addEventListener('click', () => {
            this.toggleMute();
            toggle.innerHTML = this.isMuted ? '🔇' : '🔊';
            toggle.classList.toggle('muted', this.isMuted);
        });
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .audio-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(18, 21, 28, 0.9);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .audio-toggle:hover {
                background: rgba(30, 35, 45, 0.95);
                border-color: rgba(100, 255, 218, 0.3);
                transform: scale(1.1);
            }
            
            .audio-toggle.muted {
                opacity: 0.6;
            }
            
            @media (max-width: 768px) {
                .audio-toggle {
                    bottom: 15px;
                    right: 15px;
                    width: 42px;
                    height: 42px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(toggle);
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('pneuoma_audio_muted', this.isMuted);
        
        if (this.masterGain) {
            if (this.isMuted) {
                this.masterGain.gain.linearRampToValueAtTime(
                    0, 
                    this.audioContext.currentTime + 0.3
                );
            } else {
                this.masterGain.gain.linearRampToValueAtTime(
                    1, 
                    this.audioContext.currentTime + 0.3
                );
                
                // Restart ambient if not playing
                if (!this.isPlaying) {
                    this.startAmbient();
                }
            }
        }
    }
    
    // ==================== UI BINDING ====================
    
    bindUISounds() {
        // Use event delegation for dynamic elements
        document.addEventListener('mouseenter', (e) => {
            const target = e.target.closest('button, a, .role-btn, .exercise-btn, .game-card, .nav-cta, .platform-card, [role="button"]');
            if (target && !target.classList.contains('audio-toggle')) {
                this.playHover();
            }
        }, true);
        
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a, .role-btn, .exercise-btn, .nav-cta, [role="button"]');
            if (target && !target.classList.contains('audio-toggle')) {
                this.playClick();
            }
        }, true);
        
        // Navigation sounds
        window.addEventListener('popstate', () => {
            this.playNavigate();
        });
        
        // Listen for page transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && !link.href.startsWith('#') && !link.href.includes('javascript:')) {
                this.playNavigate();
            }
        });
    }
}

// Initialize
const pneuomaAudio = new PneuomaAudio();

// Export for use in other scripts
window.pneuomaAudio = pneuomaAudio;

console.log('🎵 PNEUOMA Audio System loaded');

