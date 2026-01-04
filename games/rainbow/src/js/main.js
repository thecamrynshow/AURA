/**
 * Rainbow Painter - Main Game Controller
 * A PNEUOMA Game for Kids
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'menu';
        this.isRunning = false;
        this.sessionTime = 0;
        this.maxSessionTime = 5 * 60 * 1000; // 5 minutes
        
        // Systems
        this.breathDetector = null;
        this.soundEffects = null;
        this.sky = null;
        
        // Breath state
        this.breathState = {
            volume: 0,
            isBlowing: false,
            blowDuration: 0
        };
        
        // Stats
        this.stats = {
            rainbowsCompleted: 0,
            totalBreaths: 0
        };
        
        // Breath tracking for painting
        this.blowChargeTime = 0;
        this.blowThreshold = 600; // ms of blowing needed to paint
        this.lastPaintTime = 0;
        this.paintCooldown = 800; // ms between paints
        this.isPainting = false;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // UI elements
        this.breathFill = null;
        this.nextColorBox = null;
        this.rainbowCounter = null;
        this.progressDots = [];
        this.breathPrompt = null;
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    async init() {
        console.log('🌈 Initializing Rainbow Painter...');
        
        ScreenManager.init();
        this.setupEventListeners();
        this.cacheUIElements();
        
        this.soundEffects = new SoundEffects();
        this.breathDetector = new BreathDetector();
        
        console.log('Game initialized, waiting for user to start');
    }
    
    cacheUIElements() {
        this.breathFill = document.getElementById('breath-fill');
        this.nextColorBox = document.getElementById('next-color');
        this.rainbowCounter = document.getElementById('rainbow-counter');
        this.breathPrompt = document.getElementById('breath-prompt');
        
        document.querySelectorAll('.progress-dot').forEach(dot => {
            this.progressDots.push(dot);
        });
    }
    
    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restartGame();
        });
        
        window.addEventListener('resize', this.handleResize);
        
        // Breath events
        GameEvents.on('breathUpdate', (state) => {
            this.breathState = state;
            this.updateBreathUI(state);
        });
        
        GameEvents.on('blowStart', () => {
            this.onBlowStart();
        });
        
        GameEvents.on('blowEnd', (data) => {
            this.onBlowEnd(data);
        });
        
        GameEvents.on('rainbowComplete', (data) => {
            this.onRainbowComplete(data);
        });
        
        GameEvents.on('calibrationComplete', () => {
            this.showMessage('Ready! Blow gently to paint! 🌬️', 2000);
        });
    }
    
    async startGame() {
        console.log('Starting game...');
        
        // Initialize audio
        this.soundEffects.init();
        this.soundEffects.resume();
        
        // Initialize breath detection
        await this.breathDetector.init();
        
        // Setup canvas
        this.handleResize();
        
        // Initialize sky
        this.sky = new Sky(this.canvas.width, this.canvas.height);
        this.sky.startNewRainbow();
        
        // Show game screen
        await ScreenManager.show('game-screen');
        
        // Reset stats
        this.stats = {
            rainbowsCompleted: 0,
            totalBreaths: 0
        };
        
        // Update initial UI
        this.updateNextColorUI();
        this.updateProgressDots(0);
        
        // Start game loop
        this.state = 'playing';
        this.isRunning = true;
        this.lastTime = performance.now();
        this.sessionTime = 0;
        
        requestAnimationFrame(this.gameLoop);
        
        console.log('🌈 Game started!');
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        this.deltaTime = Math.min(currentTime - this.lastTime, 50);
        this.lastTime = currentTime;
        
        this.sessionTime += this.deltaTime;
        
        this.update(this.deltaTime);
        this.render();
        
        if (this.sessionTime >= this.maxSessionTime) {
            this.endSession();
            return;
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update breath detection
        this.breathDetector.update(deltaTime);
        
        // Update sky
        this.sky.update(deltaTime);
        
        // Check for painting
        this.checkForPainting(deltaTime);
    }
    
    checkForPainting(deltaTime) {
        const now = performance.now();
        
        if (this.breathState.isBlowing) {
            this.blowChargeTime += deltaTime;
            
            // Visual feedback - breath prompt pulses
            if (this.breathPrompt) {
                const scale = 1 + (this.blowChargeTime / this.blowThreshold) * 0.3;
                this.breathPrompt.style.transform = `translateX(-50%) scale(${Math.min(scale, 1.3)})`;
            }
            
            // Check if we should paint
            if (this.blowChargeTime >= this.blowThreshold && 
                now - this.lastPaintTime > this.paintCooldown) {
                this.paintColor();
                this.blowChargeTime = 0;
                this.lastPaintTime = now;
            }
        } else {
            this.blowChargeTime = Math.max(0, this.blowChargeTime - deltaTime * 2);
            
            if (this.breathPrompt) {
                this.breathPrompt.style.transform = 'translateX(-50%) scale(1)';
            }
        }
    }
    
    paintColor() {
        const colorIndex = this.sky.paintNextColor();
        this.stats.totalBreaths++;
        
        // Play sound
        this.soundEffects.playColorChime(colorIndex);
        
        // Update UI
        this.updateNextColorUI();
        this.updateProgressDots(this.sky.getProgress());
        
        // Show message for color
        const colorName = RAINBOW_COLORS[colorIndex].name;
        this.showMessage(`${colorName.charAt(0).toUpperCase() + colorName.slice(1)}! ✨`, 1000);
        
        // Hide prompt briefly
        if (this.breathPrompt) {
            this.breathPrompt.classList.add('hidden');
            setTimeout(() => {
                if (this.isRunning) {
                    this.breathPrompt.classList.remove('hidden');
                }
            }, 800);
        }
    }
    
    onBlowStart() {
        // Visual feedback
    }
    
    onBlowEnd(data) {
        // Reset charge
        this.blowChargeTime = 0;
    }
    
    onRainbowComplete(data) {
        this.stats.rainbowsCompleted = data.count;
        
        // Update counter
        if (this.rainbowCounter) {
            this.rainbowCounter.textContent = data.count;
        }
        
        // Play celebration
        this.soundEffects.playRainbowComplete();
        
        // Show message
        this.showMessage('🌈 Rainbow Complete! 🌈', 2500);
        
        // Reset progress dots
        setTimeout(() => {
            this.updateProgressDots(0);
            this.updateNextColorUI();
        }, 1000);
    }
    
    updateBreathUI(state) {
        // Update breath meter
        if (this.breathFill) {
            const fillPercent = Math.min(state.adjustedVolume * 300, 100);
            this.breathFill.style.width = `${fillPercent}%`;
            
            // Color changes based on intensity
            if (state.isBlowing) {
                this.breathFill.style.background = 'linear-gradient(90deg, #69db7c, #ffd43b)';
            } else {
                this.breathFill.style.background = 'linear-gradient(90deg, #74c0fc, #69db7c)';
            }
        }
    }
    
    updateNextColorUI() {
        if (this.nextColorBox) {
            const nextColor = this.sky.getNextColor();
            this.nextColorBox.style.backgroundColor = nextColor.hex;
            this.nextColorBox.classList.add('pulse');
            setTimeout(() => this.nextColorBox.classList.remove('pulse'), 500);
        }
    }
    
    updateProgressDots(progress) {
        this.progressDots.forEach((dot, i) => {
            if (i < progress) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }
    
    render() {
        // Clear
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render sky
        this.sky.render(this.ctx);
    }
    
    showMessage(text, duration = 2000) {
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
        
        if (this.sky) {
            this.sky.resize(this.canvas.width, this.canvas.height);
        }
    }
    
    async endSession() {
        console.log('Ending session...');
        
        this.isRunning = false;
        this.state = 'ending';
        
        // Update end screen
        document.getElementById('stat-rainbows').textContent = this.stats.rainbowsCompleted;
        document.getElementById('stat-breaths').textContent = this.stats.totalBreaths;
        
        await ScreenManager.show('end-screen');
        
        this.breathDetector.destroy();
    }
    
    async restartGame() {
        this.sessionTime = 0;
        this.breathDetector = new BreathDetector();
        await this.startGame();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
    window.game.init();
});

