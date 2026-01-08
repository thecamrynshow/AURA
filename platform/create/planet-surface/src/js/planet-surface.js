/**
 * Planet Surface - Walk among your creatures!
 * PNEUOMA Create
 */

class PlanetSurface {
    constructor() {
        // Planet data (loaded from URL params or localStorage)
        this.planet = null;
        this.creatures = [];
        this.lifeforms = [];
        this.timeOfDay = 'day';
        this.weather = 'clear';
        
        // Audio
        this.audioContext = null;
        this.ambientGain = null;
        this.isMusicPlaying = false;
        
        this.init();
    }
    
    init() {
        this.loadPlanetData();
        this.cacheElements();
        this.setupStars();
        this.setupEventListeners();
        this.generateLandscape();
        this.generateClouds();
        this.applyPlanetTheme();
        this.loadCreatures();
        this.loadLifeforms();
        this.startAmbientLoop();
        this.setupAudio();
        this.updateUI();
    }
    
    loadPlanetData() {
        // Get planet from URL params or localStorage
        const params = new URLSearchParams(window.location.search);
        const planetName = params.get('planet');
        
        if (planetName) {
            // Find planet in saved worlds
            const savedWorlds = JSON.parse(localStorage.getItem('pneuoma-worlds') || '[]');
            this.planet = savedWorlds.find(w => w.name === planetName);
        }
        
        if (!this.planet) {
            // Default planet
            this.planet = {
                name: 'New World',
                terrain: 'earth',
                color: '#4ade80',
                atmosphere: { color: '#87CEEB', density: 50 },
                life: true,
                suns: { primary: true, secondary: false },
                moons: 1
            };
        }
        
        // Load creatures for this planet
        const allCreatures = JSON.parse(localStorage.getItem('pneuoma-creatures') || '[]');
        const planetCreatures = JSON.parse(localStorage.getItem(`planet-creatures-${this.planet.name}`) || '[]');
        this.creatures = planetCreatures.map(name => allCreatures.find(c => c.name === name)).filter(Boolean);
    }
    
    cacheElements() {
        this.sky = document.getElementById('sky');
        this.sun1 = document.getElementById('sun-1');
        this.sun2 = document.getElementById('sun-2');
        this.clouds = document.getElementById('clouds');
        this.aurora = document.getElementById('aurora');
        this.starsCanvas = document.getElementById('stars-canvas');
        this.distantLayer = document.getElementById('distant-layer');
        this.midLayer = document.getElementById('mid-layer');
        this.ground = document.getElementById('ground');
        this.lifeLayer = document.getElementById('life-layer');
        this.creaturesLayer = document.getElementById('creatures-layer');
        this.weatherCanvas = document.getElementById('weather-canvas');
        this.weatherLayer = document.getElementById('weather-layer');
        this.touchRipple = document.getElementById('touch-ripple');
        
        this.planetNameEl = document.getElementById('planet-name');
        this.planetTerrainEl = document.getElementById('planet-terrain');
        this.creatureCountEl = document.getElementById('creature-count');
        this.musicToggle = document.getElementById('music-toggle');
        
        // Modals
        this.creatureModal = document.getElementById('creature-modal');
        this.addModal = document.getElementById('add-modal');
        this.lifeModal = document.getElementById('life-modal');
        this.weatherModal = document.getElementById('weather-modal');
    }
    
    setupEventListeners() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.history.back();
        });
        
        // Time of day
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTimeOfDay(btn.dataset.time);
            });
        });
        
        // Action buttons
        document.getElementById('add-creature-btn').addEventListener('click', () => this.openAddCreatureModal());
        document.getElementById('add-life-btn').addEventListener('click', () => this.openLifeModal());
        document.getElementById('weather-btn').addEventListener('click', () => this.openWeatherModal());
        
        // Modal closes
        document.getElementById('add-modal-close').addEventListener('click', () => this.closeModal(this.addModal));
        document.getElementById('life-modal-close').addEventListener('click', () => this.closeModal(this.lifeModal));
        document.getElementById('weather-modal-close').addEventListener('click', () => this.closeModal(this.weatherModal));
        document.getElementById('close-creature-modal').addEventListener('click', () => this.closeModal(this.creatureModal));
        
        // Life buttons
        document.querySelectorAll('.life-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addLifeform(btn.dataset.life));
        });
        
        // Weather buttons
        document.querySelectorAll('.weather-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setWeather(btn.dataset.weather);
            });
        });
        
        // Music toggle
        this.musicToggle.addEventListener('click', () => this.toggleMusic());
        
        // Creature interactions
        document.getElementById('pet-creature').addEventListener('click', () => this.interactWithCreature('pet'));
        document.getElementById('feed-creature').addEventListener('click', () => this.interactWithCreature('feed'));
        document.getElementById('play-creature').addEventListener('click', () => this.interactWithCreature('play'));
        
        // Touch effects on ground
        this.ground.addEventListener('click', (e) => this.createTouchRipple(e));
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.setupStars();
        });
    }
    
    setupStars() {
        const canvas = this.starsCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.6;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw stars
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = Math.random() * 1.5;
            const alpha = 0.3 + Math.random() * 0.7;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();
        }
    }
    
    applyPlanetTheme() {
        const terrain = this.planet.terrain || 'earth';
        
        // Apply terrain class to sky and ground
        this.sky.classList.add(`terrain-${terrain}`);
        this.ground.classList.add(`terrain-${terrain}`);
        
        // Apply suns
        if (this.planet.suns) {
            this.sun1.classList.toggle('hidden', !this.planet.suns.primary);
            this.sun2.classList.toggle('hidden', !this.planet.suns.secondary);
        }
        
        // Aurora for ice/crystal worlds
        if (terrain === 'ice' || terrain === 'crystal') {
            this.aurora.classList.remove('hidden');
        }
    }
    
    generateLandscape() {
        const terrain = this.planet.terrain || 'earth';
        
        // Generate mountains
        const mountainColors = {
            earth: '#4b5563',
            ocean: '#1e40af',
            desert: '#92400e',
            ice: '#bfdbfe',
            volcanic: '#991b1b',
            crystal: '#7c3aed'
        };
        
        for (let i = 0; i < 5; i++) {
            const mountain = document.createElement('div');
            mountain.className = 'mountain';
            mountain.style.width = `${100 + Math.random() * 150}px`;
            mountain.style.height = `${60 + Math.random() * 80}px`;
            mountain.style.left = `${i * 20 + Math.random() * 10}%`;
            mountain.style.background = mountainColors[terrain] || mountainColors.earth;
            mountain.style.opacity = 0.3 + Math.random() * 0.3;
            this.distantLayer.appendChild(mountain);
        }
        
        // Generate hills
        for (let i = 0; i < 4; i++) {
            const hill = document.createElement('div');
            hill.className = 'hill';
            hill.style.width = `${150 + Math.random() * 100}px`;
            hill.style.height = `${50 + Math.random() * 50}px`;
            hill.style.left = `${i * 25 + Math.random() * 5}%`;
            hill.style.background = this.darkenColor(this.planet.color || '#4ade80', 20);
            hill.style.opacity = 0.5 + Math.random() * 0.3;
            this.midLayer.appendChild(hill);
        }
    }
    
    generateClouds() {
        for (let i = 0; i < 6; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            cloud.style.width = `${80 + Math.random() * 120}px`;
            cloud.style.height = `${30 + Math.random() * 30}px`;
            cloud.style.top = `${10 + Math.random() * 30}%`;
            cloud.style.left = `${Math.random() * 100}%`;
            cloud.style.animationDuration = `${30 + Math.random() * 40}s`;
            cloud.style.animationDelay = `${-Math.random() * 30}s`;
            this.clouds.appendChild(cloud);
        }
    }
    
    loadCreatures() {
        this.creaturesLayer.innerHTML = '';
        
        this.creatures.forEach((creature, index) => {
            this.spawnCreature(creature, index);
        });
        
        this.updateCreatureCount();
    }
    
    spawnCreature(creature, index = 0) {
        const creatureEl = document.createElement('div');
        creatureEl.className = 'surface-creature';
        creatureEl.dataset.index = index;
        
        // Random vertical position
        creatureEl.style.bottom = `${5 + Math.random() * 20}%`;
        
        // Random starting position
        creatureEl.style.left = `${Math.random() * 80}%`;
        
        // Random animation duration and delay
        const duration = 15 + Math.random() * 20;
        creatureEl.style.animationDuration = `${duration}s`;
        creatureEl.style.animationDelay = `${-Math.random() * duration}s`;
        
        // Direction
        if (Math.random() > 0.5) {
            creatureEl.style.animationDirection = 'reverse';
        }
        
        creatureEl.innerHTML = `
            <div class="creature-body" style="background-color: ${creature.color || '#64FFDA'}; box-shadow: 0 5px 20px ${creature.color || '#64FFDA'}40;">
                <div class="creature-eyes">
                    <div class="creature-eye"></div>
                    <div class="creature-eye"></div>
                </div>
                <div class="creature-mouth"></div>
            </div>
            <div class="creature-name-tag">${creature.name}</div>
        `;
        
        creatureEl.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openCreatureModal(creature, creatureEl);
        });
        
        this.creaturesLayer.appendChild(creatureEl);
    }
    
    loadLifeforms() {
        // Load saved lifeforms for this planet
        const savedLife = JSON.parse(localStorage.getItem(`planet-life-${this.planet.name}`) || '[]');
        savedLife.forEach(life => this.renderLifeform(life));
    }
    
    addLifeform(type) {
        const lifeforms = {
            tree: ['🌳', '🌲', '🌴', '🎋'],
            flower: ['🌸', '🌺', '🌷', '💐', '🌻'],
            mushroom: ['🍄', '🍄‍🟫'],
            crystal: ['💎', '🔮', '💠'],
            rock: ['🪨', '🗿'],
            grass: ['🌿', '🌱', '☘️']
        };
        
        const emojis = lifeforms[type] || ['🌿'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const lifeform = {
            type,
            emoji,
            x: 10 + Math.random() * 80,
            scale: 0.8 + Math.random() * 0.5,
            delay: Math.random() * 2
        };
        
        this.renderLifeform(lifeform);
        
        // Save to localStorage
        const savedLife = JSON.parse(localStorage.getItem(`planet-life-${this.planet.name}`) || '[]');
        savedLife.push(lifeform);
        localStorage.setItem(`planet-life-${this.planet.name}`, JSON.stringify(savedLife));
        
        // Haptic feedback
        this.vibrate([30]);
    }
    
    renderLifeform(lifeform) {
        const el = document.createElement('div');
        el.className = 'life-item';
        el.textContent = lifeform.emoji;
        el.style.left = `${lifeform.x}%`;
        el.style.transform = `scale(${lifeform.scale})`;
        el.style.animationDelay = `${lifeform.delay}s`;
        el.style.fontSize = `${1.5 + lifeform.scale}rem`;
        this.lifeLayer.appendChild(el);
    }
    
    setTimeOfDay(time) {
        this.timeOfDay = time;
        
        // Remove old time classes
        this.sky.classList.remove('dawn', 'day', 'dusk', 'night');
        this.sky.classList.add(time);
        
        // Adjust stars visibility
        const starsOpacity = (time === 'night') ? 1 : (time === 'dusk') ? 0.5 : 0;
        this.starsCanvas.style.opacity = starsOpacity;
        
        // Play transition sound
        this.playTimeSound();
    }
    
    setWeather(weather) {
        this.weather = weather;
        const ctx = this.weatherCanvas.getContext('2d');
        this.weatherCanvas.width = window.innerWidth;
        this.weatherCanvas.height = window.innerHeight;
        
        // Clear previous
        ctx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);
        
        // Remove fog overlay if exists
        const fogOverlay = document.querySelector('.weather-fog');
        if (fogOverlay) fogOverlay.remove();
        
        if (weather === 'fog') {
            const fog = document.createElement('div');
            fog.className = 'weather-fog';
            this.weatherLayer.appendChild(fog);
        } else if (weather === 'rain' || weather === 'storm') {
            this.startRain(weather === 'storm');
        } else if (weather === 'snow') {
            this.startSnow();
        }
        
        // Adjust cloud density
        const cloudOpacity = (weather === 'cloudy' || weather === 'storm') ? 0.9 :
                           (weather === 'rain') ? 0.7 : 0.5;
        this.clouds.style.opacity = cloudOpacity;
    }
    
    startRain(isStorm = false) {
        const ctx = this.weatherCanvas.getContext('2d');
        const drops = [];
        const dropCount = isStorm ? 200 : 100;
        
        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * this.weatherCanvas.width,
                y: Math.random() * this.weatherCanvas.height,
                speed: 10 + Math.random() * 10,
                length: 10 + Math.random() * 20
            });
        }
        
        const animate = () => {
            if (this.weather !== 'rain' && this.weather !== 'storm') return;
            
            ctx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            
            drops.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x + 2, drop.y + drop.length);
                ctx.stroke();
                
                drop.y += drop.speed;
                if (drop.y > this.weatherCanvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * this.weatherCanvas.width;
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    startSnow() {
        const ctx = this.weatherCanvas.getContext('2d');
        const flakes = [];
        
        for (let i = 0; i < 80; i++) {
            flakes.push({
                x: Math.random() * this.weatherCanvas.width,
                y: Math.random() * this.weatherCanvas.height,
                size: 2 + Math.random() * 4,
                speed: 1 + Math.random() * 2,
                wobble: Math.random() * Math.PI * 2
            });
        }
        
        const animate = () => {
            if (this.weather !== 'snow') return;
            
            ctx.clearRect(0, 0, this.weatherCanvas.width, this.weatherCanvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            flakes.forEach(flake => {
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
                ctx.fill();
                
                flake.y += flake.speed;
                flake.x += Math.sin(flake.wobble) * 0.5;
                flake.wobble += 0.02;
                
                if (flake.y > this.weatherCanvas.height) {
                    flake.y = -flake.size;
                    flake.x = Math.random() * this.weatherCanvas.width;
                }
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    openAddCreatureModal() {
        const savedCreatures = JSON.parse(localStorage.getItem('pneuoma-creatures') || '[]');
        const container = document.getElementById('saved-creatures');
        
        if (savedCreatures.length === 0) {
            container.innerHTML = '<div class="empty-state">No creatures yet! Create some in Creature Lab.</div>';
        } else {
            container.innerHTML = savedCreatures.map(creature => `
                <div class="saved-item" data-name="${creature.name}">
                    <div class="saved-item-preview" style="background-color: ${creature.color}"></div>
                    <span class="saved-item-name">${creature.name}</span>
                </div>
            `).join('');
            
            container.querySelectorAll('.saved-item').forEach(item => {
                item.addEventListener('click', () => {
                    const name = item.dataset.name;
                    const creature = savedCreatures.find(c => c.name === name);
                    if (creature) {
                        this.addCreatureToPlanet(creature);
                        this.closeModal(this.addModal);
                    }
                });
            });
        }
        
        this.addModal.classList.remove('hidden');
    }
    
    addCreatureToPlanet(creature) {
        // Add to local creatures array
        this.creatures.push(creature);
        
        // Spawn on surface
        this.spawnCreature(creature, this.creatures.length - 1);
        
        // Save to localStorage
        const planetCreatures = this.creatures.map(c => c.name);
        localStorage.setItem(`planet-creatures-${this.planet.name}`, JSON.stringify(planetCreatures));
        
        this.updateCreatureCount();
        this.vibrate([50, 30, 50]);
    }
    
    openCreatureModal(creature, element) {
        this.selectedCreature = { creature, element };
        
        document.getElementById('creature-modal-name').textContent = creature.name;
        
        const display = document.getElementById('creature-display');
        display.style.backgroundColor = creature.color;
        display.style.boxShadow = `0 0 30px ${creature.color}60`;
        
        const traits = document.getElementById('creature-traits');
        if (creature.traits && creature.traits.length > 0) {
            traits.innerHTML = creature.traits.map(t => 
                `<span class="creature-trait">${t}</span>`
            ).join('');
        } else {
            traits.innerHTML = '<span class="creature-trait">Friendly</span>';
        }
        
        // Pause creature animation
        element.style.animationPlayState = 'paused';
        
        this.creatureModal.classList.remove('hidden');
    }
    
    interactWithCreature(action) {
        if (!this.selectedCreature) return;
        
        const { element } = this.selectedCreature;
        
        // Add bounce animation
        element.classList.add('creature-bounce');
        setTimeout(() => element.classList.remove('creature-bounce'), 500);
        
        // Haptic feedback based on action
        switch(action) {
            case 'pet':
                this.vibrate([30, 50, 30, 50, 30]);
                break;
            case 'feed':
                this.vibrate([100]);
                break;
            case 'play':
                this.vibrate([50, 30, 50, 30, 50, 30, 50]);
                break;
        }
        
        // Close modal after interaction
        setTimeout(() => {
            this.closeModal(this.creatureModal);
            element.style.animationPlayState = 'running';
            this.selectedCreature = null;
        }, 500);
    }
    
    openLifeModal() {
        this.lifeModal.classList.remove('hidden');
    }
    
    openWeatherModal() {
        this.weatherModal.classList.remove('hidden');
    }
    
    closeModal(modal) {
        modal.classList.add('hidden');
    }
    
    createTouchRipple(e) {
        const rect = this.ground.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        
        this.touchRipple.style.left = `${x}px`;
        this.touchRipple.style.top = `${y}px`;
        this.touchRipple.classList.remove('hidden');
        this.touchRipple.classList.add('active');
        
        this.vibrate([20]);
        
        setTimeout(() => {
            this.touchRipple.classList.remove('active');
            this.touchRipple.classList.add('hidden');
        }, 600);
    }
    
    updateCreatureCount() {
        this.creatureCountEl.textContent = this.creatures.length;
    }
    
    updateUI() {
        this.planetNameEl.textContent = this.planet.name;
        this.planetTerrainEl.textContent = this.getTerrainLabel(this.planet.terrain);
        this.updateCreatureCount();
    }
    
    getTerrainLabel(terrain) {
        const labels = {
            earth: 'Earth-like',
            ocean: 'Ocean World',
            desert: 'Desert Planet',
            ice: 'Frozen World',
            volcanic: 'Volcanic Planet',
            crystal: 'Crystal World'
        };
        return labels[terrain] || 'Unknown Terrain';
    }
    
    // Audio
    setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.value = 0.3;
        this.ambientGain.connect(this.audioContext.destination);
    }
    
    startAmbientLoop() {
        // Create ambient sounds based on terrain
        const createAmbientSound = () => {
            if (!this.audioContext || !this.isMusicPlaying) return;
            
            // Base drone
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50 + Math.random() * 30, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 8);
            
            osc.connect(gain).connect(this.ambientGain);
            osc.start();
            osc.stop(this.audioContext.currentTime + 8);
            
            // Wind/atmosphere
            if (Math.random() > 0.5) {
                const wind = this.audioContext.createOscillator();
                const windGain = this.audioContext.createGain();
                wind.type = 'sawtooth';
                wind.frequency.setValueAtTime(100 + Math.random() * 50, this.audioContext.currentTime);
                windGain.gain.setValueAtTime(0.01, this.audioContext.currentTime);
                windGain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 3);
                wind.connect(windGain).connect(this.ambientGain);
                wind.start();
                wind.stop(this.audioContext.currentTime + 3);
            }
            
            // Nature sounds (birds, insects) for earth-like
            if (this.planet.terrain === 'earth' && Math.random() > 0.6) {
                const bird = this.audioContext.createOscillator();
                const birdGain = this.audioContext.createGain();
                bird.type = 'sine';
                bird.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime);
                bird.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);
                birdGain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
                birdGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                bird.connect(birdGain).connect(this.ambientGain);
                bird.start();
                bird.stop(this.audioContext.currentTime + 0.3);
            }
        };
        
        setInterval(createAmbientSound, 4000);
    }
    
    playTimeSound() {
        if (!this.audioContext || !this.isMusicPlaying) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
        
        osc.connect(gain).connect(this.ambientGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }
    
    toggleMusic() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isMusicPlaying = !this.isMusicPlaying;
        this.ambientGain.gain.value = this.isMusicPlaying ? 0.3 : 0;
        this.musicToggle.textContent = this.isMusicPlaying ? '🔊' : '🔇';
    }
    
    // Utility
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.planetSurface = new PlanetSurface();
});

