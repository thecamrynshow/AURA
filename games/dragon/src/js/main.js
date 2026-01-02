/* Dragon's Breath - Main Game Controller */

class DragonGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'start'; // start, playing, paused, ended
        this.score = 0;
        this.gemsCollected = 0;
        this.sessionStartTime = 0;
        this.maxSessionTime = 5 * 60 * 1000; // 5 minutes
        
        // Game objects
        this.dragon = null;
        this.world = null;
        
        // UI elements
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            end: document.getElementById('end-screen')
        };
        
        // Timing
        this.lastTime = 0;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setupEventListeners() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause button
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        // Resume button
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Quit button
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.endGame();
        });
        
        // Play again
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
        
        // Touch/click for manual flap (backup for no mic)
        this.canvas.addEventListener('mousedown', () => this.manualFlap(true));
        this.canvas.addEventListener('mouseup', () => this.manualFlap(false));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.manualFlap(true);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.manualFlap(false);
        });
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        if (this.world) {
            this.world.resize();
        }
    }

    async startGame() {
        // Initialize audio
        await dragonAudio.init();
        const micEnabled = await dragonAudio.requestMicrophone();
        
        if (!micEnabled) {
            console.log('Microphone not available - using touch controls');
        }
        
        dragonAudio.onBreathLevel = (level, isBreathing) => {
            if (this.dragon && this.state === 'playing') {
                this.dragon.breathLevel = level;
            }
            this.updateBreathMeter(level);
        };
        
        // Create game objects
        this.dragon = new Dragon(150, this.height / 2);
        this.world = new World(this.canvas);
        
        // Reset score
        this.score = 0;
        this.gemsCollected = 0;
        this.updateUI();
        
        // Start ambient sound
        dragonAudio.startAmbient();
        dragonAudio.resume();
        
        // Show game screen
        this.showScreen('game');
        this.state = 'playing';
        this.sessionStartTime = Date.now();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    manualFlap(isFlapping) {
        if (this.dragon && this.state === 'playing') {
            this.dragon.breathLevel = isFlapping ? 0.3 : 0;
            this.updateBreathMeter(isFlapping ? 0.3 : 0);
        }
    }

    gameLoop(currentTime = performance.now()) {
        if (this.state !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Process breath
        dragonAudio.processBreath();
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Check session time
        if (Date.now() - this.sessionStartTime > this.maxSessionTime) {
            this.endGame();
            return;
        }
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // Update world
        this.world.update(deltaTime);
        
        // Update dragon
        this.dragon.update(deltaTime, dragonAudio.breathLevel);
        
        // Check collisions
        const collected = this.world.checkCollisions(this.dragon);
        
        if (collected.stars > 0) {
            this.score += collected.stars * 10;
            dragonAudio.playCollect('star');
        }
        
        if (collected.gems > 0) {
            this.gemsCollected += collected.gems;
            this.score += collected.gems * 50;
            dragonAudio.playCollect('gem');
        }
        
        this.updateUI();
    }

    render() {
        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render world (background, collectibles)
        this.world.render();
        
        // Render dragon
        this.dragon.render(this.ctx);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('gems').textContent = this.gemsCollected;
    }

    updateBreathMeter(level) {
        const fill = document.getElementById('breath-fill');
        if (fill) {
            const percent = Math.min(level * 200, 100);
            fill.style.width = `${percent}%`;
        }
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        cancelAnimationFrame(this.animationId);
        this.showScreen('pause');
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        
        this.showScreen('game');
        this.state = 'playing';
        this.lastTime = performance.now();
        this.gameLoop();
    }

    endGame() {
        this.state = 'ended';
        cancelAnimationFrame(this.animationId);
        
        dragonAudio.stopAmbient();
        dragonAudio.playLevelComplete();
        
        // Update final stats
        document.getElementById('final-stars').textContent = this.score;
        document.getElementById('final-gems').textContent = this.gemsCollected;
        document.getElementById('final-distance').textContent = this.world ? this.world.getDistance() + 'm' : '0m';
        
        this.showScreen('end');
    }

    resetGame() {
        this.score = 0;
        this.gemsCollected = 0;
        this.dragon = null;
        this.world = null;
    }

    showScreen(screenId) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        if (this.screens[screenId]) {
            this.screens[screenId].classList.add('active');
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DragonGame();
    console.log('Dragon\'s Breath initialized! 🐉');
});

