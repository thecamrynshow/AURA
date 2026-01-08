/**
 * ALIGN - The Game of Life
 * A PNEUMA Experience
 * 
 * "Become who you really are — and remain that person."
 */

class AlignGame {
    constructor() {
        // Game State
        this.state = {
            energy: 75,
            alignment: 0.7,
            creatures: [],
            questActive: false,
            questCompleted: false,
            currentScreen: 'start'
        };
        
        // Creatures data
        this.allCreatures = [
            { id: 'owl', emoji: '🦉', name: 'OWL of Clarity', trait: 'Seeing Truth', wisdom: '"The truth is simple. We make it complex."', unlockMethod: 'Speaking your truth' },
            { id: 'fox', emoji: '🦊', name: 'KOAN the Fox', trait: 'Letting Go', wisdom: '"What you grip, grips you back."', unlockMethod: 'Releasing an attachment' },
            { id: 'turtle', emoji: '🐢', name: 'TEMPO', trait: 'Patience', wisdom: '"Slow is smooth. Smooth is fast."', unlockMethod: 'Waiting without anxiety' },
            { id: 'butterfly', emoji: '🦋', name: 'SHIFT', trait: 'Transformation', wisdom: '"You are not stuck. You are becoming."', unlockMethod: 'Completing an upgrade' },
            { id: 'bloom', emoji: '🌸', name: 'BLOOM', trait: 'Growth', wisdom: '"Grow where you are planted."', unlockMethod: '7 days of energy gains' },
            { id: 'ember', emoji: '🔥', name: 'EMBER', trait: 'Inner Fire', wisdom: '"Your spark cannot be extinguished."', unlockMethod: 'Standing in your truth' },
            { id: 'flow', emoji: '🌊', name: 'FLOW', trait: 'Ease', wisdom: '"Water never fights. It finds a way."', unlockMethod: 'Winning a boss battle' },
            { id: 'north', emoji: '⭐', name: 'NORTH', trait: 'Direction', wisdom: '"Know your values. The path reveals itself."', unlockMethod: 'Defining your values' }
        ];
        
        // Audio context for haptics
        this.audioContext = null;
        this.canVibrate = 'vibrate' in navigator;
        
        // Canvas contexts
        this.particleCanvas = document.getElementById('particle-canvas');
        this.particleCtx = this.particleCanvas.getContext('2d');
        this.worldCanvas = document.getElementById('world-canvas');
        this.worldCtx = this.worldCanvas?.getContext('2d');
        
        // Particles
        this.particles = [];
        this.worldElements = [];
        
        // Orb state
        this.orbTouched = false;
        this.orbScale = 1;
        this.breathPhase = 0;
        
        // Animation
        this.lastTime = 0;
        this.animationId = null;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        this.init();
    }
    
    init() {
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
        
        this.setupEventListeners();
        this.initParticles();
        this.loadGameState();
        this.updateUI();
        
        // Start animation loop
        requestAnimationFrame(this.animate);
        
        console.log('🎮 ALIGN initialized');
    }
    
    handleResize() {
        const dpr = window.devicePixelRatio || 1;
        
        // Particle canvas
        this.particleCanvas.width = window.innerWidth * dpr;
        this.particleCanvas.height = window.innerHeight * dpr;
        this.particleCanvas.style.width = window.innerWidth + 'px';
        this.particleCanvas.style.height = window.innerHeight + 'px';
        this.particleCtx.scale(dpr, dpr);
        
        // World canvas
        if (this.worldCanvas) {
            this.worldCanvas.width = window.innerWidth * dpr;
            this.worldCanvas.height = window.innerHeight * dpr;
            this.worldCanvas.style.width = window.innerWidth + 'px';
            this.worldCanvas.style.height = window.innerHeight + 'px';
            this.worldCtx.scale(dpr, dpr);
        }
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('begin-btn')?.addEventListener('click', () => {
            this.initAudio();
            this.vibrate([30, 50, 30]);
            this.showScreen('world');
        });
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.dataset.screen;
                this.showScreen(screen);
                this.vibrate([15]);
                
                // Update nav active state
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showScreen(btn.dataset.back);
                this.vibrate([10]);
            });
        });
        
        // Alignment Orb
        const orb = document.getElementById('alignment-orb');
        if (orb) {
            orb.addEventListener('touchstart', (e) => this.onOrbTouch(e));
            orb.addEventListener('touchend', () => this.onOrbRelease());
            orb.addEventListener('mousedown', (e) => this.onOrbTouch(e));
            orb.addEventListener('mouseup', () => this.onOrbRelease());
        }
        
        // Quest buttons
        document.getElementById('accept-quest')?.addEventListener('click', () => this.acceptQuest());
        document.getElementById('easier-quest')?.addEventListener('click', () => this.getEasierQuest());
        document.getElementById('claim-rewards')?.addEventListener('click', () => this.claimRewards());
        
        // Release chamber
        document.querySelectorAll('.release-option').forEach(btn => {
            btn.addEventListener('click', () => this.selectReleaseType(btn.dataset.type));
        });
        document.getElementById('release-btn')?.addEventListener('click', () => this.performRelease());
        
        // Creature modal
        document.getElementById('creature-dismiss')?.addEventListener('click', () => this.closeCreatureModal());
        
        // Victory
        document.getElementById('victory-continue')?.addEventListener('click', () => {
            this.showScreen('world');
            // Reset nav
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.nav-btn[data-screen="world"]')?.classList.add('active');
        });
        
        // Boss battle trigger
        document.getElementById('battle-nav-btn')?.addEventListener('click', () => {
            if (this.state.energy >= 20) {
                this.startBossBattle();
                this.vibrate([30, 20, 50]);
            } else {
                alert('You need at least 20 energy to face a boss. Touch the orb to restore energy!');
                this.vibrate([50, 50, 50]);
            }
        });
        
        // Double tap orb also triggers battle
        document.getElementById('alignment-orb')?.addEventListener('dblclick', () => {
            if (this.state.energy >= 20) {
                this.startBossBattle();
            }
        });
        
        // Touch effects on start screen
        document.getElementById('start-screen')?.addEventListener('touchstart', (e) => {
            this.createTouchRipple(e.touches[0].clientX, e.touches[0].clientY);
            this.vibrate([10]);
        });
    }
    
    // ==================== AUDIO & HAPTICS ====================
    
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    vibrate(pattern) {
        // Native vibration
        if (this.canVibrate) {
            navigator.vibrate(pattern);
        }
        
        // Audio-based haptic (for iOS)
        this.playHapticSound(pattern);
    }
    
    playHapticSound(pattern) {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        const duration = Array.isArray(pattern) 
            ? pattern.reduce((a, b) => a + b, 0) / 1000 
            : pattern / 1000;
        
        const releaseDuration = Math.max(0.3, duration * 2);
        const now = this.audioContext.currentTime;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + releaseDuration);
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.setValueAtTime(0.25, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + releaseDuration);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + releaseDuration + 0.1);
    }
    
    // ==================== SCREENS ====================
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`)?.classList.add('active');
        this.state.currentScreen = screenName;
        
        // Screen-specific setup
        if (screenName === 'creatures') {
            this.renderCreaturesGrid();
        }
    }
    
    // ==================== ORB INTERACTIONS ====================
    
    onOrbTouch(e) {
        e.preventDefault();
        this.initAudio();
        this.orbTouched = true;
        
        const orb = document.getElementById('alignment-orb');
        orb.querySelector('.orb-body').style.transform = 'translate(-50%, -50%) scale(0.92)';
        
        // Strong haptic feedback
        this.vibrate([50, 30, 50]);
        
        // Add energy on touch
        this.addEnergy(2);
        
        // Particle burst
        this.createOrbParticles();
        
        // Flash effect
        orb.classList.add('haptic-flash');
        setTimeout(() => orb.classList.remove('haptic-flash'), 150);
    }
    
    onOrbRelease() {
        this.orbTouched = false;
        
        const orb = document.getElementById('alignment-orb');
        orb.querySelector('.orb-body').style.transform = 'translate(-50%, -50%) scale(1)';
        
        this.vibrate([20, 10]);
    }
    
    createOrbParticles() {
        const orb = document.getElementById('alignment-orb');
        const rect = orb.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * (2 + Math.random() * 2),
                vy: Math.sin(angle) * (2 + Math.random() * 2),
                radius: 3 + Math.random() * 4,
                alpha: 1,
                color: `hsl(${45 + Math.random() * 20}, 100%, 60%)`
            });
        }
    }
    
    // ==================== ENERGY & STATE ====================
    
    addEnergy(amount) {
        this.state.energy = Math.min(100, this.state.energy + amount);
        this.updateUI();
        this.saveGameState();
    }
    
    removeEnergy(amount) {
        this.state.energy = Math.max(0, this.state.energy - amount);
        this.updateUI();
        this.saveGameState();
    }
    
    updateUI() {
        // Energy bar
        const energyFill = document.getElementById('energy-fill');
        const energyText = document.getElementById('energy-text');
        
        if (energyFill) {
            energyFill.style.width = `${this.state.energy}%`;
            
            // Color based on energy level
            if (this.state.energy > 70) {
                energyFill.style.background = 'linear-gradient(90deg, #6bcb77, #4ecdc4)';
            } else if (this.state.energy > 40) {
                energyFill.style.background = 'linear-gradient(90deg, #ffd93d, #6bcb77)';
            } else {
                energyFill.style.background = 'linear-gradient(90deg, #ff6b6b, #ffd93d)';
            }
        }
        
        if (energyText) {
            energyText.textContent = `${Math.round(this.state.energy)}%`;
        }
        
        // Creature count
        const creatureCount = document.getElementById('creature-count');
        if (creatureCount) {
            creatureCount.querySelector('.creature-num').textContent = this.state.creatures.length;
        }
    }
    
    // ==================== QUESTS ====================
    
    acceptQuest() {
        this.state.questActive = true;
        this.vibrate([30, 20, 30, 20, 50]);
        
        // Show confirmation
        const questCard = document.getElementById('quest-card');
        questCard.innerHTML = `
            <div class="quest-active">
                <div class="quest-badge">🗺️ QUEST ACTIVE</div>
                <h3 class="quest-title">The Truth Bridge</h3>
                <p class="quest-description">
                    Your quest is active. When you've spoken your truth,
                    return here to claim your rewards.
                </p>
                <button class="quest-btn" id="complete-quest">I Spoke My Truth</button>
            </div>
        `;
        
        document.getElementById('complete-quest')?.addEventListener('click', () => this.completeQuest());
    }
    
    completeQuest() {
        this.state.questCompleted = true;
        this.vibrate([100, 50, 100, 50, 150]);
        
        // Show completion
        document.getElementById('quest-card').style.display = 'none';
        document.getElementById('quest-complete').style.display = 'block';
        
        // Add energy
        this.addEnergy(25);
        
        // Unlock creature
        this.unlockCreature('owl');
    }
    
    claimRewards() {
        this.showScreen('world');
        
        // Reset quest state
        this.state.questActive = false;
        this.state.questCompleted = false;
    }
    
    getEasierQuest() {
        this.vibrate([15]);
        
        const questCard = document.getElementById('quest-card');
        questCard.querySelector('.quest-badge').textContent = '🧘 STILLNESS QUEST';
        questCard.querySelector('.quest-title').textContent = 'The Quiet Minute';
        questCard.querySelector('.quest-description').textContent = 
            'Find 60 seconds of complete stillness today. No phone, no tasks. Just be.';
        questCard.querySelector('.quest-rewards').innerHTML = `
            <div class="reward">
                <span class="reward-icon">⚡</span>
                <span class="reward-text">+15 Energy</span>
            </div>
        `;
    }
    
    // ==================== RELEASE CHAMBER ====================
    
    selectReleaseType(type) {
        this.vibrate([20]);
        
        document.querySelector('.release-prompt').style.display = 'none';
        document.getElementById('release-input').style.display = 'block';
        
        const placeholders = {
            outcome: "I'm holding onto needing...",
            fear: "I'm afraid that...",
            self: "I'm still holding onto the version of me that...",
            expectation: "I feel pressure to..."
        };
        
        document.getElementById('release-text').placeholder = placeholders[type] || "I'm holding onto...";
    }
    
    performRelease() {
        const text = document.getElementById('release-text').value;
        if (!text.trim()) return;
        
        this.vibrate([30, 50, 30, 50, 100]);
        
        // Hide input, show animation
        document.getElementById('release-input').style.display = 'none';
        document.getElementById('release-animation').style.display = 'block';
        
        // Create butterflies
        this.createButterflies();
        
        // Add energy for releasing
        this.addEnergy(15);
        
        // Possibly unlock fox creature
        if (!this.state.creatures.includes('fox') && Math.random() > 0.5) {
            setTimeout(() => this.unlockCreature('fox'), 2000);
        }
        
        // Reset after animation
        setTimeout(() => {
            document.getElementById('release-animation').style.display = 'none';
            document.querySelector('.release-prompt').style.display = 'block';
            document.getElementById('release-text').value = '';
        }, 4000);
    }
    
    createButterflies() {
        const container = document.getElementById('butterflies');
        container.innerHTML = '';
        
        const butterflies = ['🦋', '🦋', '🦋', '🦋', '🦋'];
        
        butterflies.forEach((emoji, i) => {
            const butterfly = document.createElement('span');
            butterfly.className = 'butterfly';
            butterfly.textContent = emoji;
            butterfly.style.left = `${30 + Math.random() * 40}%`;
            butterfly.style.bottom = '0';
            butterfly.style.setProperty('--fly-x', `${(Math.random() - 0.5) * 200}px`);
            butterfly.style.setProperty('--fly-rotate', `${Math.random() * 360}deg`);
            butterfly.style.animationDelay = `${i * 0.2}s`;
            container.appendChild(butterfly);
        });
    }
    
    // ==================== CREATURES ====================
    
    unlockCreature(creatureId) {
        if (this.state.creatures.includes(creatureId)) return;
        
        this.state.creatures.push(creatureId);
        this.saveGameState();
        this.updateUI();
        
        // Show discovery modal
        const creature = this.allCreatures.find(c => c.id === creatureId);
        if (creature) {
            this.showCreatureDiscovery(creature);
        }
    }
    
    showCreatureDiscovery(creature) {
        const modal = document.getElementById('creature-modal');
        
        document.getElementById('creature-reveal').querySelector('.creature-emoji').textContent = creature.emoji;
        document.getElementById('creature-name').textContent = creature.name;
        document.getElementById('creature-wisdom').textContent = creature.wisdom;
        document.getElementById('creature-unlock').textContent = `Unlocked by: ${creature.unlockMethod}`;
        
        modal.classList.add('active');
        this.vibrate([50, 30, 50, 30, 100, 50, 150]);
    }
    
    closeCreatureModal() {
        document.getElementById('creature-modal').classList.remove('active');
        this.vibrate([20]);
    }
    
    renderCreaturesGrid() {
        const grid = document.getElementById('creatures-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.allCreatures.forEach(creature => {
            const unlocked = this.state.creatures.includes(creature.id);
            
            const card = document.createElement('div');
            card.className = `creature-card ${unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="creature-avatar">${unlocked ? creature.emoji : '❓'}</div>
                <div class="creature-card-name">${unlocked ? creature.name : '???'}</div>
                <div class="creature-card-trait">${unlocked ? creature.trait : 'Locked'}</div>
            `;
            
            if (unlocked) {
                card.addEventListener('click', () => this.showCreatureDiscovery(creature));
            }
            
            grid.appendChild(card);
        });
    }
    
    // ==================== PARTICLES ====================
    
    initParticles() {
        // Background ambient particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3 - 0.2,
                radius: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.2,
                color: `hsl(${45 + Math.random() * 30}, 80%, 70%)`
            });
        }
    }
    
    updateParticles() {
        this.particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Fade out burst particles
            if (p.alpha > 0.3 && p.vx !== 0) {
                p.alpha -= 0.02;
                p.radius *= 0.98;
            }
            
            // Wrap ambient particles
            if (p.y < -10) p.y = window.innerHeight + 10;
            if (p.x < -10) p.x = window.innerWidth + 10;
            if (p.x > window.innerWidth + 10) p.x = -10;
            
            // Remove dead particles
            if (p.alpha <= 0.01 || p.radius < 0.5) {
                this.particles.splice(index, 1);
            }
        });
    }
    
    renderParticles() {
        this.particleCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        this.particles.forEach(p => {
            this.particleCtx.beginPath();
            this.particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.particleCtx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('hsl', 'hsla');
            this.particleCtx.fill();
        });
    }
    
    // ==================== TOUCH EFFECTS ====================
    
    createTouchRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '50px';
        ripple.style.height = '50px';
        ripple.style.marginLeft = '-25px';
        ripple.style.marginTop = '-25px';
        
        document.body.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    // ==================== ANIMATION LOOP ====================
    
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update breath phase (for orb animation)
        this.breathPhase += deltaTime * 0.001;
        
        // Update particles
        this.updateParticles();
        this.renderParticles();
        
        // Orb breathing effect
        if (this.state.currentScreen === 'world' && !this.orbTouched) {
            const breathScale = 1 + Math.sin(this.breathPhase) * 0.03;
            const orbBody = document.querySelector('.orb-body');
            if (orbBody) {
                orbBody.style.transform = `translate(-50%, -50%) scale(${breathScale})`;
            }
        }
        
        this.animationId = requestAnimationFrame(this.animate);
    }
    
    // ==================== BOSS BATTLE ====================
    
    bosses = [
        { 
            id: 'anxiety', 
            name: 'The Anxiety Storm', 
            emoji: '⛈️',
            description: 'Racing thoughts and worried feelings',
            difficulty: 1,
            reward: { energy: 30, creature: 'flow' }
        },
        { 
            id: 'doubt', 
            name: 'The Shadow of Doubt', 
            emoji: '👤',
            description: 'That voice that says you\'re not enough',
            difficulty: 2,
            reward: { energy: 40, creature: 'owl' }
        },
        { 
            id: 'overwhelm', 
            name: 'The Crushing Wave', 
            emoji: '🌊',
            description: 'Too much, all at once',
            difficulty: 2,
            reward: { energy: 50, creature: 'turtle' }
        },
        { 
            id: 'anger', 
            name: 'The Inner Volcano', 
            emoji: '🌋',
            description: 'Heat that wants to explode',
            difficulty: 3,
            reward: { energy: 60, creature: 'ember' }
        }
    ];
    
    startBossBattle() {
        // Pick a random boss based on current state
        const availableBosses = this.bosses.filter(b => b.difficulty <= Math.ceil(this.state.energy / 30));
        const boss = availableBosses[Math.floor(Math.random() * availableBosses.length)] || this.bosses[0];
        
        this.currentBoss = boss;
        this.battleState = {
            bossHealth: 100,
            playerCalm: 100,
            breathCount: 0,
            calmBreaths: 0,
            startTime: Date.now(),
            isActive: true
        };
        
        // Update UI
        document.getElementById('boss-name').textContent = boss.name;
        document.querySelector('.storm-cloud').textContent = boss.emoji;
        document.getElementById('boss-health').style.width = '100%';
        document.getElementById('player-calm').style.width = '100%';
        
        // Show boss screen
        this.showScreen('boss');
        this.vibrate([50, 30, 50, 30, 100]);
        
        // Start breath detection
        this.initBreathDetection();
        
        // Start battle loop
        this.battleLoop();
        
        console.log('⚔️ Boss battle started:', boss.name);
    }
    
    async initBreathDetection() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: true
                } 
            });
            
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            
            const mic = this.audioContext.createMediaStreamSource(stream);
            mic.connect(analyser);
            
            this.breathDetector = {
                analyser,
                dataArray: new Uint8Array(analyser.frequencyBinCount),
                stream,
                noiseFloor: 0.03,
                threshold: 0.08,
                volume: 0,
                smoothedVolume: 0,
                isBreathing: false,
                lastBreathTime: 0
            };
            
            // Calibrate after 1 second
            setTimeout(() => {
                if (this.breathDetector) {
                    this.breathDetector.noiseFloor = this.breathDetector.smoothedVolume * 1.5;
                    this.breathDetector.threshold = this.breathDetector.noiseFloor + 0.04;
                }
            }, 1000);
            
            console.log('🎤 Breath detection ready for battle');
        } catch (err) {
            console.warn('Microphone not available, using touch fallback');
            this.setupTouchBreathFallback();
        }
    }
    
    setupTouchBreathFallback() {
        // If no mic, use touch as breath input
        const bossScreen = document.getElementById('boss-screen');
        const breathCircle = document.querySelector('.breath-circle');
        
        if (breathCircle) {
            breathCircle.addEventListener('touchstart', () => this.onBreathStart());
            breathCircle.addEventListener('touchend', () => this.onBreathEnd());
            breathCircle.addEventListener('mousedown', () => this.onBreathStart());
            breathCircle.addEventListener('mouseup', () => this.onBreathEnd());
            
            // Update instruction
            document.querySelector('.boss-instructions').innerHTML = `
                <p>Hold the circle as you breathe in.</p>
                <p>Release as you breathe out.</p>
            `;
        }
    }
    
    onBreathStart() {
        if (!this.battleState?.isActive) return;
        this.breathDetector = this.breathDetector || {};
        this.breathDetector.isBreathing = true;
        
        const breathCircle = document.querySelector('.breath-circle');
        breathCircle?.classList.add('breathing-in');
        
        this.vibrate([20]);
    }
    
    onBreathEnd() {
        if (!this.battleState?.isActive) return;
        if (this.breathDetector) {
            this.breathDetector.isBreathing = false;
        }
        
        const breathCircle = document.querySelector('.breath-circle');
        breathCircle?.classList.remove('breathing-in');
        
        // Count as a breath cycle
        this.onBreathCycle();
    }
    
    updateBreathDetection() {
        if (!this.breathDetector?.analyser) return;
        
        const { analyser, dataArray } = this.breathDetector;
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const n = dataArray[i] / 255;
            sum += n * n;
        }
        this.breathDetector.volume = Math.sqrt(sum / dataArray.length) * 2;
        
        // Smooth
        this.breathDetector.smoothedVolume = this.breathDetector.smoothedVolume * 0.8 + 
                                              this.breathDetector.volume * 0.2;
        
        // Detect breath
        const now = performance.now();
        const adjusted = this.breathDetector.smoothedVolume - this.breathDetector.noiseFloor;
        const wasBreathing = this.breathDetector.isBreathing;
        
        this.breathDetector.isBreathing = adjusted > this.breathDetector.threshold;
        
        // Detect breath cycle completion (was breathing, now not)
        if (wasBreathing && !this.breathDetector.isBreathing && 
            now - this.breathDetector.lastBreathTime > 1500) {
            this.onBreathCycle();
            this.breathDetector.lastBreathTime = now;
        }
        
        // Update breath circle visual
        const breathCircle = document.querySelector('.breath-circle');
        if (breathCircle) {
            const scale = 1 + (this.breathDetector.isBreathing ? 0.3 : 0);
            breathCircle.style.transform = `scale(${scale})`;
        }
    }
    
    onBreathCycle() {
        if (!this.battleState?.isActive) return;
        
        this.battleState.breathCount++;
        
        // Check if it was a calm breath (smooth, not panicked)
        // For simplicity, every breath after the first 2 counts as "calm"
        if (this.battleState.breathCount > 2) {
            this.battleState.calmBreaths++;
            
            // Damage the boss!
            const damage = 8 + Math.floor(Math.random() * 5);
            this.battleState.bossHealth = Math.max(0, this.battleState.bossHealth - damage);
            
            // Visual feedback
            this.vibrate([30, 20, 30]);
            document.querySelector('.storm-cloud')?.classList.add('haptic-flash');
            setTimeout(() => {
                document.querySelector('.storm-cloud')?.classList.remove('haptic-flash');
            }, 150);
            
            // Update UI
            document.getElementById('boss-health').style.width = `${this.battleState.bossHealth}%`;
            
            // Restore some calm
            this.battleState.playerCalm = Math.min(100, this.battleState.playerCalm + 3);
            document.getElementById('player-calm').style.width = `${this.battleState.playerCalm}%`;
        }
        
        console.log(`🫁 Breath ${this.battleState.breathCount}, Boss: ${this.battleState.bossHealth}%`);
    }
    
    battleLoop() {
        if (!this.battleState?.isActive) return;
        
        // Update breath detection
        this.updateBreathDetection();
        
        // Boss attacks (drains player calm over time)
        const timeSinceStart = (Date.now() - this.battleState.startTime) / 1000;
        const attackRate = 0.3 + (this.currentBoss?.difficulty || 1) * 0.1;
        
        // Reduce calm if not breathing
        if (!this.breathDetector?.isBreathing) {
            this.battleState.playerCalm = Math.max(0, this.battleState.playerCalm - attackRate);
            document.getElementById('player-calm').style.width = `${this.battleState.playerCalm}%`;
        }
        
        // Check win/lose conditions
        if (this.battleState.bossHealth <= 0) {
            this.winBattle();
            return;
        }
        
        if (this.battleState.playerCalm <= 0) {
            this.loseBattle();
            return;
        }
        
        // Update breath guide animation
        const breathPhase = (Date.now() / 3000) % 1;
        const guideScale = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.3;
        const breathText = document.querySelector('.breath-text');
        if (breathText) {
            breathText.textContent = breathPhase < 0.5 ? 'Breathe In...' : 'Breathe Out...';
        }
        
        // Storm visual intensity based on boss health
        const stormIntensity = this.battleState.bossHealth / 100;
        const stormCloud = document.querySelector('.storm-cloud');
        if (stormCloud) {
            stormCloud.style.filter = `brightness(${0.5 + stormIntensity * 0.5})`;
            stormCloud.style.animation = `stormShake ${0.3 + (1 - stormIntensity) * 0.5}s ease-in-out infinite`;
        }
        
        requestAnimationFrame(() => this.battleLoop());
    }
    
    winBattle() {
        this.battleState.isActive = false;
        this.stopBreathDetection();
        
        // Celebration!
        this.vibrate([100, 50, 100, 50, 200, 100, 300]);
        
        // Add rewards
        const reward = this.currentBoss?.reward || { energy: 30 };
        this.addEnergy(reward.energy);
        
        // Unlock creature if applicable
        if (reward.creature && !this.state.creatures.includes(reward.creature)) {
            setTimeout(() => {
                this.unlockCreature(reward.creature);
            }, 1500);
        }
        
        // Update victory screen
        document.querySelector('.victory-message').textContent = 
            `You remained calm through ${this.currentBoss?.name || 'the storm'}.`;
        document.querySelector('.victory-rewards').innerHTML = `
            <div class="victory-reward">⚡ +${reward.energy} Energy</div>
            ${reward.creature ? `<div class="victory-reward">🎉 New creature awaits!</div>` : ''}
        `;
        
        this.showScreen('victory');
        
        console.log('🏆 Battle won!');
    }
    
    loseBattle() {
        this.battleState.isActive = false;
        this.stopBreathDetection();
        
        // Gentle feedback - no punishment
        this.vibrate([50, 100, 50]);
        
        // Small energy loss
        this.removeEnergy(10);
        
        // Show encouragement, return to world
        alert('The storm was strong today. Rest, and try again when you\'re ready. 💜');
        this.showScreen('world');
        
        // Reset nav
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.nav-btn[data-screen="world"]')?.classList.add('active');
        
        console.log('😤 Battle lost, but you\'ll be back stronger');
    }
    
    stopBreathDetection() {
        if (this.breathDetector?.stream) {
            this.breathDetector.stream.getTracks().forEach(track => track.stop());
        }
        this.breathDetector = null;
    }
    
    // ==================== SAVE/LOAD ====================
    
    saveGameState() {
        const saveData = {
            energy: this.state.energy,
            alignment: this.state.alignment,
            creatures: this.state.creatures,
            savedAt: Date.now()
        };
        
        localStorage.setItem('align_save', JSON.stringify(saveData));
    }
    
    loadGameState() {
        const saved = localStorage.getItem('align_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.state.energy = data.energy ?? 75;
                this.state.alignment = data.alignment ?? 0.7;
                this.state.creatures = data.creatures ?? [];
            } catch (e) {
                console.warn('Failed to load save:', e);
            }
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    window.alignGame = new AlignGame();
});

