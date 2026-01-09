/**
 * Tissue Optics Simulator
 * Monte Carlo simulation of light transport through biological tissue
 */

class TissueOpticsSimulator {
    constructor() {
        this.canvas = document.getElementById('tissue-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Parameters
        this.wavelength = 660;
        this.intensity = 50;
        this.photonCount = 500;
        this.tissue = 'skin';
        
        // Tissue optical properties (μa: absorption, μs: scattering in mm⁻¹)
        this.tissueProperties = {
            skin: { name: 'Skin', color: '#ffcba4', μa: { red: 0.1, nir: 0.05, green: 0.3, blue: 0.5 }, μs: 20, g: 0.9 },
            muscle: { name: 'Muscle', color: '#8b4557', μa: { red: 0.15, nir: 0.08, green: 0.4, blue: 0.6 }, μs: 15, g: 0.95 },
            fat: { name: 'Fat', color: '#ffe4b5', μa: { red: 0.05, nir: 0.03, green: 0.15, blue: 0.25 }, μs: 10, g: 0.85 },
            bone: { name: 'Bone', color: '#f5f5dc', μa: { red: 0.02, nir: 0.01, green: 0.1, blue: 0.2 }, μs: 30, g: 0.9 }
        };
        
        // Photon simulation state
        this.photons = [];
        this.isSimulating = false;
        this.absorbed = 0;
        this.scattered = 0;
        this.transmitted = 0;
        this.penetrationDepth = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.setupEventListeners();
        this.updateWavelengthColor();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        
        // Initial simulation
        setTimeout(() => this.runSimulation(), 500);
    }
    
    resize() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }
    
    setupEventListeners() {
        // Wavelength
        document.getElementById('wavelength').addEventListener('input', (e) => {
            this.wavelength = parseInt(e.target.value);
            document.getElementById('wavelength-value').textContent = `${this.wavelength} nm`;
            this.updateWavelengthColor();
            this.updatePresetButtons();
        });
        
        // Intensity
        document.getElementById('intensity').addEventListener('input', (e) => {
            this.intensity = parseInt(e.target.value);
            document.getElementById('intensity-value').textContent = `${this.intensity} mW/cm²`;
        });
        
        // Photon count
        document.getElementById('photons').addEventListener('input', (e) => {
            this.photonCount = parseInt(e.target.value);
            document.getElementById('photons-value').textContent = `${this.photonCount} photons`;
        });
        
        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.wavelength = parseInt(btn.dataset.wavelength);
                document.getElementById('wavelength').value = this.wavelength;
                document.getElementById('wavelength-value').textContent = `${this.wavelength} nm`;
                this.updateWavelengthColor();
                this.updatePresetButtons();
            });
        });
        
        // Tissue buttons
        document.querySelectorAll('.tissue-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tissue-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.tissue = btn.dataset.tissue;
            });
        });
        
        // Simulate button
        document.getElementById('simulate-btn').addEventListener('click', () => {
            this.runSimulation();
        });
    }
    
    updateWavelengthColor() {
        const color = this.wavelengthToColor(this.wavelength);
        const colorEl = document.getElementById('wavelength-color');
        const valueEl = document.getElementById('wavelength-value');
        colorEl.style.backgroundColor = color;
        colorEl.style.color = color;
        valueEl.style.color = color;
    }
    
    updatePresetButtons() {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            const btnWavelength = parseInt(btn.dataset.wavelength);
            btn.classList.toggle('active', Math.abs(this.wavelength - btnWavelength) < 30);
        });
    }
    
    wavelengthToColor(wavelength) {
        let r, g, b;
        
        if (wavelength >= 380 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 380);
            g = 0;
            b = 1;
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0;
            g = (wavelength - 440) / (490 - 440);
            b = 1;
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0;
            g = 1;
            b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1;
            b = 0;
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1;
            g = -(wavelength - 645) / (645 - 580);
            b = 0;
        } else if (wavelength >= 645 && wavelength <= 780) {
            r = 1;
            g = 0;
            b = 0;
        } else {
            // NIR - show as dark red
            r = 0.8;
            g = 0.1;
            b = 0.1;
        }
        
        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
    
    getAbsorptionCoeff() {
        const props = this.tissueProperties[this.tissue];
        if (this.wavelength < 500) return props.μa.blue;
        if (this.wavelength < 600) return props.μa.green;
        if (this.wavelength < 750) return props.μa.red;
        return props.μa.nir;
    }
    
    runSimulation() {
        this.photons = [];
        this.absorbed = 0;
        this.scattered = 0;
        this.transmitted = 0;
        this.penetrationDepth = 0;
        this.isSimulating = true;
        
        const props = this.tissueProperties[this.tissue];
        const μa = this.getAbsorptionCoeff();
        const μs = props.μs;
        const g = props.g;
        const μt = μa + μs;
        
        const maxDepths = [];
        
        // Launch photons
        for (let i = 0; i < this.photonCount; i++) {
            const photon = {
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 40,
                y: 50,
                vx: (Math.random() - 0.5) * 0.3,
                vy: 1,
                weight: 1,
                alive: true,
                path: [],
                maxDepth: 0,
                delay: i * 5 // Stagger launch
            };
            
            // Simulate photon path
            let depth = 0;
            let steps = 0;
            const maxSteps = 500;
            
            while (photon.weight > 0.01 && steps < maxSteps && depth < 20) {
                // Step size
                const stepSize = -Math.log(Math.random()) / μt;
                
                // Scatter
                const θ = Math.acos((1 + g*g - Math.pow((1 - g*g) / (1 - g + 2*g*Math.random()), 2)) / (2 * g));
                const φ = 2 * Math.PI * Math.random();
                
                photon.vx = Math.sin(θ) * Math.cos(φ) * 0.3 + photon.vx * 0.7;
                photon.vy = Math.cos(θ) * 0.7 + photon.vy * 0.3;
                
                // Normalize
                const mag = Math.sqrt(photon.vx * photon.vx + photon.vy * photon.vy);
                photon.vx /= mag;
                photon.vy /= mag;
                
                // Move
                photon.x += photon.vx * stepSize * 15;
                photon.y += photon.vy * stepSize * 15;
                
                depth = (photon.y - 50) / 15; // Convert to mm
                if (depth > photon.maxDepth) photon.maxDepth = depth;
                
                photon.path.push({ x: photon.x, y: photon.y });
                
                // Absorb
                const absorbProb = μa / μt;
                photon.weight *= (1 - absorbProb);
                
                // Check boundaries
                if (photon.y < 50) {
                    photon.alive = false;
                    this.scattered++;
                    break;
                }
                if (photon.y > this.canvas.height - 50) {
                    photon.alive = false;
                    this.transmitted++;
                    break;
                }
                
                steps++;
            }
            
            if (photon.weight <= 0.01) {
                this.absorbed++;
            }
            
            maxDepths.push(photon.maxDepth);
            this.photons.push(photon);
        }
        
        // Calculate stats
        const total = this.photonCount;
        this.penetrationDepth = maxDepths.reduce((a, b) => a + b, 0) / maxDepths.length;
        
        // Update display
        document.getElementById('penetration-value').textContent = `${this.penetrationDepth.toFixed(1)} mm`;
        document.getElementById('absorbed-value').textContent = `${Math.round(this.absorbed / total * 100)}%`;
        document.getElementById('scattered-value').textContent = `${Math.round(this.scattered / total * 100)}%`;
        document.getElementById('transmitted-value').textContent = `${Math.round(this.transmitted / total * 100)}%`;
        
        // Update depth marker
        const depthMarker = document.getElementById('depth-marker');
        const depthValue = document.getElementById('depth-value');
        const depthPercent = Math.min(100, (this.penetrationDepth / 20) * 100);
        depthMarker.style.top = `${depthPercent}%`;
        depthValue.textContent = `${this.penetrationDepth.toFixed(1)} mm`;
    }
    
    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);
        
        // Draw tissue layers
        const props = this.tissueProperties[this.tissue];
        const gradient = ctx.createLinearGradient(0, 50, 0, h);
        gradient.addColorStop(0, props.color);
        gradient.addColorStop(0.3, this.adjustColor(props.color, -30));
        gradient.addColorStop(1, this.adjustColor(props.color, -60));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 50, w, h - 50);
        
        // Draw light source
        const lightColor = this.wavelengthToColor(this.wavelength);
        ctx.fillStyle = lightColor;
        ctx.shadowColor = lightColor;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(w / 2, 25, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw light beam
        const beamGradient = ctx.createLinearGradient(w/2 - 20, 30, w/2 + 20, 50);
        beamGradient.addColorStop(0, `${lightColor}00`);
        beamGradient.addColorStop(0.5, `${lightColor}40`);
        beamGradient.addColorStop(1, `${lightColor}00`);
        ctx.fillStyle = beamGradient;
        ctx.fillRect(w/2 - 30, 30, 60, 25);
        
        // Draw photon paths
        if (this.photons.length > 0) {
            ctx.globalAlpha = 0.6;
            
            this.photons.forEach((photon, i) => {
                if (photon.path.length < 2) return;
                
                ctx.beginPath();
                ctx.strokeStyle = lightColor;
                ctx.lineWidth = 1;
                
                const pathLength = Math.min(photon.path.length, Math.floor((Date.now() - photon.delay) / 10));
                
                for (let j = 0; j < pathLength; j++) {
                    const p = photon.path[j];
                    if (j === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            });
            
            ctx.globalAlpha = 1;
        }
        
        // Draw surface line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(w, 50);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px Space Grotesk';
        ctx.fillText(`${props.name} Tissue`, 20, h - 20);
    }
    
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TissueOpticsSimulator();
});

