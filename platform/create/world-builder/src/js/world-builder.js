/**
 * World Builder - PNEUOMA Create
 * Create your own planet/world
 */

class WorldBuilder {
    constructor() {
        this.worldName = 'Unnamed World';
        this.terrain = 'earth';
        this.skyColor = 'blue';
        this.planetSize = 120;
        this.cloudsEnabled = true;
        this.cloudDensity = 50;
        this.glowIntensity = 50;
        this.rotationSpeed = 30;
        this.lifeforms = [];
        this.extras = [];
        this.sunCount = 0;
        this.moonCount = 0;
        
        // Audio system
        this.audioContext = null;
        this.musicPlaying = false;
        this.musicNodes = [];
        
        this.terrainStyles = {
            earth: {
                gradient: 'radial-gradient(circle at 30% 30%, #6ee7b7 0%, #34d399 40%, #059669 100%)',
                glow: 'rgba(52, 211, 153, 0.4)'
            },
            ocean: {
                gradient: 'radial-gradient(circle at 30% 30%, #60a5fa 0%, #3b82f6 40%, #1d4ed8 100%)',
                glow: 'rgba(59, 130, 246, 0.4)'
            },
            desert: {
                gradient: 'radial-gradient(circle at 30% 30%, #fcd34d 0%, #f59e0b 40%, #d97706 100%)',
                glow: 'rgba(245, 158, 11, 0.4)'
            },
            ice: {
                gradient: 'radial-gradient(circle at 30% 30%, #e0f2fe 0%, #bae6fd 40%, #7dd3fc 100%)',
                glow: 'rgba(125, 211, 252, 0.4)'
            },
            volcanic: {
                gradient: 'radial-gradient(circle at 30% 30%, #fca5a5 0%, #ef4444 40%, #b91c1c 100%)',
                glow: 'rgba(239, 68, 68, 0.4)'
            },
            crystal: {
                gradient: 'radial-gradient(circle at 30% 30%, #e9d5ff 0%, #c084fc 40%, #9333ea 100%)',
                glow: 'rgba(192, 132, 252, 0.5)'
            }
        };
        
        this.skyStyles = {
            blue: { atmosphere: 'rgba(59, 130, 246, 0.2)', glow: 'rgba(59, 130, 246, 0.1)' },
            purple: { atmosphere: 'rgba(139, 92, 246, 0.2)', glow: 'rgba(139, 92, 246, 0.1)' },
            pink: { atmosphere: 'rgba(236, 72, 153, 0.2)', glow: 'rgba(236, 72, 153, 0.1)' },
            orange: { atmosphere: 'rgba(249, 115, 22, 0.2)', glow: 'rgba(249, 115, 22, 0.1)' },
            green: { atmosphere: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.1)' },
            none: { atmosphere: 'transparent', glow: 'transparent' }
        };
        
        this.lifeNames = {
            trees: '🌳 Forests',
            flowers: '🌸 Flowers',
            creatures: '🦋 Creatures',
            fish: '🐠 Ocean Life',
            birds: '🕊️ Birds',
            mushrooms: '🍄 Fungi'
        };
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupStars();
        this.setupEventListeners();
        this.applyPlanetStyles();
    }
    
    // ==================== AUDIO SYSTEM ====================
    
    initAudio() {
        if (this.audioContext) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
    }
    
    startSpaceMusic() {
        if (!this.audioContext) this.initAudio();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.musicPlaying = true;
        document.getElementById('music-toggle').classList.add('playing');
        document.querySelector('.music-icon').textContent = '🔊';
        
        // Create ambient space drone layers
        this.createDroneLayer(55, 0.15);    // Deep bass drone
        this.createDroneLayer(110, 0.08);   // Low harmonic
        this.createDroneLayer(165, 0.05);   // Fifth
        this.createDroneLayer(220, 0.03);   // Octave shimmer
        
        // Create evolving pad
        this.createEvolvingPad();
        
        // Create occasional sparkles
        this.sparkleInterval = setInterval(() => {
            if (this.musicPlaying) this.createSparkle();
        }, 3000 + Math.random() * 4000);
    }
    
    createDroneLayer(freq, volume) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Slow frequency modulation for movement
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.05 + Math.random() * 0.1;
        lfoGain.gain.value = freq * 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 3);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        
        this.musicNodes.push({ osc, gain, lfo });
    }
    
    createEvolvingPad() {
        // Create a slowly evolving pad sound
        const padFreqs = [82.41, 123.47, 164.81, 246.94]; // E2, B2, E3, B3
        
        padFreqs.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            // Volume envelope that evolves
            gain.gain.value = 0;
            this.schedulePadEnvelope(gain, i * 2);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            
            this.musicNodes.push({ osc, gain });
        });
    }
    
    schedulePadEnvelope(gain, delay) {
        const now = this.audioContext.currentTime;
        const cycle = 12; // 12 second cycle
        
        const scheduleNext = () => {
            if (!this.musicPlaying) return;
            
            const t = this.audioContext.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.04, t + 4);
            gain.gain.linearRampToValueAtTime(0.02, t + 8);
            gain.gain.linearRampToValueAtTime(0, t + 12);
            
            setTimeout(scheduleNext, cycle * 1000);
        };
        
        setTimeout(scheduleNext, delay * 1000);
    }
    
    createSparkle() {
        if (!this.musicPlaying) return;
        
        const freq = 800 + Math.random() * 2000;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.audioContext.currentTime + 2);
        
        gain.gain.value = 0.02;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 2);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 2);
    }
    
    stopSpaceMusic() {
        this.musicPlaying = false;
        document.getElementById('music-toggle').classList.remove('playing');
        document.querySelector('.music-icon').textContent = '🔇';
        
        if (this.sparkleInterval) {
            clearInterval(this.sparkleInterval);
        }
        
        // Fade out all nodes
        this.musicNodes.forEach(node => {
            if (node.gain) {
                node.gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
            }
            setTimeout(() => {
                if (node.osc) node.osc.stop();
                if (node.lfo) node.lfo.stop();
            }, 1100);
        });
        
        this.musicNodes = [];
    }
    
    toggleMusic() {
        if (this.musicPlaying) {
            this.stopSpaceMusic();
        } else {
            this.startSpaceMusic();
        }
        this.vibrate([15]);
    }
    
    // ==================== SUNS & MOONS ====================
    
    updateSuns(count) {
        this.sunCount = count;
        const container = document.getElementById('suns-container');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const sun = document.createElement('div');
            sun.className = `sun sun-${i}`;
            container.appendChild(sun);
        }
        
        document.getElementById('suns-count').textContent = count;
        this.vibrate([20]);
    }
    
    updateMoons(count) {
        this.moonCount = count;
        this.orbitalObjects.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const moon = document.createElement('div');
            moon.className = `moon moon-${i}`;
            this.orbitalObjects.appendChild(moon);
        }
        
        document.getElementById('moons-count').textContent = count;
        this.vibrate([15]);
    }
    
    // ==================== CORE METHODS ====================
    
    cacheElements() {
        // Screens
        this.startScreen = document.getElementById('start-screen');
        this.builderScreen = document.getElementById('builder-screen');
        
        // Planet elements
        this.planet = document.getElementById('planet');
        this.planetSurface = document.querySelector('.planet-surface');
        this.planetAtmosphere = document.querySelector('.planet-atmosphere');
        this.planetClouds = document.querySelector('.planet-clouds');
        this.planetRing = document.getElementById('planet-ring');
        this.orbitalObjects = document.getElementById('orbital-objects');
        this.worldNameDisplay = document.getElementById('world-name');
        
        // Modals
        this.nameModal = document.getElementById('name-modal');
        this.nameInput = document.getElementById('name-input');
        this.saveModal = document.getElementById('save-modal');
        
        // Life inventory
        this.lifeInventory = document.getElementById('life-inventory');
    }
    
    setupStars() {
        const canvas = document.getElementById('stars-canvas');
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        
        // Create stars
        const stars = [];
        const numStars = 200;
        
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5,
                alpha: Math.random(),
                twinkleSpeed: 0.005 + Math.random() * 0.01
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                star.alpha += star.twinkleSpeed;
                if (star.alpha > 1 || star.alpha < 0.3) {
                    star.twinkleSpeed *= -1;
                }
                
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    setupEventListeners() {
        // Begin button
        document.getElementById('begin-btn').addEventListener('click', () => {
            this.showBuilder();
        });
        
        // Music toggle
        document.getElementById('music-toggle').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPanel(tab));
        });
        
        // Terrain options
        document.querySelectorAll('[data-terrain]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-terrain]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.terrain = btn.dataset.terrain;
                this.applyPlanetStyles();
                this.vibrate([20]);
            });
        });
        
        // Planet size
        document.getElementById('planet-size').addEventListener('input', (e) => {
            this.planetSize = parseInt(e.target.value);
            this.planet.style.width = `${this.planetSize}px`;
            this.planet.style.height = `${this.planetSize}px`;
        });
        
        // Sky color
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.skyColor = btn.dataset.color;
                this.applyAtmosphere();
                this.vibrate([15]);
            });
        });
        
        // Clouds toggle
        document.getElementById('clouds-toggle').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            this.cloudsEnabled = e.currentTarget.classList.contains('active');
            this.planetClouds.style.opacity = this.cloudsEnabled ? '1' : '0';
        });
        
        // Cloud density
        document.getElementById('cloud-density').addEventListener('input', (e) => {
            this.cloudDensity = parseInt(e.target.value);
            this.planetClouds.style.opacity = this.cloudsEnabled ? (this.cloudDensity / 100) : 0;
        });
        
        // Glow intensity
        document.getElementById('glow-intensity').addEventListener('input', (e) => {
            this.glowIntensity = parseInt(e.target.value);
            this.applyPlanetStyles();
        });
        
        // Life buttons
        document.querySelectorAll('.life-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const life = btn.dataset.life;
                if (this.lifeforms.includes(life)) {
                    this.lifeforms = this.lifeforms.filter(l => l !== life);
                    btn.classList.remove('added');
                } else {
                    this.lifeforms.push(life);
                    btn.classList.add('added');
                }
                this.updateLifeInventory();
                this.vibrate([25]);
            });
        });
        
        // Suns slider
        document.getElementById('suns-slider').addEventListener('input', (e) => {
            this.updateSuns(parseInt(e.target.value));
        });
        
        // Moons slider
        document.getElementById('moons-slider').addEventListener('input', (e) => {
            this.updateMoons(parseInt(e.target.value));
        });
        
        // Extra buttons
        document.querySelectorAll('.extra-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const extra = btn.dataset.extra;
                if (this.extras.includes(extra)) {
                    this.extras = this.extras.filter(e => e !== extra);
                    btn.classList.remove('added');
                    this.removeExtra(extra);
                } else {
                    this.extras.push(extra);
                    btn.classList.add('added');
                    this.addExtra(extra);
                }
                this.vibrate([30]);
            });
        });
        
        // Rotation speed
        document.getElementById('rotation-speed').addEventListener('input', (e) => {
            this.rotationSpeed = parseInt(e.target.value);
            const duration = this.rotationSpeed > 0 ? (100 - this.rotationSpeed) * 0.5 + 5 : 0;
            this.planetClouds.style.animationDuration = duration > 0 ? `${duration}s` : '0s';
            this.planetClouds.style.animationPlayState = this.rotationSpeed > 0 ? 'running' : 'paused';
        });
        
        // Randomize
        document.getElementById('randomize-btn').addEventListener('click', () => {
            this.randomize();
        });
        
        // Save
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveWorld();
        });
        
        // Share
        document.getElementById('share-btn').addEventListener('click', () => {
            this.shareWorld();
        });
        
        // Enter Planet (Surface View)
        document.getElementById('enter-planet-btn').addEventListener('click', () => {
            this.enterPlanet();
        });
        
        // Explore 3D (First Person View)
        document.getElementById('explore-3d-btn').addEventListener('click', () => {
            this.explore3D();
        });
        
        // Rename
        document.getElementById('rename-btn').addEventListener('click', () => {
            this.nameInput.value = this.worldName === 'Unnamed World' ? '' : this.worldName;
            this.nameModal.classList.add('active');
            this.nameInput.focus();
        });
        
        // Name modal
        document.getElementById('name-cancel').addEventListener('click', () => {
            this.nameModal.classList.remove('active');
        });
        
        document.getElementById('name-save').addEventListener('click', () => {
            if (this.nameInput.value.trim()) {
                this.worldName = this.nameInput.value.trim();
                this.worldNameDisplay.textContent = this.worldName;
            }
            this.nameModal.classList.remove('active');
        });
        
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('name-save').click();
            }
        });
        
        // Save modal close
        document.getElementById('save-close').addEventListener('click', () => {
            this.saveModal.classList.remove('active');
        });
    }
    
    showBuilder() {
        this.startScreen.classList.remove('active');
        this.builderScreen.classList.add('active');
        this.vibrate([30, 50, 30]);
    }
    
    switchPanel(tab) {
        // Update tabs
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update content
        document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
        document.getElementById(`${tab.dataset.panel}-panel`).classList.add('active');
        
        this.vibrate([10]);
    }
    
    applyPlanetStyles() {
        const style = this.terrainStyles[this.terrain];
        this.planetSurface.style.background = style.gradient;
        
        const glowOpacity = this.glowIntensity / 100;
        this.planetSurface.style.boxShadow = `
            0 0 ${60 * glowOpacity}px ${style.glow.replace('0.4', String(0.4 * glowOpacity))},
            inset -20px -20px 40px rgba(0, 0, 0, 0.4)
        `;
    }
    
    applyAtmosphere() {
        const style = this.skyStyles[this.skyColor];
        this.planetAtmosphere.style.background = `radial-gradient(circle, 
            ${style.atmosphere} 0%, 
            ${style.glow} 50%,
            transparent 70%)`;
    }
    
    updateLifeInventory() {
        if (this.lifeforms.length === 0) {
            this.lifeInventory.innerHTML = '<p class="inventory-empty">Tap icons above to add life to your world</p>';
        } else {
            const tags = this.lifeforms.map(life => `
                <span class="life-tag">
                    ${this.lifeNames[life]}
                    <button data-remove="${life}">✕</button>
                </span>
            `).join('');
            this.lifeInventory.innerHTML = `<div class="life-tags">${tags}</div>`;
            
            // Add remove handlers
            this.lifeInventory.querySelectorAll('[data-remove]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const life = btn.dataset.remove;
                    this.lifeforms = this.lifeforms.filter(l => l !== life);
                    document.querySelector(`[data-life="${life}"]`).classList.remove('added');
                    this.updateLifeInventory();
                });
            });
        }
    }
    
    addExtra(extra) {
        switch (extra) {
            case 'ring':
                this.planetRing.classList.add('visible');
                break;
            case 'aurora':
                let aurora = document.querySelector('.aurora');
                if (!aurora) {
                    aurora = document.createElement('div');
                    aurora.className = 'aurora';
                    this.planet.appendChild(aurora);
                }
                aurora.classList.add('visible');
                break;
            case 'stars':
                // Stars are already in background, could enhance density
                break;
        }
    }
    
    removeExtra(extra) {
        switch (extra) {
            case 'ring':
                this.planetRing.classList.remove('visible');
                break;
            case 'aurora':
                const aurora = document.querySelector('.aurora');
                if (aurora) aurora.classList.remove('visible');
                break;
        }
    }
    
    randomize() {
        // Random terrain
        const terrains = Object.keys(this.terrainStyles);
        this.terrain = terrains[Math.floor(Math.random() * terrains.length)];
        document.querySelectorAll('[data-terrain]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.terrain === this.terrain);
        });
        
        // Random size
        this.planetSize = 80 + Math.floor(Math.random() * 120);
        document.getElementById('planet-size').value = this.planetSize;
        this.planet.style.width = `${this.planetSize}px`;
        this.planet.style.height = `${this.planetSize}px`;
        
        // Random sky
        const skies = Object.keys(this.skyStyles);
        this.skyColor = skies[Math.floor(Math.random() * (skies.length - 1))]; // Exclude 'none'
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.skyColor);
        });
        
        // Random suns (0-2)
        const randomSuns = Math.floor(Math.random() * 3);
        document.getElementById('suns-slider').value = randomSuns;
        this.updateSuns(randomSuns);
        
        // Random moons (0-10)
        const randomMoons = Math.floor(Math.random() * 11);
        document.getElementById('moons-slider').value = randomMoons;
        this.updateMoons(randomMoons);
        
        // Random extras
        this.extras = [];
        document.querySelectorAll('.extra-btn').forEach(btn => {
            btn.classList.remove('added');
            this.removeExtra(btn.dataset.extra);
        });
        
        const allExtras = ['ring', 'aurora'];
        allExtras.forEach(extra => {
            if (Math.random() > 0.5) {
                this.extras.push(extra);
                document.querySelector(`[data-extra="${extra}"]`).classList.add('added');
                this.addExtra(extra);
            }
        });
        
        // Random life
        this.lifeforms = [];
        document.querySelectorAll('.life-btn').forEach(btn => {
            btn.classList.remove('added');
            if (Math.random() > 0.6) {
                const life = btn.dataset.life;
                this.lifeforms.push(life);
                btn.classList.add('added');
            }
        });
        
        this.applyPlanetStyles();
        this.applyAtmosphere();
        this.updateLifeInventory();
        this.vibrate([50, 30, 50, 30, 50]);
        
        // Generate random name
        const prefixes = ['Nova', 'Astra', 'Celestia', 'Nebula', 'Zephyr', 'Aurora', 'Lumina', 'Cosmos', 'Orion', 'Lyra', 'Vega', 'Sirius'];
        const suffixes = ['Prime', 'Minor', 'Major', 'X', 'VII', 'Alpha', 'Omega', 'Zero', 'IX', 'III', 'Proxima', 'Ultima'];
        this.worldName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        this.worldNameDisplay.textContent = this.worldName;
    }
    
    saveWorld() {
        const worldData = {
            name: this.worldName,
            terrain: this.terrain,
            skyColor: this.skyColor,
            size: this.planetSize,
            clouds: this.cloudsEnabled,
            cloudDensity: this.cloudDensity,
            glowIntensity: this.glowIntensity,
            rotationSpeed: this.rotationSpeed,
            lifeforms: this.lifeforms,
            extras: this.extras,
            sunCount: this.sunCount,
            moonCount: this.moonCount,
            savedAt: new Date().toISOString()
        };
        
        // Save to localStorage
        let worlds = JSON.parse(localStorage.getItem('pneuoma-worlds') || '[]');
        worlds.push(worldData);
        localStorage.setItem('pneuoma-worlds', JSON.stringify(worlds));
        
        document.getElementById('save-message').textContent = 
            `"${this.worldName}" has been saved to your collection.`;
        this.saveModal.classList.add('active');
        this.vibrate([30, 30, 30]);
    }
    
    shareWorld() {
        const shareText = `I created a planet called "${this.worldName}" in PNEUOMA World Builder! 🌍✨`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My PNEUOMA World',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText + '\n' + window.location.href);
            alert('Link copied to clipboard!');
        }
        
        this.vibrate([20, 20]);
    }
    
    enterPlanet() {
        // Save current world first
        this.saveWorldForExplore();
        
        // Navigate to planet surface with world name
        this.vibrate([30, 50, 30]);
        window.location.href = `../planet-surface/index.html?planet=${encodeURIComponent(this.worldName)}`;
    }
    
    explore3D() {
        // Save current world first
        this.saveWorldForExplore();
        
        // Navigate to 3D planet exploration
        this.vibrate([30, 50, 30]);
        window.location.href = `../planet-explore/index.html?planet=${encodeURIComponent(this.worldName)}`;
    }
    
    saveWorldForExplore() {
        // Save complete world data for exploration modes
        const worldData = {
            name: this.worldName,
            terrain: this.terrain,
            skyColor: this.skyColor,
            size: this.planetSize,
            clouds: this.cloudsEnabled,
            cloudDensity: this.cloudDensity,
            glowIntensity: this.glowIntensity,
            rotationSpeed: this.rotationSpeed,
            lifeforms: this.lifeforms,
            extras: this.extras,
            sunCount: this.sunCount,
            moonCount: this.moonCount,
            savedAt: new Date().toISOString()
        };
        
        // Save to localStorage (update if exists, add if new)
        let worlds = JSON.parse(localStorage.getItem('pneuoma-worlds') || '[]');
        const existingIndex = worlds.findIndex(w => w.name === this.worldName);
        
        if (existingIndex >= 0) {
            worlds[existingIndex] = worldData;
        } else {
            worlds.push(worldData);
        }
        
        localStorage.setItem('pneuoma-worlds', JSON.stringify(worlds));
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.worldBuilder = new WorldBuilder();
});
