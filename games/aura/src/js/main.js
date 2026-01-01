/**
 * Project AURA - Main Game Controller
 * Regulation Game Prototype v1
 */

class Game {
    constructor() {
        // Core systems
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu'; // menu, loading, playing, challenge, ending
        this.isRunning = false;
        this.sessionTime = 0;
        this.maxSessionTime = 12 * 60 * 1000; // 12 minutes max
        this.minSessionTime = 5 * 60 * 1000;  // 5 minutes min for full experience
        
        // Systems (initialized in init())
        this.audio = null;
        this.breathDetector = null;
        this.breathGuide = null;
        this.world = null;
        this.player = null;
        this.challenges = null;
        this.pneu = null;
        
        // UI elements
        this.joystick = null;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Breath state cache
        this.breathState = {
            level: 0.5,
            phase: 'neutral',
            coherence: 50,
            stability: 50,
            rate: 0,
            isCalibrating: true
        };
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    async init() {
        console.log('Initializing Project AURA...');
        
        // Initialize screen manager
        ScreenManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize audio system
        this.audio = new AudioSystem();
        
        // Initialize breath detection
        this.breathDetector = new BreathDetector();
        
        // Initialize breath guide
        this.breathGuide = new BreathGuide();
        
        // Initialize PNEU profile
        this.pneu = new PNEUProfile();
        
        // Setup HUD updates
        this.setupHUD();
        
        console.log('Game initialized, waiting for user to start');
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // Breath update events
        GameEvents.on('breathUpdate', (state) => {
            this.breathState = state;
            this.updateBreathHUD(state);
        });
        
        // Calibration complete
        GameEvents.on('calibrationComplete', () => {
            this.onCalibrationComplete();
        });
        
        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupHUD() {
        // Timer update interval
        setInterval(() => {
            if (this.state === 'playing') {
                const timerEl = document.getElementById('timer-display');
                if (timerEl) {
                    timerEl.textContent = Utils.formatTime(this.sessionTime / 1000);
                }
            }
        }, 1000);
    }

    updateBreathHUD(state) {
        // Update breath meter
        const breathFill = document.getElementById('breath-fill');
        if (breathFill) {
            breathFill.style.width = `${state.level * 100}%`;
        }
        
        // Update breath state text
        const breathStateEl = document.getElementById('breath-state');
        if (breathStateEl) {
            if (state.isCalibrating) {
                breathStateEl.textContent = 'Calibrating...';
            } else {
                const stateText = state.stability > 60 ? 'Calm' :
                                 state.stability < 30 ? 'Settle...' : 'Breathing';
                breathStateEl.textContent = stateText;
            }
        }
        
        // Update body class for styling
        document.body.classList.remove('calm', 'dysregulated');
        if (state.stability > 60) {
            document.body.classList.add('calm');
        } else if (state.stability < 30) {
            document.body.classList.add('dysregulated');
        }
        
        // Update coherence meter
        const coherenceProgress = document.getElementById('coherence-progress');
        const coherenceValue = document.getElementById('coherence-value');
        if (coherenceProgress && coherenceValue) {
            const circumference = 283; // 2 * PI * 45
            const offset = circumference - (state.coherence / 100) * circumference;
            coherenceProgress.style.strokeDashoffset = offset;
            coherenceValue.textContent = Math.round(state.coherence);
        }
    }

    async startGame() {
        console.log('Starting game...');
        
        // Show loading screen
        await ScreenManager.show('loading-screen');
        
        // Initialize audio (requires user interaction)
        await this.audio.init();
        
        // Initialize breath detection
        await this.breathDetector.init();
        
        // Initialize world
        this.world = new World(this.canvas);
        
        // Initialize player
        this.player = new Player(this.world);
        
        // Initialize challenges
        this.challenges = new ChallengeManager(this);
        
        // Initialize joystick
        this.joystick = new JoystickController(document.getElementById('joystick-base'));
        
        // Start PNEU session tracking
        this.pneu.startSession();
        
        // Resize canvas
        this.handleResize();
        
        // Show game screen
        await ScreenManager.show('game-container');
        
        // Start audio
        this.audio.start();
        
        // Start game loop
        this.state = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.sessionTime = 0;
        
        requestAnimationFrame(this.gameLoop);
        
        console.log('Game started!');
    }

    onCalibrationComplete() {
        // Show a brief message
        const msgEl = document.getElementById('message-display');
        const textEl = document.getElementById('message-text');
        
        textEl.textContent = 'Breath calibrated. Begin your journey.';
        msgEl.classList.remove('hidden');
        
        setTimeout(() => {
            msgEl.classList.add('hidden');
        }, 3000);
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = Math.min(currentTime - this.lastTime, 50); // Cap at 50ms
        this.lastTime = currentTime;
        
        // Update session time
        this.sessionTime += this.deltaTime;
        
        // Update systems
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Record PNEU data
        if (this.sessionTime % 100 < this.deltaTime) { // Every ~100ms
            this.pneu.recordBreathState(this.breathState);
        }
        
        // Check session time limit
        if (this.sessionTime >= this.maxSessionTime) {
            this.endSession();
            return;
        }
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        // Update breath detection
        this.breathDetector.update(deltaTime);
        
        // Update breath guide
        this.breathGuide.update(deltaTime);
        
        // Update world
        this.world.update(deltaTime, this.breathState, this.player.getPosition());
        
        // Update player
        this.player.update(deltaTime, this.breathState);
        
        // Update challenges
        this.challenges.update(deltaTime, this.breathState, this.player.getPosition());
        
        // Update audio
        this.audio.update(deltaTime, this.breathState);
        
        // Check for challenge zone entry
        this.checkChallengeZones();
    }

    checkChallengeZones() {
        if (this.challenges.activeChallenge) return;
        
        const playerPos = this.player.getPosition();
        const zone = this.world.getActiveZone(playerPos);
        
        if (zone && !this.challenges.completedChallenges.has(zone.id)) {
            // Show zone name
            zone.showName = true;
            
            // Start challenge if player stays in zone
            if (this.player.isStill()) {
                this.challenges.startChallenge(zone.id);
            }
        }
        
        // Hide zone names when not in zone
        this.world.challengeZones.forEach(z => {
            if (!zone || z.id !== zone.id) {
                z.showName = false;
            }
        });
    }

    render() {
        // Clear and render world
        this.world.render();
        
        // Render player
        this.player.render(this.ctx, this.world.camera);
        
        // Render challenges
        this.challenges.render(this.ctx, this.world.camera);
    }

    handleResize() {
        if (this.world) {
            this.world.resize();
        }
    }

    async endSession() {
        console.log('Ending session...');
        
        this.isRunning = false;
        this.state = 'ending';
        
        // Stop audio gracefully
        this.audio.playEndSessionSound();
        
        // End PNEU session
        this.pneu.endSession();
        
        // Update end screen stats
        const statsDisplay = new SessionStatsDisplay(this.pneu);
        statsDisplay.updateEndScreen();
        
        // Sync to PNEU
        await this.pneu.syncToPNEU();
        
        // Fade audio
        setTimeout(() => {
            this.audio.stop();
        }, 3000);
        
        // Show end screen
        await ScreenManager.show('end-screen');
        
        // Clean up breath detector
        this.breathDetector.destroy();
    }

    async restartGame() {
        // Reset state
        this.sessionTime = 0;
        this.pneu = new PNEUProfile();
        
        // Reinitialize and start
        await this.startGame();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.init();
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.game && window.game.isRunning) {
        // Could pause the game here if desired
        console.log('Tab hidden - game continues in background');
    }
});
