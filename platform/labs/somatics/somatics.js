/**
 * Somatics Lab
 * Healing frequencies, binaural beats, and brainwave entrainment
 */

class SomaticsLab {
    constructor() {
        this.canvas = document.getElementById('wave-canvas');
        this.bgCanvas = document.getElementById('background-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        // Parameters
        this.baseFrequency = null; // No default selection
        this.frequencyName = 'None';
        this.frequencyCategory = null;
        this.planetaryFrequency = null;
        this.planetaryName = 'None';
        this.binauralBeat = 0; // No default selection
        this.binauralState = 'None';
        this.volume = 0.5;
        this.binauralMix = 0.3;
        
        // Audio
        this.audioContext = null;
        this.oscLeft = null;
        this.oscRight = null;
        this.gainNode = null;
        this.isPlaying = false;
        
        // Animation
        this.time = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.setupEventListeners();
        this.animate();
        this.updateBrainwaveMarker();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.bgCanvas.width = window.innerWidth;
        this.bgCanvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // Solfeggio buttons - toggle behavior
        document.querySelectorAll('.solfeggio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) {
                    // Deselect - toggle off
                    btn.classList.remove('active');
                    this.baseFrequency = null;
                    this.frequencyName = 'None';
                    this.frequencyCategory = null;
                } else {
                    // Select - deselect others in same category only
                    document.querySelectorAll('.solfeggio-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.baseFrequency = parseFloat(btn.dataset.freq);
                    this.frequencyName = btn.dataset.name;
                    this.frequencyCategory = 'Solfeggio';
                }
                this.updateDisplay();
                if (this.isPlaying) this.updateAudio();
            });
        });
        
        // Planetary buttons - toggle behavior
        document.querySelectorAll('.planetary-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) {
                    // Deselect - toggle off
                    btn.classList.remove('active');
                    this.planetaryFrequency = null;
                    this.planetaryName = 'None';
                } else {
                    // Select - deselect others in same category only
                    document.querySelectorAll('.planetary-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.planetaryFrequency = parseFloat(btn.dataset.freq);
                    this.planetaryName = btn.dataset.name;
                }
                this.updateDisplay();
                if (this.isPlaying) this.updateAudio();
            });
        });
        
        // Binaural buttons - toggle behavior
        document.querySelectorAll('.binaural-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) {
                    // Deselect - toggle off
                    btn.classList.remove('active');
                    this.binauralBeat = 0;
                    this.binauralState = 'None';
                } else {
                    // Select
                    document.querySelectorAll('.binaural-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.binauralBeat = parseInt(btn.dataset.beat);
                    this.binauralState = btn.dataset.state;
                }
                this.updateBrainwaveMarker();
                if (this.isPlaying) this.updateAudio();
            });
        });
        
        // Volume
        document.getElementById('volume').addEventListener('input', (e) => {
            this.volume = parseInt(e.target.value) / 100;
            document.getElementById('volume-display').textContent = `${e.target.value}%`;
            if (this.gainNode) this.gainNode.gain.value = this.volume * 0.3;
        });
        
        // Binaural mix
        document.getElementById('binaural-mix').addEventListener('input', (e) => {
            this.binauralMix = parseInt(e.target.value) / 100;
            document.getElementById('mix-display').textContent = `${e.target.value}%`;
        });
        
        // Play button
        document.getElementById('play-btn').addEventListener('click', () => {
            this.togglePlay();
        });
    }
    
    updateDisplay() {
        // Determine what to show
        let freqDisplay = '--';
        let nameDisplay = 'Select a frequency';
        let categoryDisplay = '';
        
        // Show base frequency if selected
        if (this.baseFrequency) {
            freqDisplay = this.baseFrequency;
            nameDisplay = this.frequencyName;
            categoryDisplay = 'Solfeggio';
        }
        // Show planetary if selected (overrides or shows alongside)
        if (this.planetaryFrequency) {
            if (this.baseFrequency) {
                // Both selected - show combined
                freqDisplay = `${this.baseFrequency} + ${this.planetaryFrequency}`;
                nameDisplay = `${this.frequencyName} + ${this.planetaryName}`;
                categoryDisplay = 'Solfeggio + Planetary';
            } else {
                freqDisplay = this.planetaryFrequency;
                nameDisplay = this.planetaryName;
                categoryDisplay = 'Planetary';
            }
        }
        
        // Add binaural info if active
        if (this.binauralBeat > 0) {
            if (categoryDisplay) {
                categoryDisplay += ` + ${this.binauralState} (${this.binauralBeat}Hz)`;
            } else {
                categoryDisplay = `${this.binauralState} Brainwave (${this.binauralBeat}Hz)`;
                if (!this.baseFrequency && !this.planetaryFrequency) {
                    freqDisplay = this.binauralBeat;
                    nameDisplay = `${this.binauralState} Entrainment`;
                }
            }
        }
        
        document.getElementById('current-freq').textContent = freqDisplay;
        document.getElementById('mode-name').textContent = nameDisplay;
        document.getElementById('mode-label').textContent = categoryDisplay || 'Ready';
    }
    
    updateBrainwaveMarker() {
        const marker = document.getElementById('brainwave-marker');
        
        // Map beat frequency to position
        let position;
        if (this.binauralBeat <= 4) {
            position = (this.binauralBeat / 4) * 15; // Delta: 0-15%
        } else if (this.binauralBeat <= 8) {
            position = 15 + ((this.binauralBeat - 4) / 4) * 20; // Theta: 15-35%
        } else if (this.binauralBeat <= 13) {
            position = 35 + ((this.binauralBeat - 8) / 5) * 25; // Alpha: 35-60%
        } else if (this.binauralBeat <= 30) {
            position = 60 + ((this.binauralBeat - 13) / 17) * 25; // Beta: 60-85%
        } else {
            position = 85 + ((this.binauralBeat - 30) / 70) * 15; // Gamma: 85-100%
        }
        
        marker.style.left = `${position}%`;
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.stopAudio();
        } else {
            this.startAudio();
        }
    }
    
    startAudio() {
        // Check if anything is selected
        if (!this.baseFrequency && !this.planetaryFrequency && this.binauralBeat === 0) {
            alert('Please select at least one frequency or brainwave to play.');
            return;
        }
        
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create main gain node
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume * 0.3;
        
        // Create merger for stereo binaural
        const merger = this.audioContext.createChannelMerger(2);
        
        // Track all oscillators for cleanup
        this.oscillators = [];
        
        // Determine primary frequency for binaural (use base, or planetary, or default 200Hz carrier)
        let primaryFreq = this.baseFrequency || this.planetaryFrequency || 200;
        
        // Create oscillators for base frequency (Solfeggio)
        if (this.baseFrequency) {
            const oscBase = this.audioContext.createOscillator();
            oscBase.type = 'sine';
            oscBase.frequency.value = this.baseFrequency;
            const gainBase = this.audioContext.createGain();
            gainBase.gain.value = 0.5;
            oscBase.connect(gainBase);
            gainBase.connect(this.gainNode);
            oscBase.start();
            this.oscillators.push(oscBase);
        }
        
        // Create oscillators for planetary frequency
        if (this.planetaryFrequency) {
            const oscPlanetary = this.audioContext.createOscillator();
            oscPlanetary.type = 'sine';
            oscPlanetary.frequency.value = this.planetaryFrequency;
            const gainPlanetary = this.audioContext.createGain();
            gainPlanetary.gain.value = 0.4;
            oscPlanetary.connect(gainPlanetary);
            gainPlanetary.connect(this.gainNode);
            oscPlanetary.start();
            this.oscillators.push(oscPlanetary);
        }
        
        // Create binaural beat oscillators if active
        if (this.binauralBeat > 0) {
            const beatDiff = this.binauralBeat * this.binauralMix;
            
            // Left ear
            this.oscLeft = this.audioContext.createOscillator();
            this.oscLeft.type = 'sine';
            this.oscLeft.frequency.value = primaryFreq;
            const gainLeft = this.audioContext.createGain();
            gainLeft.gain.value = 0.5;
            this.oscLeft.connect(gainLeft);
            gainLeft.connect(merger, 0, 0);
            this.oscLeft.start();
            this.oscillators.push(this.oscLeft);
            
            // Right ear (slightly different frequency for binaural)
            this.oscRight = this.audioContext.createOscillator();
            this.oscRight.type = 'sine';
            this.oscRight.frequency.value = primaryFreq + beatDiff;
            const gainRight = this.audioContext.createGain();
            gainRight.gain.value = 0.5;
            this.oscRight.connect(gainRight);
            gainRight.connect(merger, 0, 1);
            this.oscRight.start();
            this.oscillators.push(this.oscRight);
            
            merger.connect(this.gainNode);
        }
        
        // Connect to output
        this.gainNode.connect(this.audioContext.destination);
        
        this.isPlaying = true;
        
        // Update UI
        const btn = document.getElementById('play-btn');
        btn.classList.add('playing');
        document.getElementById('play-icon').textContent = '⏹';
        document.getElementById('play-text').textContent = 'Stop';
    }
    
    stopAudio() {
        // Stop all oscillators
        if (this.oscillators) {
            this.oscillators.forEach(osc => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch (e) {}
            });
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        
        this.oscillators = [];
        this.oscLeft = null;
        this.oscRight = null;
        this.gainNode = null;
        this.isPlaying = false;
        
        // Update UI
        const btn = document.getElementById('play-btn');
        btn.classList.remove('playing');
        document.getElementById('play-icon').textContent = '▶';
        document.getElementById('play-text').textContent = 'Play';
    }
    
    updateAudio() {
        if (!this.isPlaying) return;
        
        // Restart audio with new settings
        this.stopAudio();
        this.startAudio();
    }
    
    drawWaves() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw carrier wave
        ctx.strokeStyle = `rgba(168, 85, 247, ${this.isPlaying ? 0.6 : 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < w; x++) {
            const baseWave = Math.sin((x * 0.02) + this.time * 2) * 50;
            const y = h / 2 + baseWave;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw binaural modulation
        if (this.binauralMix > 0) {
            ctx.strokeStyle = `rgba(236, 72, 153, ${this.isPlaying ? 0.5 : 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            
            for (let x = 0; x < w; x++) {
                const modulatedWave = Math.sin((x * 0.02) + this.time * 2) * 
                    (30 + 20 * Math.sin(this.time * this.binauralBeat * 0.1));
                const y = h / 2 + modulatedWave;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Draw beat envelope
        const beatEnvelope = Math.abs(Math.sin(this.time * this.binauralBeat * 0.05));
        ctx.fillStyle = `rgba(168, 85, 247, ${beatEnvelope * 0.1})`;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, 100 + beatEnvelope * 50, 100 + beatEnvelope * 50, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBackground() {
        const ctx = this.bgCtx;
        const w = this.bgCanvas.width;
        const h = this.bgCanvas.height;
        
        // Fade effect
        ctx.fillStyle = 'rgba(10, 10, 31, 0.05)';
        ctx.fillRect(0, 0, w, h);
        
        // Draw floating particles
        if (this.isPlaying) {
            for (let i = 0; i < 3; i++) {
                const x = (Math.sin(this.time * 0.5 + i * 2) + 1) * w / 2;
                const y = (Math.cos(this.time * 0.3 + i * 3) + 1) * h / 2;
                const size = 2 + Math.sin(this.time + i) * 2;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 85, 247, ${0.3 + Math.sin(this.time * 2) * 0.2})`;
                ctx.fill();
            }
        }
    }
    
    animate() {
        this.time += 0.016;
        this.drawBackground();
        this.drawWaves();
        
        // Animate frequency rings
        const rings = document.querySelectorAll('.freq-ring');
        const intensity = this.isPlaying ? 1 : 0.5;
        rings.forEach((ring, i) => {
            const scale = 1 + Math.sin(this.time * 2 + i * 0.5) * 0.05 * intensity;
            ring.style.transform = `scale(${scale})`;
            ring.style.opacity = (0.3 + Math.sin(this.time + i) * 0.2) * intensity;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SomaticsLab();
});

