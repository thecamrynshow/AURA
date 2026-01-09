/**
 * Sonoluminescence Simulator
 * Simulates bubble dynamics and light emission from acoustic cavitation
 */

class SonoluminescenceSimulator {
    constructor() {
        // Physics parameters
        this.frequency = 25000; // Hz
        this.amplitude = 1.3;   // atm
        this.initialRadius = 50; // μm
        this.gas = 'air';
        this.speed = 1;
        
        // Gas properties (gamma values)
        this.gasProperties = {
            air: { gamma: 1.4, name: 'Air' },
            argon: { gamma: 1.67, name: 'Argon' },
            xenon: { gamma: 1.66, name: 'Xenon' },
            helium: { gamma: 1.66, name: 'Helium' }
        };
        
        // Simulation state
        this.time = 0;
        this.radius = this.initialRadius;
        this.velocity = 0;
        this.temperature = 300;
        this.pressure = 1;
        this.lightOutput = 0;
        this.phase = 0;
        this.isPlaying = true;
        
        // DOM elements
        this.bubble = document.getElementById('bubble');
        this.bubbleGlow = document.getElementById('bubble-glow');
        this.flash = document.getElementById('flash');
        this.phaseFill = document.getElementById('phase-fill');
        this.phaseMarker = document.getElementById('phase-marker');
        
        // Displays
        this.radiusValue = document.getElementById('radius-value');
        this.tempValue = document.getElementById('temp-value');
        this.pressureValue = document.getElementById('pressure-value');
        this.lightValue = document.getElementById('light-value');
        
        // Canvas for background
        this.canvas = document.getElementById('bubble-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.animate();
        
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = this.canvas.parentElement.clientHeight;
    }
    
    setupEventListeners() {
        // Frequency
        document.getElementById('frequency').addEventListener('input', (e) => {
            this.frequency = parseInt(e.target.value);
            document.getElementById('freq-display').textContent = `${(this.frequency/1000).toFixed(0)} kHz`;
        });
        
        // Amplitude
        document.getElementById('amplitude').addEventListener('input', (e) => {
            this.amplitude = parseFloat(e.target.value);
            document.getElementById('amp-display').textContent = `${this.amplitude.toFixed(2)} atm`;
        });
        
        // Initial Radius
        document.getElementById('radius').addEventListener('input', (e) => {
            this.initialRadius = parseInt(e.target.value);
            document.getElementById('radius-display').textContent = `${this.initialRadius} μm`;
        });
        
        // Speed
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speed-display').textContent = `${this.speed}x`;
        });
        
        // Gas type
        document.querySelectorAll('.gas-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.gas-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gas = btn.dataset.gas;
            });
        });
        
        // Play/Pause
        document.getElementById('play-btn').addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            document.getElementById('play-icon').textContent = this.isPlaying ? '⏸' : '▶';
        });
        
        // Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });
    }
    
    reset() {
        this.time = 0;
        this.radius = this.initialRadius;
        this.velocity = 0;
        this.temperature = 300;
        this.pressure = 1;
        this.lightOutput = 0;
        this.phase = 0;
    }
    
    // Simplified Rayleigh-Plesset dynamics
    updatePhysics(dt) {
        const omega = 2 * Math.PI * this.frequency;
        const P0 = 1; // Atmospheric pressure (atm)
        const gamma = this.gasProperties[this.gas].gamma;
        
        // Acoustic driving pressure
        const Pac = this.amplitude * Math.sin(omega * this.time);
        
        // Phase in cycle (0 to 1)
        this.phase = ((omega * this.time) % (2 * Math.PI)) / (2 * Math.PI);
        
        // Simplified bubble dynamics
        const R0 = this.initialRadius;
        const compressionRatio = R0 / Math.max(this.radius, 1);
        
        // Driving force on bubble
        const drivingForce = -Pac * 50; // Scaled for visualization
        
        // Restoring force (gas pressure)
        const gasForce = Math.pow(compressionRatio, 3 * gamma) - 1;
        
        // Damping
        const damping = 0.1 * this.velocity;
        
        // Acceleration
        const acceleration = drivingForce + gasForce * 20 - damping;
        
        // Update velocity and radius
        this.velocity += acceleration * dt * this.speed;
        this.radius += this.velocity * dt * this.speed;
        
        // Clamp radius
        this.radius = Math.max(5, Math.min(this.initialRadius * 3, this.radius));
        
        // Temperature (adiabatic compression)
        const T0 = 300;
        this.temperature = T0 * Math.pow(R0 / Math.max(this.radius, 5), 3 * (gamma - 1));
        this.temperature = Math.min(this.temperature, 20000); // Cap at 20,000K
        
        // Pressure
        this.pressure = Math.pow(R0 / Math.max(this.radius, 5), 3 * gamma);
        this.pressure = Math.min(this.pressure, 10000);
        
        // Light output (peaks during collapse)
        if (this.temperature > 5000 && this.radius < R0 * 0.3) {
            this.lightOutput = Math.min(100, (this.temperature - 5000) / 100);
        } else {
            this.lightOutput = Math.max(0, this.lightOutput - 5);
        }
        
        this.time += dt;
    }
    
    updateDisplay() {
        // Update bubble size
        const scale = this.radius / this.initialRadius;
        this.bubble.style.transform = `scale(${scale})`;
        
        // Update glow based on temperature
        const glowIntensity = Math.min(1, (this.temperature - 300) / 10000);
        this.bubbleGlow.style.opacity = glowIntensity;
        
        // Flash on high light output
        if (this.lightOutput > 50) {
            this.flash.classList.add('active');
            setTimeout(() => this.flash.classList.remove('active'), 150);
        }
        
        // Update status values
        this.radiusValue.textContent = `${Math.round(this.radius)} μm`;
        this.tempValue.textContent = this.temperature > 1000 
            ? `${(this.temperature/1000).toFixed(1)}K K` 
            : `${Math.round(this.temperature)} K`;
        this.pressureValue.textContent = this.pressure > 100 
            ? `${(this.pressure/1000).toFixed(1)}K atm` 
            : `${this.pressure.toFixed(1)} atm`;
        this.lightValue.textContent = `${Math.round(this.lightOutput)}%`;
        
        // Temperature color
        if (this.temperature > 10000) {
            this.tempValue.style.color = '#fff';
            this.tempValue.style.textShadow = '0 0 20px #fff';
        } else if (this.temperature > 5000) {
            this.tempValue.style.color = '#00fff2';
            this.tempValue.style.textShadow = '0 0 10px #00fff2';
        } else {
            this.tempValue.style.color = '#e5e7eb';
            this.tempValue.style.textShadow = 'none';
        }
        
        // Update phase indicator
        this.phaseFill.style.width = `${this.phase * 100}%`;
        this.phaseMarker.style.left = `${this.phase * 100}%`;
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Clear with dark gradient
        ctx.fillStyle = 'rgba(5, 5, 16, 0.3)';
        ctx.fillRect(0, 0, w, h);
        
        // Draw acoustic waves
        const omega = 2 * Math.PI * this.frequency;
        const waveAmplitude = this.amplitude * 30;
        
        ctx.strokeStyle = `rgba(14, 165, 233, ${0.1 + this.amplitude * 0.1})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const offset = i * (h / 5);
            for (let x = 0; x < w; x += 5) {
                const y = offset + waveAmplitude * Math.sin(omega * this.time * 0.0001 + x * 0.02);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Center glow when light output is high
        if (this.lightOutput > 10) {
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 200);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${this.lightOutput / 200})`);
            gradient.addColorStop(0.3, `rgba(0, 255, 242, ${this.lightOutput / 400})`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    animate() {
        if (this.isPlaying) {
            this.updatePhysics(0.016);
        }
        
        this.drawBackground();
        this.updateDisplay();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SonoluminescenceSimulator();
});

