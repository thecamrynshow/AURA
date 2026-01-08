/**
 * Universe - PNEUOMA Create
 * Host universes, invite friends, add planets & creatures
 */

class UniverseApp {
    constructor() {
        this.currentUniverse = null;
        this.universes = [];
        this.selectedPlanet = null;
        
        // Audio
        this.audioContext = null;
        this.musicPlaying = false;
        this.musicNodes = [];
        
        // Sun colors
        this.sunColors = {
            yellow: { main: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)' },
            orange: { main: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
            red: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' },
            blue: { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
            white: { main: '#ffffff', glow: 'rgba(255, 255, 255, 0.4)' },
            purple: { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' }
        };
        
        // Terrain colors for planets
        this.terrainColors = {
            earth: '#34d399',
            ocean: '#3b82f6',
            desert: '#f59e0b',
            ice: '#7dd3fc',
            volcanic: '#ef4444',
            crystal: '#c084fc'
        };
        
        this.init();
    }
    
    init() {
        this.loadUniverses();
        this.setupStars();
        this.setupEventListeners();
        this.renderUniverseList();
    }
    
    // ==================== DATA ====================
    
    loadUniverses() {
        this.universes = JSON.parse(localStorage.getItem('pneuoma-universes') || '[]');
    }
    
    saveUniverses() {
        localStorage.setItem('pneuoma-universes', JSON.stringify(this.universes));
    }
    
    generateCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        code += '-';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    
    // ==================== AUDIO ====================
    
    initAudio() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.2;
        this.masterGain.connect(this.audioContext.destination);
    }
    
    startMusic() {
        if (!this.audioContext) this.initAudio();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.musicPlaying = true;
        document.getElementById('music-toggle').textContent = '🔊';
        document.getElementById('music-toggle').classList.add('playing');
        
        // Deep space ambient
        this.createSpaceAmbient();
    }
    
    createSpaceAmbient() {
        // Deep drone
        [55, 82.5, 110].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 300;
            
            gain.gain.value = 0.08 - (i * 0.02);
            
            // Slow modulation
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 0.03 + (i * 0.01);
            lfoGain.gain.value = freq * 0.03;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            
            this.musicNodes.push({ osc, gain, lfo });
        });
        
        // Celestial pad
        this.celestialInterval = setInterval(() => {
            if (this.musicPlaying) this.playCelestialTone();
        }, 4000 + Math.random() * 6000);
    }
    
    playCelestialTone() {
        const notes = [196, 220, 262, 294, 330, 392];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 4);
    }
    
    stopMusic() {
        this.musicPlaying = false;
        document.getElementById('music-toggle').textContent = '🔇';
        document.getElementById('music-toggle').classList.remove('playing');
        
        if (this.celestialInterval) clearInterval(this.celestialInterval);
        
        this.musicNodes.forEach(node => {
            if (node.gain) {
                node.gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            }
            setTimeout(() => {
                if (node.osc) node.osc.stop();
                if (node.lfo) node.lfo.stop();
            }, 600);
        });
        
        this.musicNodes = [];
    }
    
    toggleMusic() {
        if (this.musicPlaying) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        this.vibrate([15]);
    }
    
    // ==================== STARS ====================
    
    setupStars() {
        const canvas = document.getElementById('stars-canvas');
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);
        
        const stars = [];
        for (let i = 0; i < 300; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5,
                alpha: Math.random(),
                twinkleSpeed: 0.003 + Math.random() * 0.008
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            stars.forEach(star => {
                star.alpha += star.twinkleSpeed;
                if (star.alpha > 1 || star.alpha < 0.2) {
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
    
    // ==================== EVENT LISTENERS ====================
    
    setupEventListeners() {
        // Create Universe
        document.getElementById('create-universe-btn').addEventListener('click', () => {
            document.getElementById('create-modal').classList.add('active');
        });
        
        document.getElementById('create-cancel').addEventListener('click', () => {
            document.getElementById('create-modal').classList.remove('active');
        });
        
        document.getElementById('create-confirm').addEventListener('click', () => {
            this.createUniverse();
        });
        
        // Sun type selection
        document.querySelectorAll('.sun-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sun-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Join Universe
        document.getElementById('join-universe-btn').addEventListener('click', () => {
            document.getElementById('join-modal').classList.add('active');
        });
        
        document.getElementById('join-cancel').addEventListener('click', () => {
            document.getElementById('join-modal').classList.remove('active');
        });
        
        document.getElementById('join-confirm').addEventListener('click', () => {
            this.joinUniverse();
        });
        
        // Format join code as user types
        document.getElementById('join-code').addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (value.length > 4) {
                value = value.slice(0, 4) + '-' + value.slice(4, 8);
            }
            e.target.value = value;
        });
        
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showStartScreen();
        });
        
        // Music toggle
        document.getElementById('music-toggle').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        // Copy code
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyCode();
        });
        
        // Add Planet
        document.getElementById('add-planet-btn').addEventListener('click', () => {
            this.showAddPlanetModal();
        });
        
        document.getElementById('add-planet-cancel').addEventListener('click', () => {
            document.getElementById('add-planet-modal').classList.remove('active');
        });
        
        // Invite
        document.getElementById('invite-btn').addEventListener('click', () => {
            this.showInviteModal();
        });
        
        document.getElementById('invite-close').addEventListener('click', () => {
            document.getElementById('invite-modal').classList.remove('active');
        });
        
        document.getElementById('copy-invite').addEventListener('click', () => {
            this.copyCode();
            document.getElementById('invite-modal').classList.remove('active');
        });
        
        document.getElementById('share-invite').addEventListener('click', () => {
            this.shareUniverse();
        });
        
        // View Creatures
        document.getElementById('view-creatures-btn').addEventListener('click', () => {
            this.showAddCreatureModal();
        });
        
        // Planet info panel
        document.getElementById('close-planet-info').addEventListener('click', () => {
            this.closePlanetInfo();
        });
        
        document.getElementById('visit-planet-btn').addEventListener('click', () => {
            if (this.selectedPlanet) {
                window.location.href = '../world-builder/index.html';
            }
        });
        
        document.getElementById('add-creature-btn').addEventListener('click', () => {
            this.showAddCreatureModal();
        });
        
        document.getElementById('add-creature-cancel').addEventListener('click', () => {
            document.getElementById('add-creature-modal').classList.remove('active');
        });
    }
    
    // ==================== UNIVERSE MANAGEMENT ====================
    
    createUniverse() {
        const nameInput = document.getElementById('new-universe-name');
        const name = nameInput.value.trim() || 'My Universe';
        const sunType = document.querySelector('.sun-btn.active').dataset.sun;
        
        const universe = {
            id: Date.now().toString(),
            name: name,
            code: this.generateCode(),
            sunType: sunType,
            planets: [],
            members: [{ name: 'You', isHost: true, planets: 0 }],
            createdAt: new Date().toISOString()
        };
        
        this.universes.push(universe);
        this.saveUniverses();
        
        document.getElementById('create-modal').classList.remove('active');
        nameInput.value = '';
        
        this.openUniverse(universe);
        this.vibrate([30, 50, 30]);
    }
    
    joinUniverse() {
        const code = document.getElementById('join-code').value.toUpperCase();
        
        // Check if code matches any existing universe
        const universe = this.universes.find(u => u.code === code);
        
        if (universe) {
            document.getElementById('join-modal').classList.remove('active');
            this.openUniverse(universe);
            this.showToast('Joined universe!');
        } else {
            // In a real app, this would check a server
            // For now, create a placeholder joined universe
            const joinedUniverse = {
                id: Date.now().toString(),
                name: 'Joined Universe',
                code: code,
                sunType: 'yellow',
                planets: [],
                members: [
                    { name: 'Host', isHost: true, planets: 0 },
                    { name: 'You', isHost: false, planets: 0 }
                ],
                isJoined: true,
                createdAt: new Date().toISOString()
            };
            
            this.universes.push(joinedUniverse);
            this.saveUniverses();
            
            document.getElementById('join-modal').classList.remove('active');
            document.getElementById('join-code').value = '';
            
            this.openUniverse(joinedUniverse);
            this.showToast('Joined universe!');
        }
        
        this.vibrate([30, 30]);
    }
    
    openUniverse(universe) {
        this.currentUniverse = universe;
        
        // Update UI
        document.getElementById('universe-name').textContent = universe.name;
        document.getElementById('universe-code').textContent = universe.code;
        document.getElementById('invite-code-large').textContent = universe.code;
        
        // Set sun color
        const sunColors = this.sunColors[universe.sunType];
        document.documentElement.style.setProperty('--sun-color', sunColors.main);
        document.documentElement.style.setProperty('--sun-glow', sunColors.glow);
        
        // Render planets
        this.renderPlanets();
        
        // Render members
        this.renderMembers();
        
        // Show universe screen
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('universe-screen').classList.add('active');
    }
    
    showStartScreen() {
        document.getElementById('universe-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
        this.currentUniverse = null;
        this.renderUniverseList();
        
        if (this.musicPlaying) {
            this.stopMusic();
        }
    }
    
    renderUniverseList() {
        const list = document.getElementById('universe-list');
        
        if (this.universes.length === 0) {
            list.innerHTML = '<p class="empty-state">No universes yet. Create one to get started!</p>';
            return;
        }
        
        list.innerHTML = this.universes.map(u => `
            <div class="universe-item" data-id="${u.id}">
                <div class="universe-item-info">
                    <div class="universe-item-icon ${u.sunType}">☀️</div>
                    <div>
                        <div class="universe-item-name">${u.name}</div>
                        <div class="universe-item-planets">${u.planets.length} planets</div>
                    </div>
                </div>
                <span class="universe-item-arrow">→</span>
            </div>
        `).join('');
        
        // Add click handlers
        list.querySelectorAll('.universe-item').forEach(item => {
            item.addEventListener('click', () => {
                const universe = this.universes.find(u => u.id === item.dataset.id);
                if (universe) this.openUniverse(universe);
            });
        });
    }
    
    // ==================== PLANETS ====================
    
    showAddPlanetModal() {
        const savedPlanets = JSON.parse(localStorage.getItem('pneuoma-worlds') || '[]');
        const container = document.getElementById('saved-planets');
        
        if (savedPlanets.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved planets. Create one first!</p>';
        } else {
            container.innerHTML = savedPlanets.map((planet, index) => `
                <div class="saved-item" data-index="${index}">
                    <div class="saved-item-preview terrain-${planet.terrain}"></div>
                    <div class="saved-item-name">${planet.name}</div>
                </div>
            `).join('');
            
            container.querySelectorAll('.saved-item').forEach(item => {
                item.addEventListener('click', () => {
                    const planet = savedPlanets[parseInt(item.dataset.index)];
                    this.addPlanetToUniverse(planet);
                    document.getElementById('add-planet-modal').classList.remove('active');
                });
            });
        }
        
        document.getElementById('add-planet-modal').classList.add('active');
    }
    
    addPlanetToUniverse(planetData) {
        if (!this.currentUniverse) return;
        
        // Assign orbital slot
        const orbitIndex = this.currentUniverse.planets.length;
        const orbitalDistance = 60 + (orbitIndex * 40); // Starting at 60px, increasing by 40px each
        
        const planet = {
            ...planetData,
            id: Date.now().toString(),
            orbitIndex: orbitIndex,
            orbitalDistance: orbitalDistance,
            orbitSpeed: 15 + (orbitIndex * 5), // Slower for outer planets
            orbitOffset: Math.random() * 360, // Random starting position
            creatures: [],
            addedAt: new Date().toISOString()
        };
        
        this.currentUniverse.planets.push(planet);
        this.currentUniverse.members[0].planets++; // Update "You" planet count
        this.saveUniverses();
        
        this.renderPlanets();
        this.showToast(`${planet.name} added to universe!`);
        this.vibrate([30, 30, 30]);
    }
    
    renderPlanets() {
        const container = document.getElementById('planets-container');
        container.innerHTML = '';
        
        if (!this.currentUniverse) return;
        
        this.currentUniverse.planets.forEach((planet, index) => {
            const planetEl = document.createElement('div');
            planetEl.className = 'orbiting-planet';
            planetEl.dataset.id = planet.id;
            
            // Calculate size based on planet size (if available)
            const size = planet.size ? Math.max(20, Math.min(40, planet.size / 5)) : 25;
            
            planetEl.innerHTML = `
                <div class="planet-body terrain-${planet.terrain}" style="width: ${size}px; height: ${size}px;"></div>
                <div class="planet-name-tag">${planet.name}</div>
            `;
            
            // Set orbital animation
            planetEl.style.animation = `planetOrbit${index} ${planet.orbitSpeed}s linear infinite`;
            
            // Create keyframes for this planet
            const keyframes = `
                @keyframes planetOrbit${index} {
                    from {
                        transform: rotate(${planet.orbitOffset}deg) translateX(${planet.orbitalDistance}px) rotate(-${planet.orbitOffset}deg);
                    }
                    to {
                        transform: rotate(${planet.orbitOffset + 360}deg) translateX(${planet.orbitalDistance}px) rotate(-${planet.orbitOffset + 360}deg);
                    }
                }
            `;
            
            // Add keyframes to document
            const styleSheet = document.createElement('style');
            styleSheet.textContent = keyframes;
            document.head.appendChild(styleSheet);
            
            // Click handler
            planetEl.addEventListener('click', () => {
                this.selectPlanet(planet, planetEl);
            });
            
            container.appendChild(planetEl);
        });
    }
    
    selectPlanet(planet, element) {
        // Deselect previous
        document.querySelectorAll('.orbiting-planet').forEach(p => p.classList.remove('selected'));
        
        // Select new
        element.classList.add('selected');
        this.selectedPlanet = planet;
        
        // Update info panel
        document.getElementById('planet-info-name').textContent = planet.name;
        document.getElementById('planet-info-creator').textContent = 'Created by You';
        document.getElementById('planet-info-terrain').textContent = planet.terrain.charAt(0).toUpperCase() + planet.terrain.slice(1);
        document.getElementById('planet-info-life').textContent = planet.lifeforms?.length > 0 ? planet.lifeforms.join(', ') : 'None';
        document.getElementById('planet-info-creatures').textContent = planet.creatures?.length || 0;
        
        // Update preview color
        document.getElementById('planet-info-preview').className = `planet-info-preview terrain-${planet.terrain}`;
        
        // Show panel
        document.getElementById('planet-info-panel').classList.remove('hidden');
        
        this.vibrate([15]);
    }
    
    closePlanetInfo() {
        document.getElementById('planet-info-panel').classList.add('hidden');
        document.querySelectorAll('.orbiting-planet').forEach(p => p.classList.remove('selected'));
        this.selectedPlanet = null;
    }
    
    // ==================== CREATURES ====================
    
    showAddCreatureModal() {
        const savedCreatures = JSON.parse(localStorage.getItem('pneuoma-creatures') || '[]');
        const container = document.getElementById('saved-creatures');
        
        if (savedCreatures.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved creatures. Create one first!</p>';
        } else {
            container.innerHTML = savedCreatures.map((creature, index) => `
                <div class="saved-item" data-index="${index}">
                    <div class="saved-item-preview" style="background: linear-gradient(135deg, ${this.getCreatureColor(creature.color)}, ${this.getCreatureColorDark(creature.color)});">🧬</div>
                    <div class="saved-item-name">${creature.name}</div>
                </div>
            `).join('');
            
            container.querySelectorAll('.saved-item').forEach(item => {
                item.addEventListener('click', () => {
                    const creature = savedCreatures[parseInt(item.dataset.index)];
                    this.addCreatureToPlanet(creature);
                    document.getElementById('add-creature-modal').classList.remove('active');
                });
            });
        }
        
        document.getElementById('add-creature-modal').classList.add('active');
    }
    
    getCreatureColor(color) {
        const colors = {
            pink: '#f472b6', purple: '#a78bfa', blue: '#60a5fa', cyan: '#22d3ee',
            green: '#4ade80', yellow: '#facc15', orange: '#fb923c', red: '#f87171'
        };
        return colors[color] || '#f472b6';
    }
    
    getCreatureColorDark(color) {
        const colors = {
            pink: '#db2777', purple: '#7c3aed', blue: '#2563eb', cyan: '#0891b2',
            green: '#16a34a', yellow: '#ca8a04', orange: '#ea580c', red: '#dc2626'
        };
        return colors[color] || '#db2777';
    }
    
    addCreatureToPlanet(creature) {
        if (!this.selectedPlanet) {
            this.showToast('Select a planet first!');
            return;
        }
        
        if (!this.selectedPlanet.creatures) {
            this.selectedPlanet.creatures = [];
        }
        
        this.selectedPlanet.creatures.push({
            ...creature,
            addedAt: new Date().toISOString()
        });
        
        this.saveUniverses();
        
        // Update panel
        document.getElementById('planet-info-creatures').textContent = this.selectedPlanet.creatures.length;
        
        this.showToast(`${creature.name} added to ${this.selectedPlanet.name}!`);
        this.vibrate([20, 20]);
    }
    
    // ==================== MEMBERS ====================
    
    renderMembers() {
        const list = document.getElementById('members-list');
        
        if (!this.currentUniverse) return;
        
        list.innerHTML = this.currentUniverse.members.map(member => `
            <div class="member-item">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-planets">${member.planets} planets</div>
                </div>
                ${member.isHost ? '<span class="member-host">Host</span>' : ''}
            </div>
        `).join('');
    }
    
    // ==================== INVITE ====================
    
    showInviteModal() {
        document.getElementById('invite-modal').classList.add('active');
    }
    
    copyCode() {
        if (!this.currentUniverse) return;
        
        navigator.clipboard.writeText(this.currentUniverse.code);
        this.showToast('Code copied!');
        this.vibrate([15]);
    }
    
    shareUniverse() {
        if (!this.currentUniverse) return;
        
        const text = `Join my universe "${this.currentUniverse.name}" in PNEUOMA! 🌌\nCode: ${this.currentUniverse.code}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Join my PNEUOMA Universe',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text);
            this.showToast('Invite copied!');
        }
        
        this.vibrate([20, 20]);
    }
    
    // ==================== UTILITIES ====================
    
    showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-message').textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.universeApp = new UniverseApp();
});

