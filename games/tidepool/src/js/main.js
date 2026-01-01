/**
 * Tidepool - Main Game Controller
 * A PNEUOMA Game
 */

class Game {
    constructor() {
        // Core elements
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu'; // menu, playing, ending
        this.isRunning = false;
        this.sessionTime = 0;
        this.maxSessionTime = 10 * 60 * 1000; // 10 minutes
        
        // Systems
        this.audio = null;
        this.world = null;
        this.creatures = null;
        this.input = null;
        
        // Stats
        this.stats = {
            totalConnections: 0,
            calmTime: 0,
            maxPresence: 0
        };
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    async init() {
        console.log('Initializing Tidepool...');
        
        // Initialize screen manager
        ScreenManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize audio system
        this.audio = new AudioSystem();
        
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
        
        // Connection events
        GameEvents.on('connection', (type) => {
            this.onConnection(type);
        });
        
        // Presence updates
        GameEvents.on('presenceUpdate', (data) => {
            this.onPresenceUpdate(data);
        });
    }
    
    async startGame() {
        console.log('Starting game...');
        
        // Initialize audio (requires user interaction)
        await this.audio.init();
        
        // Initialize world
        this.handleResize();
        this.world = new World(this.canvas);
        
        // Initialize creatures
        this.creatures = new CreatureManager(this.canvas.width, this.canvas.height);
        this.creatures.populate();
        
        // Initialize input
        this.input = new InputManager(this.canvas);
        
        // Show game screen
        await ScreenManager.show('game-screen');
        
        // Start audio
        this.audio.start();
        
        // Reset stats
        this.stats = {
            totalConnections: 0,
            calmTime: 0,
            maxPresence: 0
        };
        
        // Start game loop
        this.state = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.sessionTime = 0;
        
        requestAnimationFrame(this.gameLoop);
        
        // Show welcome message
        this.showMessage('Move slowly. The creatures are watching.');
        
        console.log('Game started!');
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        this.deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        // Update session time
        this.sessionTime += this.deltaTime;
        
        // Update systems
        this.update(this.deltaTime);
        
        // Render
        this.render();
        
        // Update HUD
        this.updateHUD();
        
        // Check session time
        if (this.sessionTime >= this.maxSessionTime) {
            this.endSession();
            return;
        }
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update input
        this.input.update(deltaTime);
        
        const playerPos = this.input.getPosition();
        const playerSpeed = this.input.getSpeed();
        const presenceLevel = this.input.getPresence();
        
        // Update world
        this.world.update(deltaTime, presenceLevel);
        
        // Update creatures
        this.creatures.update(
            deltaTime,
            playerPos.x,
            playerPos.y,
            playerSpeed,
            presenceLevel
        );
        
        // Update audio
        this.audio.update(deltaTime, presenceLevel);
        
        // Track calm time
        if (presenceLevel > 0.6) {
            this.stats.calmTime += deltaTime;
        }
        
        // Track max presence
        if (presenceLevel > this.stats.maxPresence) {
            this.stats.maxPresence = presenceLevel;
        }
        
        // Create ripple effect on movement
        if (playerSpeed > 2 && Math.random() < 0.1) {
            this.world.createRipple(playerPos.x, playerPos.y, playerSpeed / 10);
        }
    }
    
    render() {
        // Render world (background)
        this.world.render();
        
        // Render creatures
        this.creatures.render(this.ctx);
        
        // Render touch point glow
        this.renderTouchGlow();
    }
    
    renderTouchGlow() {
        if (!this.input.isActive) return;
        
        const pos = this.input.getPosition();
        const presence = this.input.getPresence();
        
        // Soft glow at touch point
        const gradient = this.ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, 50 + presence * 30
        );
        
        const alpha = 0.1 + presence * 0.15;
        gradient.addColorStop(0, `rgba(0, 255, 255, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(0, 200, 255, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, 80 + presence * 30, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }
    
    updateHUD() {
        // Update timer
        const timerEl = document.getElementById('timer-display');
        if (timerEl) {
            timerEl.textContent = Utils.formatTime(this.sessionTime / 1000);
        }
        
        // Update presence meter
        const presenceFill = document.getElementById('presence-fill');
        const presenceState = document.getElementById('presence-state');
        const presence = this.input.getPresence();
        
        if (presenceFill) {
            presenceFill.style.width = `${presence * 100}%`;
        }
        
        if (presenceState) {
            if (presence > 0.8) {
                presenceState.textContent = 'Connected';
            } else if (presence > 0.6) {
                presenceState.textContent = 'Calm';
            } else if (presence > 0.4) {
                presenceState.textContent = 'Present';
            } else if (presence > 0.2) {
                presenceState.textContent = 'Settling...';
            } else {
                presenceState.textContent = 'Too fast';
            }
        }
        
        // Update creatures near count
        const creaturesNear = document.getElementById('creatures-near');
        if (creaturesNear) {
            creaturesNear.textContent = this.creatures.nearbyCount;
        }
    }
    
    onConnection(creatureType) {
        this.stats.totalConnections++;
        this.audio.playConnectionSound();
        
        // Show message for first few connections
        if (this.stats.totalConnections === 1) {
            this.showMessage('You made a connection.');
        } else if (this.stats.totalConnections === 3) {
            this.showMessage('The creatures trust you.');
        } else if (this.stats.totalConnections === 5) {
            this.showMessage('You are part of the pool now.');
        }
    }
    
    onPresenceUpdate(data) {
        // Could trigger events based on presence milestones
        if (data.level > 0.9 && this.sessionTime > 60000) {
            // High presence after a minute - seahorse might appear
        }
    }
    
    showMessage(text, duration = 4000) {
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
        
        if (this.creatures) {
            this.creatures.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    async endSession() {
        console.log('Ending session...');
        
        this.isRunning = false;
        this.state = 'ending';
        
        // Play end sound
        this.audio.playEndSessionSound();
        
        // Update end screen stats
        document.getElementById('stat-time').textContent = Utils.formatTime(this.sessionTime / 1000);
        document.getElementById('stat-connections').textContent = this.stats.totalConnections;
        document.getElementById('stat-calm').textContent = Math.round((this.stats.calmTime / this.sessionTime) * 100) + '%';
        
        // Fade audio
        setTimeout(() => {
            this.audio.stop();
        }, 2000);
        
        // Show end screen
        await ScreenManager.show('end-screen');
        
        // Cleanup
        if (this.input) {
            this.input.destroy();
        }
    }
    
    async restartGame() {
        // Reset and start fresh
        this.sessionTime = 0;
        await this.startGame();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.init();
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.game && window.game.isRunning) {
        console.log('Tab hidden - game continues in background');
    }
});

