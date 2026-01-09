/**
 * PNEUOMA Resonance Lab - Wave Visualization Engine
 * Visualizes standing waves across 1D, 2D, 3D, and 4D geometries
 */

class ResonanceLab {
    constructor() {
        // State
        this.frequency = 440;
        this.amplitude = 0.8;
        this.waveform = 'sine';
        this.medium = 'water';
        this.damping = 0.3;
        this.phase = 0;
        this.geometry = '1d';
        this.time = 0;
        
        // Medium properties
        this.media = {
            water: { c: 1481, rho: 998, color: '#0ea5e9', baseDamping: 0.002 },
            tissue: { c: 1540, rho: 1050, color: '#f97316', baseDamping: 0.02 },
            air: { c: 343, rho: 1.2, color: '#a855f7', baseDamping: 0.001 },
            bone: { c: 3500, rho: 1900, color: '#64748b', baseDamping: 0.05 }
        };
        
        // Waveform descriptions
        this.waveformInfo = {
            sine: '<strong>Sine waves</strong> contain only the fundamental frequency—no harmonics. They represent the simplest form of oscillation and are rare in nature.',
            square: '<strong>Square waves</strong> contain only odd harmonics (3×, 5×, 7×...) at decreasing amplitudes. Notice how the pattern becomes more complex—each harmonic adds structure.',
            triangle: '<strong>Triangle waves</strong> also contain odd harmonics, but they fall off faster (1/n²). This creates a softer, more "organic" resonance pattern.',
            sawtooth: '<strong>Sawtooth waves</strong> contain all harmonics (both odd and even). They\'re the richest in harmonic content—similar to a bowed string or brass instrument.'
        };
        
        // Canvas elements
        this.canvas = document.getElementById('viz-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.threeContainer = document.getElementById('three-container');
        
        // Three.js objects
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
        this.points = null;
        this.originalPositions = null;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.resize();
        this.updateMetrics();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    cacheElements() {
        // Controls
        this.freqSlider = document.getElementById('frequency');
        this.ampSlider = document.getElementById('amplitude');
        this.dampSlider = document.getElementById('damping');
        this.phaseSlider = document.getElementById('phase');
        
        // Displays
        this.freqDisplay = document.getElementById('freq-display');
        this.ampDisplay = document.getElementById('amp-display');
        this.dampDisplay = document.getElementById('damp-display');
        this.phaseDisplay = document.getElementById('phase-display');
        
        // Metrics
        this.wavelengthValue = document.getElementById('wavelength-value');
        this.speedValue = document.getElementById('speed-value');
        this.periodValue = document.getElementById('period-value');
        this.phaseValue = document.getElementById('phase-value');
        
        // Info
        this.waveformInfoEl = document.getElementById('waveform-info');
        
        // Modal
        this.infoModal = document.getElementById('info-modal');
    }
    
    setupEventListeners() {
        // Sliders
        this.freqSlider.addEventListener('input', (e) => {
            this.frequency = parseInt(e.target.value);
            this.freqDisplay.textContent = `${this.frequency} Hz`;
            this.updateMetrics();
        });
        
        this.ampSlider.addEventListener('input', (e) => {
            this.amplitude = parseInt(e.target.value) / 100;
            this.ampDisplay.textContent = `${e.target.value}%`;
        });
        
        this.dampSlider.addEventListener('input', (e) => {
            this.damping = parseInt(e.target.value) / 100;
            this.dampDisplay.textContent = `${e.target.value}%`;
        });
        
        this.phaseSlider.addEventListener('input', (e) => {
            this.phase = parseInt(e.target.value);
            this.phaseDisplay.textContent = `${this.phase}°`;
            this.phaseValue.textContent = `${this.phase}°`;
        });
        
        // Waveform buttons
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.waveform = btn.dataset.wave;
                this.waveformInfoEl.innerHTML = `<p>${this.waveformInfo[this.waveform]}</p>`;
            });
        });
        
        // Medium buttons
        document.querySelectorAll('.medium-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.medium-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.medium = btn.dataset.medium;
                this.updateMetrics();
            });
        });
        
        // Geometry buttons
        document.querySelectorAll('.geo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.geo-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.geometry = btn.dataset.geo;
                this.switchGeometry();
            });
        });
        
        // Info modal
        document.getElementById('info-btn').addEventListener('click', () => {
            this.infoModal.classList.remove('hidden');
        });
        
        document.getElementById('modal-close').addEventListener('click', () => {
            this.infoModal.classList.add('hidden');
        });
        
        this.infoModal.addEventListener('click', (e) => {
            if (e.target === this.infoModal) {
                this.infoModal.classList.add('hidden');
            }
        });
    }
    
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        if (this.renderer) {
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
        }
    }
    
    updateMetrics() {
        const m = this.media[this.medium];
        const wavelength = m.c / this.frequency;
        const period = 1 / this.frequency;
        
        this.wavelengthValue.textContent = wavelength < 1 
            ? `${(wavelength * 1000).toFixed(1)} mm` 
            : `${wavelength.toFixed(2)} m`;
        this.speedValue.textContent = `${m.c} m/s`;
        this.periodValue.textContent = `${(period * 1000).toFixed(2)} ms`;
    }
    
    switchGeometry() {
        if (this.geometry === '1d' || this.geometry === '2d') {
            this.canvas.style.display = 'block';
            this.threeContainer.style.display = 'none';
        } else {
            this.canvas.style.display = 'none';
            this.threeContainer.style.display = 'block';
            this.initThree();
        }
    }
    
    // ==================== WAVEFORM GENERATION ====================
    
    generateWaveform(phase) {
        const p = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        
        switch (this.waveform) {
            case 'sine':
                return Math.sin(p);
            case 'square':
                return p < Math.PI ? 1 : -1;
            case 'triangle':
                if (p < Math.PI / 2) return p / (Math.PI / 2);
                if (p < 3 * Math.PI / 2) return 1 - 2 * (p - Math.PI / 2) / Math.PI;
                return -1 + (p - 3 * Math.PI / 2) / (Math.PI / 2);
            case 'sawtooth':
                return 1 - p / Math.PI;
            default:
                return Math.sin(p);
        }
    }
    
    // ==================== 1D VISUALIZATION ====================
    
    draw1D() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const m = this.media[this.medium];
        
        // Clear
        ctx.fillStyle = '#0f0d24';
        ctx.fillRect(0, 0, width, height);
        
        const centerY = height / 2;
        const omega = 2 * Math.PI * this.frequency;
        const wavelength = m.c / this.frequency;
        const k = 2 * Math.PI / wavelength;
        const phaseRad = this.phase * Math.PI / 180;
        const cavityLength = 0.2; // 20cm tube
        const scale = width / cavityLength;
        const effectiveDamping = m.baseDamping * (1 + this.damping * 10);
        
        // Draw intensity map
        for (let x = 0; x < width; x++) {
            const pos = x / scale;
            const dampingFactor = Math.exp(-effectiveDamping * pos * 50);
            const intensityEnvelope = Math.abs(this.generateWaveform(k * pos + phaseRad)) * dampingFactor;
            const alpha = intensityEnvelope * 0.4 * this.amplitude;
            
            const gradient = ctx.createLinearGradient(x, 0, x, height);
            gradient.addColorStop(0, `rgba(0, 255, 242, 0)`);
            gradient.addColorStop(0.3, `rgba(0, 255, 242, ${alpha * 0.5})`);
            gradient.addColorStop(0.5, `rgba(0, 255, 242, ${alpha})`);
            gradient.addColorStop(0.7, `rgba(0, 255, 242, ${alpha * 0.5})`);
            gradient.addColorStop(1, `rgba(0, 255, 242, 0)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(x, 0, 1, height);
        }
        
        // Draw center line
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        
        // Draw main wave
        ctx.beginPath();
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 3;
        
        for (let x = 0; x < width; x++) {
            const pos = x / scale;
            const dampingFactor = Math.exp(-effectiveDamping * pos * 50);
            const spatialPart = this.generateWaveform(k * pos + phaseRad);
            const temporalPart = Math.cos(omega * this.time * 0.01);
            const y = centerY - spatialPart * temporalPart * this.amplitude * dampingFactor * (height * 0.35);
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Glow effect
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Draw antinodes for sine wave
        if (this.waveform === 'sine' && this.damping < 0.5) {
            const nHalfWaves = Math.floor(2 * cavityLength / wavelength);
            for (let i = 0; i <= nHalfWaves; i++) {
                const x = (i * wavelength / 2 / cavityLength) * width;
                const isAntinode = i % 2 === 1;
                if (isAntinode && x < width) {
                    const dampingFactor = Math.exp(-effectiveDamping * (x / scale) * 50);
                    ctx.beginPath();
                    ctx.arc(x, centerY, 6 * dampingFactor, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 255, 242, ${dampingFactor})`;
                    ctx.fill();
                }
            }
        }
        
        // Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px "Space Grotesk", sans-serif';
        ctx.fillText(`${this.waveform.charAt(0).toUpperCase() + this.waveform.slice(1)} wave`, 10, height - 60);
        if (this.damping > 0.3) ctx.fillText(`Damping: ${Math.round(this.damping * 100)}%`, 10, height - 44);
        if (this.phase > 0) ctx.fillText(`Phase: ${this.phase}°`, 10, height - 28);
    }
    
    // ==================== 2D VISUALIZATION (Chladni) ====================
    
    draw2D() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;
        const m = this.media[this.medium];
        
        ctx.fillStyle = '#0f0d24';
        ctx.fillRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const size = Math.min(width, height) * 0.8;
        const phaseRad = this.phase * Math.PI / 180;
        const effectiveDamping = m.baseDamping * (1 + this.damping * 10);
        
        // Mode numbers based on frequency
        const modeM = Math.floor(this.frequency / 200) + 1;
        const modeN = Math.floor((this.frequency % 200) / 50) + 1;
        
        const resolution = 3;
        const imageData = ctx.createImageData(width, height);
        
        for (let px = 0; px < width; px += resolution) {
            for (let py = 0; py < height; py += resolution) {
                const x = (px - centerX) / (size / 2);
                const y = (py - centerY) / (size / 2);
                const r = Math.sqrt(x * x + y * y);
                
                if (r > 1) continue;
                
                const dampingFactor = Math.exp(-effectiveDamping * r * 20);
                
                // Chladni pattern formula
                let pattern = Math.cos(modeM * Math.PI * x + phaseRad) * Math.cos(modeN * Math.PI * y)
                            - Math.cos(modeN * Math.PI * x) * Math.cos(modeM * Math.PI * y + phaseRad);
                
                // Apply waveform shaping
                if (this.waveform === 'square') pattern = Math.sign(pattern) * Math.min(1, Math.abs(pattern) * 2);
                else if (this.waveform === 'triangle') pattern = Math.asin(Math.sin(pattern * Math.PI)) / (Math.PI / 2);
                else if (this.waveform === 'sawtooth') pattern = ((pattern + 1) % 2) - 1;
                
                const timeVar = Math.cos(2 * Math.PI * this.frequency * this.time * 0.001);
                const value = pattern * timeVar * this.amplitude * dampingFactor;
                
                // Color based on value
                for (let dx = 0; dx < resolution; dx++) {
                    for (let dy = 0; dy < resolution; dy++) {
                        const idx = ((py + dy) * width + (px + dx)) * 4;
                        if (idx < 0 || idx >= imageData.data.length) continue;
                        
                        const intensity = Math.abs(value);
                        if (value > 0) {
                            // Cyan
                            imageData.data[idx] = Math.floor(intensity * 100);
                            imageData.data[idx + 1] = Math.floor(255 * intensity);
                            imageData.data[idx + 2] = Math.floor(242 * intensity);
                        } else {
                            // Purple
                            imageData.data[idx] = Math.floor(168 * intensity);
                            imageData.data[idx + 1] = Math.floor(85 * intensity);
                            imageData.data[idx + 2] = Math.floor(247 * intensity);
                        }
                        imageData.data[idx + 3] = Math.floor(255 * intensity * 0.8);
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Draw nodal lines (where pattern ≈ 0)
        ctx.fillStyle = '#ffffff';
        for (let px = 0; px < width; px += 4) {
            for (let py = 0; py < height; py += 4) {
                const x = (px - centerX) / (size / 2);
                const y = (py - centerY) / (size / 2);
                if (x * x + y * y > 1) continue;
                
                const pattern = Math.cos(modeM * Math.PI * x + phaseRad) * Math.cos(modeN * Math.PI * y)
                              - Math.cos(modeN * Math.PI * x) * Math.cos(modeM * Math.PI * y + phaseRad);
                
                if (Math.abs(pattern) < 0.05) {
                    ctx.fillRect(px, py, 2, 2);
                }
            }
        }
        
        // Draw plate border
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px "Space Grotesk", sans-serif';
        ctx.fillText(`Mode (${modeM}, ${modeN})`, 10, height - 60);
        ctx.font = '11px "Space Grotesk", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(`${this.waveform.charAt(0).toUpperCase() + this.waveform.slice(1)}`, 10, height - 44);
    }
    
    // ==================== 3D/4D VISUALIZATION (Three.js) ====================
    
    initThree() {
        if (this.scene) return; // Already initialized
        
        const container = this.threeContainer;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0d24);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.z = 3;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
        
        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        const pointLight1 = new THREE.PointLight(0x00fff2, 1, 100);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xa855f7, 0.5, 100);
        pointLight2.position.set(-5, -5, -5);
        this.scene.add(pointLight2);
        
        // Create geometry based on mode
        this.createGeometry();
        
        // Mouse controls
        this.setupMouseControls();
    }
    
    createGeometry() {
        // Remove existing mesh/points
        if (this.mesh) this.scene.remove(this.mesh);
        if (this.points) this.scene.remove(this.points);
        
        if (this.geometry === '3d') {
            // Spherical harmonics
            const geometry = new THREE.SphereGeometry(1, 64, 64);
            this.originalPositions = geometry.attributes.position.array.slice();
            
            const material = new THREE.MeshStandardMaterial({
                color: this.media[this.medium].color,
                side: THREE.DoubleSide,
                metalness: 0.3,
                roughness: 0.4
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.scene.add(this.mesh);
        } else {
            // 4D Hypersphere
            const numPoints = 5000;
            const positions = new Float32Array(numPoints * 3);
            const colors = new Float32Array(numPoints * 3);
            
            this.hypersphereData = [];
            
            for (let i = 0; i < numPoints; i++) {
                // Random point on 3-sphere (S³)
                const u1 = Math.random();
                const u2 = Math.random();
                const u3 = Math.random();
                
                const theta1 = 2 * Math.PI * u1;
                const theta2 = Math.acos(2 * u2 - 1);
                const theta3 = 2 * Math.PI * u3;
                
                const x = Math.cos(theta1);
                const y = Math.sin(theta1) * Math.cos(theta2);
                const z = Math.sin(theta1) * Math.sin(theta2) * Math.cos(theta3);
                let w = Math.sin(theta1) * Math.sin(theta2) * Math.sin(theta3);
                if (i % 2 === 0) w = -w;
                
                this.hypersphereData.push({ x, y, z, w });
                
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
                
                colors[i * 3] = 0.5;
                colors[i * 3 + 1] = 0.5;
                colors[i * 3 + 2] = 0.5;
            }
            
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            
            const material = new THREE.PointsMaterial({
                size: 0.025,
                vertexColors: true,
                sizeAttenuation: true
            });
            
            this.points = new THREE.Points(geometry, material);
            this.scene.add(this.points);
        }
    }
    
    setupMouseControls() {
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        this.threeContainer.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.threeContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            if (this.mesh) {
                this.mesh.rotation.y += deltaMove.x * 0.005;
                this.mesh.rotation.x += deltaMove.y * 0.005;
            }
            if (this.points) {
                this.points.rotation.y += deltaMove.x * 0.005;
                this.points.rotation.x += deltaMove.y * 0.005;
            }
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        this.threeContainer.addEventListener('mouseup', () => isDragging = false);
        this.threeContainer.addEventListener('mouseleave', () => isDragging = false);
        
        // Zoom
        this.threeContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.position.z += e.deltaY * 0.01;
            this.camera.position.z = Math.max(1.5, Math.min(10, this.camera.position.z));
        }, { passive: false });
        
        // Touch support
        this.threeContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });
        
        this.threeContainer.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };
            
            if (this.mesh) {
                this.mesh.rotation.y += deltaMove.x * 0.005;
                this.mesh.rotation.x += deltaMove.y * 0.005;
            }
            if (this.points) {
                this.points.rotation.y += deltaMove.x * 0.005;
                this.points.rotation.x += deltaMove.y * 0.005;
            }
            
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        });
        
        this.threeContainer.addEventListener('touchend', () => isDragging = false);
    }
    
    update3D() {
        if (!this.mesh || !this.originalPositions) return;
        
        const positions = this.mesh.geometry.attributes.position;
        const phaseRad = this.phase * Math.PI / 180;
        
        // Mode based on frequency
        const l = Math.floor(this.frequency / 300) % 4;
        const m = Math.floor((this.frequency % 300) / 100) % (l + 1);
        
        for (let i = 0; i < positions.count; i++) {
            const ox = this.originalPositions[i * 3];
            const oy = this.originalPositions[i * 3 + 1];
            const oz = this.originalPositions[i * 3 + 2];
            
            const r = Math.sqrt(ox * ox + oy * oy + oz * oz);
            const theta = Math.acos(oz / r);
            const phi = Math.atan2(oy, ox);
            
            // Spherical harmonic calculation
            let Ylm = 0;
            if (l === 0) Ylm = 0.5;
            else if (l === 1) {
                if (m === 0) Ylm = Math.cos(theta);
                else Ylm = Math.sin(theta) * Math.cos(phi + phaseRad);
            } else if (l === 2) {
                if (m === 0) Ylm = (3 * Math.cos(theta) * Math.cos(theta) - 1) / 2;
                else if (m === 1) Ylm = Math.sin(theta) * Math.cos(theta) * Math.cos(phi + phaseRad);
                else Ylm = Math.sin(theta) * Math.sin(theta) * Math.cos(2 * phi + phaseRad);
            } else if (l === 3) {
                if (m === 0) Ylm = (5 * Math.pow(Math.cos(theta), 3) - 3 * Math.cos(theta)) / 2;
                else if (m === 1) Ylm = Math.sin(theta) * (5 * Math.cos(theta) * Math.cos(theta) - 1) * Math.cos(phi + phaseRad);
                else if (m === 2) Ylm = Math.sin(theta) * Math.sin(theta) * Math.cos(theta) * Math.cos(2 * phi + phaseRad);
                else Ylm = Math.pow(Math.sin(theta), 3) * Math.cos(3 * phi + phaseRad);
            }
            
            // Apply damping
            const dampingFactor = Math.exp(-this.damping * Math.abs(theta - Math.PI / 2) * 3);
            
            // Temporal oscillation
            const displacement = 0.35 * Ylm * Math.cos(this.time * 2) * this.amplitude * dampingFactor;
            const newR = 1 + displacement;
            
            positions.setXYZ(i, ox * newR, oy * newR, oz * newR);
        }
        
        positions.needsUpdate = true;
        this.mesh.geometry.computeVertexNormals();
        
        // Auto-rotate
        this.mesh.rotation.y += 0.003;
    }
    
    update4D() {
        if (!this.points || !this.hypersphereData) return;
        
        const positions = this.points.geometry.attributes.position;
        const colors = this.points.geometry.attributes.color;
        const phaseRad = this.phase * Math.PI / 180;
        const angle = this.time * 0.5 + phaseRad;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        
        for (let i = 0; i < this.hypersphereData.length; i++) {
            const { x, y, z, w } = this.hypersphereData[i];
            
            // Rotate in XW plane (4D rotation)
            const newX = x * cosA - w * sinA;
            const newW = x * sinA + w * cosA;
            
            // Stereographic projection
            const dampingFactor = Math.exp(-this.damping * Math.sqrt(newX * newX + y * y + z * z) * 2);
            const scale = (1.5 / (2 - newW)) * (0.5 + 0.5 * this.amplitude) * (0.5 + 0.5 * dampingFactor);
            
            positions.setXYZ(i, newX * scale, y * scale, z * scale);
            
            // Color based on W coordinate
            const wNorm = (newW + 1) / 2;
            const brightness = dampingFactor;
            colors.setXYZ(i, wNorm * brightness, (0.3 + wNorm * 0.4) * brightness, (1 - wNorm) * brightness);
        }
        
        positions.needsUpdate = true;
        colors.needsUpdate = true;
        
        // Auto-rotate
        this.points.rotation.y += 0.002;
    }
    
    // ==================== ANIMATION LOOP ====================
    
    animate() {
        this.time += 0.016;
        
        if (this.geometry === '1d') {
            this.draw1D();
        } else if (this.geometry === '2d') {
            this.draw2D();
        } else if (this.geometry === '3d' && this.mesh) {
            this.update3D();
            this.renderer.render(this.scene, this.camera);
        } else if (this.geometry === '4d' && this.points) {
            this.update4D();
            this.renderer.render(this.scene, this.camera);
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new ResonanceLab();
});

