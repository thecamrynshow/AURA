/**
 * Echo Garden - Main Game Controller
 * A PNEUOMA Game
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu';
        this.isRunning = false;
        this.sessionTime = 0;
        this.maxSessionTime = 8 * 60 * 1000; // 8 minutes
        
        // Systems
        this.soundDetector = null;
        this.audio = null;
        this.world = null;
        this.garden = null;
        
        // Sound state cache
        this.soundState = {
            volume: 0,
            pitch: 0,
            soundType: 'silence',
            isHumming: false,
            humDuration: 0,
            pitchStability: 0
        };
        
        // Stats
        this.stats = {
            plantsGrown: 0,
            harmoniesFound: 0,
            humTime: 0,
            breathCount: 0,
            seedsPlanted: 0
        };
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Hum tracking for planting
        this.lastPlantTime = 0;
        this.plantCooldown = 2000;
        
        // Harmony tracking
        this.harmonyStreak = 0;
        
        // Breath tracking for growing seeds
        this.breathStreak = 0;
        this.lastBreathTime = 0;
        this.breathCooldown = 1500; // Minimum time between breath counts
        this.isInBreath = false;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    async init() {
        console.log('Initializing Echo Garden...');
        
        ScreenManager.init();
        this.setupEventListeners();
        
        this.audio = new AudioSystem();
        this.soundDetector = new SoundDetector();
        
        console.log('Game initialized, waiting for user to start');
    }
    
    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });
        
        window.addEventListener('resize', this.handleResize);
        
        // Sound events
        GameEvents.on('soundUpdate', (state) => {
            this.soundState = state;
            this.updateSoundHUD(state);
        });
        
        GameEvents.on('humStart', (data) => {
            this.onHumStart(data);
        });
        
        GameEvents.on('plantPlanted', (data) => {
            this.onPlantPlanted(data);
        });
        
        GameEvents.on('plantFullyGrown', (data) => {
            this.onPlantFullyGrown(data);
        });
        
        GameEvents.on('calibrationComplete', () => {
            this.showMessage('Listening to your garden...');
        });
    }
    
    async startGame() {
        console.log('Starting game...');
        
        // Initialize audio
        await this.audio.init();
        
        // Initialize sound detection
        await this.soundDetector.init();
        
        // Initialize world
        this.handleResize();
        this.world = new World(this.canvas);
        
        // Initialize garden
        this.garden = new Garden(this.canvas.width, this.canvas.height);
        
        // Show game screen
        await ScreenManager.show('game-screen');
        
        // Start audio
        this.audio.start();
        
        // Reset stats
        this.stats = {
            plantsGrown: 0,
            harmoniesFound: 0,
            humTime: 0
        };
        
        // Start game loop
        this.state = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.sessionTime = 0;
        
        requestAnimationFrame(this.gameLoop);
        
        this.showMessage('Find harmony to plant seeds, breathe to grow them...');
        
        console.log('Game started!');
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.sessionTime += this.deltaTime;
        
        this.update(this.deltaTime);
        this.render();
        this.updateHUD();
        
        if (this.sessionTime >= this.maxSessionTime) {
            this.endSession();
            return;
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update sound detection
        this.soundDetector.update(deltaTime);
        
        // Update world
        this.world.update(deltaTime, this.soundState);
        
        // Update garden
        this.garden.update(deltaTime, this.soundState);
        
        // Update audio
        this.audio.update(deltaTime, this.soundState);
        
        // Check for harmony (every 5 harmonies = plant a seed)
        this.checkForHarmony(deltaTime);
        
        // Check for breath (every 5 breaths = grow a seed)
        this.checkForBreath(deltaTime);
        
        // Track hum time
        if (this.soundState.isHumming) {
            this.stats.humTime += deltaTime;
        }
    }
    
    checkForPlanting() {
        // Planting now happens via harmonies (every 5 harmonies = 1 seed)
        // Growing now happens via breaths (every 5 breaths = 1 plant grows)
        // This method is kept for legacy but the main mechanics are in checkForHarmony and checkForBreath
    }
    
    checkForHarmony(deltaTime) {
        if (this.soundState.pitchStability > 0.7) {
            this.harmonyStreak += deltaTime;
            
            // Award harmony after sustained stability
            if (this.harmonyStreak > 3000) {
                this.harmonyStreak = 0;
                this.stats.harmoniesFound++;
                this.audio.playHarmonySound();
                this.updateHarmonyRings();
                this.showMessage('Harmony found!');
                
                // Every 5 harmonies, plant a seed!
                if (this.stats.harmoniesFound % 5 === 0) {
                    const seed = this.garden.plantSeedFromHarmony();
                    if (seed) {
                        this.stats.seedsPlanted++;
                        this.audio.playPlantSound(seed.plantType);
                        this.showMessage('🌱 A seed takes root!', 2000);
                    }
                }
            }
        } else {
            this.harmonyStreak = Math.max(0, this.harmonyStreak - deltaTime * 0.5);
        }
    }
    
    checkForBreath(deltaTime) {
        const now = performance.now();
        
        // Detect breath cycles
        if (this.soundState.soundType === 'breath' && this.soundState.volume > 0.15) {
            if (!this.isInBreath && now - this.lastBreathTime > this.breathCooldown) {
                this.isInBreath = true;
                this.breathStreak++;
                this.stats.breathCount++;
                this.lastBreathTime = now;
                
                // Every 5 breaths, grow a seed into a plant!
                if (this.stats.breathCount % 5 === 0 && this.garden.getSeedCount() > 0) {
                    const plant = this.garden.growSeedFromBreath();
                    if (plant) {
                        this.audio.playGrowSound();
                        this.showMessage('🌿 A plant emerges!', 2000);
                    }
                }
            }
        } else {
            this.isInBreath = false;
        }
    }
    
    render() {
        // Render world
        this.world.render();
        
        // Render garden
        this.garden.render(this.ctx);
    }
    
    updateSoundHUD(state) {
        // Update sound meter
        const soundFill = document.getElementById('sound-fill');
        if (soundFill) {
            soundFill.style.width = `${state.volume * 300}%`;
        }
        
        // Update sound state text
        const soundStateEl = document.getElementById('sound-state');
        if (soundStateEl) {
            if (state.isCalibrating) {
                soundStateEl.textContent = 'Calibrating...';
            } else {
                const stateTexts = {
                    'silence': 'Listening...',
                    'breath': 'Breathing...',
                    'hum': 'Humming ♪',
                    'voice': 'Singing!'
                };
                soundStateEl.textContent = stateTexts[state.soundType] || 'Listening...';
            }
        }
    }
    
    updateHarmonyRings() {
        const rings = Math.min(this.stats.harmoniesFound, 3);
        for (let i = 1; i <= 3; i++) {
            const ring = document.getElementById(`ring-${i}`);
            if (ring) {
                ring.classList.toggle('active', i <= rings);
            }
        }
        
        const harmonyValue = document.getElementById('harmony-value');
        if (harmonyValue) {
            harmonyValue.textContent = this.stats.harmoniesFound;
        }
    }
    
    updateHUD() {
        // Timer
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = Utils.formatTime(this.sessionTime / 1000);
        }
        
        // Plants count (show both seeds and plants)
        const plantsEl = document.getElementById('plants-grown');
        if (plantsEl) {
            const plants = this.garden.plantsGrown;
            const seeds = this.garden.getSeedCount();
            if (seeds > 0) {
                plantsEl.textContent = `${plants} plant${plants !== 1 ? 's' : ''} (${seeds} 🌱)`;
            } else {
                plantsEl.textContent = `${plants} plant${plants !== 1 ? 's' : ''}`;
            }
        }
    }
    
    onHumStart(data) {
        // Visual feedback for hum detection
    }
    
    onPlantPlanted(data) {
        this.stats.plantsGrown++;
        
        // Messages for milestones
        if (this.stats.plantsGrown === 1) {
            this.showMessage('Your first seed takes root.');
        } else if (this.stats.plantsGrown === 5) {
            this.showMessage('The garden grows...');
        } else if (this.stats.plantsGrown === 10) {
            this.showMessage('Life flourishes.');
        }
    }
    
    onPlantFullyGrown(data) {
        this.audio.playGrowSound();
    }
    
    showMessage(text, duration = 3000) {
        const msgEl = document.getElementById('message-display');
        const textEl = document.getElementById('message-text');
        
        textEl.textContent = text;
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, duration);
    }
    
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.world) {
            this.world.resize();
        }
        
        if (this.garden) {
            this.garden.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    async endSession() {
        console.log('Ending session...');
        
        this.isRunning = false;
        this.state = 'ending';
        
        this.audio.playEndSessionSound();
        
        // Update end screen
        document.getElementById('stat-time').textContent = Utils.formatTime(this.sessionTime / 1000);
        document.getElementById('stat-plants').textContent = this.stats.plantsGrown;
        document.getElementById('stat-harmony').textContent = this.stats.harmoniesFound;
        
        setTimeout(() => {
            this.audio.stop();
        }, 2000);
        
        await ScreenManager.show('end-screen');
        
        this.soundDetector.destroy();
    }
    
    async restartGame() {
        this.sessionTime = 0;
        this.soundDetector = new SoundDetector();
        await this.startGame();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.init();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.game && window.game.isRunning) {
        console.log('Tab hidden - game continues');
    }
});

