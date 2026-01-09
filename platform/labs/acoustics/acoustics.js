/**
 * Acoustics Lab
 * Sound field visualization and design
 */

class AcousticsLab {
    constructor() {
        this.canvas = document.getElementById('acoustic-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Parameters
        this.frequency = 440;
        this.speedOfSound = 343;
        this.vizMode = 'pressure';
        this.time = 0;
        
        // Sources
        this.sources = [];
        this.nextSourceId = 1;
        
        // Audio
        this.audioContext = null;
        this.oscillators = [];
        this.isSoundOn = false;
        
        // Dragging
        this.dragSource = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.addDefaultSources();
        this.setupEventListeners();
        this.renderSourceList();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }
    
    addDefaultSources() {
        this.addSource(this.canvas.width * 0.3, this.canvas.height * 0.5, 0);
        this.addSource(this.canvas.width * 0.7, this.canvas.height * 0.5, 0);
    }
    
    addSource(x, y, phase = 0) {
        const source = {
            id: this.nextSourceId++,
            x: x,
            y: y,
            phase: phase,
            amplitude: 1
        };
        this.sources.push(source);
        this.createSourceMarker(source);
        this.renderSourceList();
        return source;
    }
    
    removeSource(id) {
        const index = this.sources.findIndex(s => s.id === id);
        if (index > -1) {
            this.sources.splice(index, 1);
            const marker = document.querySelector(`.source-marker[data-id="${id}"]`);
            if (marker) marker.remove();
            this.renderSourceList();
        }
    }
    
    createSourceMarker(source) {
        const container = document.getElementById('sources-container');
        const marker = document.createElement('div');
        marker.className = 'source-marker';
        marker.dataset.id = source.id;
        marker.textContent = source.id;
        marker.style.left = `${source.x}px`;
        marker.style.top = `${source.y}px`;
        
        // Drag handling
        marker.addEventListener('mousedown', (e) => this.startDrag(e, source));
        marker.addEventListener('touchstart', (e) => this.startDrag(e, source));
        
        container.appendChild(marker);
    }
    
    startDrag(e, source) {
        e.preventDefault();
        this.dragSource = source;
        
        const moveHandler = (e) => this.onDrag(e);
        const endHandler = () => {
            this.dragSource = null;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', endHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('touchend', endHandler);
        };
        
        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', endHandler);
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', endHandler);
    }
    
    onDrag(e) {
        if (!this.dragSource) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        this.dragSource.x = Math.max(0, Math.min(this.canvas.width, clientX - rect.left));
        this.dragSource.y = Math.max(0, Math.min(this.canvas.height, clientY - rect.top));
        
        const marker = document.querySelector(`.source-marker[data-id="${this.dragSource.id}"]`);
        if (marker) {
            marker.style.left = `${this.dragSource.x}px`;
            marker.style.top = `${this.dragSource.y}px`;
        }
    }
    
    renderSourceList() {
        const list = document.getElementById('source-list');
        list.innerHTML = this.sources.map(source => `
            <div class="source-item">
                <div class="source-color"></div>
                <span class="source-label">Source ${source.id}</span>
                <span class="source-phase">φ: ${source.phase}°</span>
                <button class="source-remove" data-id="${source.id}">×</button>
            </div>
        `).join('');
        
        list.querySelectorAll('.source-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeSource(parseInt(btn.dataset.id));
            });
        });
    }
    
    setupEventListeners() {
        // Frequency
        document.getElementById('frequency').addEventListener('input', (e) => {
            this.frequency = parseInt(e.target.value);
            document.getElementById('freq-display').textContent = `${this.frequency} Hz`;
        });
        
        // Speed of sound
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speedOfSound = parseInt(e.target.value);
            let label = 'Custom';
            if (this.speedOfSound < 400) label = 'Air';
            else if (this.speedOfSound < 1000) label = 'Helium';
            else label = 'Water';
            document.getElementById('speed-display').textContent = `${this.speedOfSound} m/s (${label})`;
        });
        
        // Viz mode
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.vizMode = btn.dataset.viz;
            });
        });
        
        // Add source
        document.getElementById('add-source').addEventListener('click', () => {
            const x = 100 + Math.random() * (this.canvas.width - 200);
            const y = 100 + Math.random() * (this.canvas.height - 200);
            this.addSource(x, y, Math.random() * 360);
        });
        
        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyPreset(btn.dataset.preset);
            });
        });
        
        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.toggleSound();
        });
    }
    
    applyPreset(preset) {
        // Clear existing
        this.sources.forEach(s => {
            const marker = document.querySelector(`.source-marker[data-id="${s.id}"]`);
            if (marker) marker.remove();
        });
        this.sources = [];
        this.nextSourceId = 1;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        switch(preset) {
            case 'standing':
                this.addSource(w * 0.2, h * 0.5, 0);
                this.addSource(w * 0.8, h * 0.5, 180);
                document.getElementById('pattern-type').textContent = 'Standing Wave';
                break;
            case 'interference':
                this.addSource(w * 0.35, h * 0.5, 0);
                this.addSource(w * 0.65, h * 0.5, 0);
                document.getElementById('pattern-type').textContent = 'Interference';
                break;
            case 'focus':
                for (let i = 0; i < 5; i++) {
                    const angle = (i - 2) * 0.3;
                    const x = w * 0.2;
                    const y = h * 0.5 + i * 60 - 120;
                    const distToFocus = Math.sqrt(Math.pow(w * 0.7 - x, 2) + Math.pow(h * 0.5 - y, 2));
                    const phase = (distToFocus / (this.speedOfSound / this.frequency)) * 360 % 360;
                    this.addSource(x, y, -phase);
                }
                document.getElementById('pattern-type').textContent = 'Focusing';
                break;
            case 'array':
                for (let i = 0; i < 6; i++) {
                    const x = w * 0.1;
                    const y = h * 0.2 + i * (h * 0.6 / 5);
                    this.addSource(x, y, i * 30);
                }
                document.getElementById('pattern-type').textContent = 'Phased Array';
                break;
        }
    }
    
    toggleSound() {
        const btn = document.getElementById('sound-toggle');
        
        if (this.isSoundOn) {
            this.stopSound();
            btn.textContent = '🔇';
            btn.classList.remove('active');
        } else {
            this.startSound();
            btn.textContent = '🔊';
            btn.classList.add('active');
        }
        
        this.isSoundOn = !this.isSoundOn;
    }
    
    startSound() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.oscillators = [];
        
        this.sources.forEach(source => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const panner = this.audioContext.createStereoPanner();
            
            osc.type = 'sine';
            osc.frequency.value = this.frequency;
            gain.gain.value = 0.1 / this.sources.length;
            panner.pan.value = (source.x / this.canvas.width) * 2 - 1;
            
            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.audioContext.destination);
            
            osc.start();
            this.oscillators.push({ osc, gain, panner, source });
        });
    }
    
    stopSound() {
        this.oscillators.forEach(({ osc }) => {
            osc.stop();
        });
        this.oscillators = [];
    }
    
    calculateField(x, y) {
        const wavelength = this.speedOfSound / this.frequency;
        const k = 2 * Math.PI / wavelength;
        const omega = 2 * Math.PI * this.frequency;
        
        let pressure = 0;
        
        this.sources.forEach(source => {
            const dx = x - source.x;
            const dy = y - source.y;
            const r = Math.sqrt(dx * dx + dy * dy) / 50; // Scale to meters
            
            const phase = source.phase * Math.PI / 180;
            
            // Amplitude falls off with distance
            const amplitude = source.amplitude / Math.max(0.1, r);
            
            pressure += amplitude * Math.sin(k * r - omega * this.time + phase);
        });
        
        return pressure;
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Create image data for field visualization
        const imageData = ctx.createImageData(w, h);
        const data = imageData.data;
        
        const resolution = 4; // Skip pixels for performance
        let maxAmp = 0;
        let nodeCount = 0;
        
        for (let y = 0; y < h; y += resolution) {
            for (let x = 0; x < w; x += resolution) {
                const pressure = this.calculateField(x, y);
                const absPressure = Math.abs(pressure);
                
                if (absPressure > maxAmp) maxAmp = absPressure;
                if (absPressure < 0.05) nodeCount++;
                
                let r, g, b;
                
                if (this.vizMode === 'pressure') {
                    // Blue negative, green positive
                    if (pressure > 0) {
                        r = 0;
                        g = Math.min(255, pressure * 100);
                        b = Math.min(255, pressure * 50);
                    } else {
                        r = Math.min(255, -pressure * 50);
                        g = 0;
                        b = Math.min(255, -pressure * 100);
                    }
                } else if (this.vizMode === 'intensity') {
                    // Intensity (always positive)
                    const intensity = pressure * pressure;
                    r = Math.min(255, intensity * 150);
                    g = Math.min(255, intensity * 200);
                    b = Math.min(255, intensity * 100);
                } else {
                    // Particle velocity (gradient based)
                    const mag = absPressure;
                    r = Math.min(255, mag * 120);
                    g = Math.min(255, mag * 180);
                    b = Math.min(255, mag * 255);
                }
                
                // Fill pixels (resolution x resolution block)
                for (let dy = 0; dy < resolution && y + dy < h; dy++) {
                    for (let dx = 0; dx < resolution && x + dx < w; dx++) {
                        const i = ((y + dy) * w + (x + dx)) * 4;
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                        data[i + 3] = 255;
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Update stats
        document.getElementById('max-amp').textContent = maxAmp.toFixed(2);
        document.getElementById('node-count').textContent = Math.floor(nodeCount / 100);
        
        // Update source positions in audio
        if (this.isSoundOn) {
            this.oscillators.forEach(({ panner, source }) => {
                panner.pan.value = (source.x / w) * 2 - 1;
            });
        }
    }
    
    animate() {
        this.time += 0.001;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AcousticsLab();
});

