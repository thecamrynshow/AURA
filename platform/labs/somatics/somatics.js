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
        this.baseFrequency = 432;
        this.frequencyName = 'Universal Harmony';
        this.binauralBeat = 10;
        this.binauralState = 'Alpha';
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
        // Solfeggio buttons
        document.querySelectorAll('.solfeggio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.solfeggio-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.baseFrequency = parseInt(btn.dataset.freq);
                this.frequencyName = btn.dataset.name;
                this.updateDisplay();
                if (this.isPlaying) this.updateAudio();
            });
        });
        
        // Binaural buttons
        document.querySelectorAll('.binaural-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.binaural-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.binauralBeat = parseInt(btn.dataset.beat);
                this.binauralState = btn.dataset.state;
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
        document.getElementById('current-freq').textContent = this.baseFrequency;
        document.getElementById('mode-name').textContent = this.frequencyName;
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
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create nodes
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume * 0.3;
        
        // Create merger for stereo
        const merger = this.audioContext.createChannelMerger(2);
        
        // Left oscillator (base frequency)
        this.oscLeft = this.audioContext.createOscillator();
        this.oscLeft.type = 'sine';
        this.oscLeft.frequency.value = this.baseFrequency;
        
        // Right oscillator (base + binaural beat)
        this.oscRight = this.audioContext.createOscillator();
        this.oscRight.type = 'sine';
        this.oscRight.frequency.value = this.baseFrequency + (this.binauralBeat * this.binauralMix);
        
        // Create gains for each channel
        const gainLeft = this.audioContext.createGain();
        const gainRight = this.audioContext.createGain();
        gainLeft.gain.value = 1;
        gainRight.gain.value = 1;
        
        // Connect left channel
        this.oscLeft.connect(gainLeft);
        gainLeft.connect(merger, 0, 0);
        
        // Connect right channel
        this.oscRight.connect(gainRight);
        gainRight.connect(merger, 0, 1);
        
        // Connect to output
        merger.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // Start oscillators
        this.oscLeft.start();
        this.oscRight.start();
        
        this.isPlaying = true;
        
        // Update UI
        const btn = document.getElementById('play-btn');
        btn.classList.add('playing');
        document.getElementById('play-icon').textContent = '⏹';
        document.getElementById('play-text').textContent = 'Stop';
    }
    
    stopAudio() {
        if (this.oscLeft) {
            this.oscLeft.stop();
            this.oscLeft.disconnect();
        }
        if (this.oscRight) {
            this.oscRight.stop();
            this.oscRight.disconnect();
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        
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
        
        this.oscLeft.frequency.setValueAtTime(this.baseFrequency, this.audioContext.currentTime);
        this.oscRight.frequency.setValueAtTime(
            this.baseFrequency + (this.binauralBeat * this.binauralMix),
            this.audioContext.currentTime
        );
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

