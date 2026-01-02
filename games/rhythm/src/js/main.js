/* Rhythm Islands - Main Game Controller */

class RhythmGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'start';
        this.score = 0;
        this.sessionTime = 3 * 60 * 1000; // 3 minutes
        this.startTime = 0;
        
        // Game systems
        this.islandManager = null;
        this.rhythmManager = null;
        
        // UI
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            end: document.getElementById('end-screen')
        };
        
        this.comboDisplay = document.getElementById('combo-display');
        
        // Timing
        this.lastTime = 0;
        this.animationId = null;
        
        // Background elements
        this.waves = [];
        this.clouds = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initBackgroundElements();
    }

    initBackgroundElements() {
        // Waves
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                y: 0.7 + i * 0.1,
                amplitude: 10 + i * 5,
                frequency: 0.01 - i * 0.002,
                speed: 0.02 + i * 0.01,
                phase: i * Math.PI / 3,
                alpha: 0.3 - i * 0.08
            });
        }
        
        // Clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Utils.random(0, this.width || 800),
                y: Utils.random(30, 150),
                width: Utils.random(80, 150),
                speed: Utils.random(0.2, 0.5)
            });
        }
    }

    setupEventListeners() {
        // Start
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.endGame();
        });
        
        // Play again
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });
        
        // Tap input
        const tapArea = document.getElementById('tap-area');
        
        tapArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleTap();
        });
        
        tapArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTap();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.state === 'playing') {
                e.preventDefault();
                this.handleTap();
            }
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
        
        if (this.islandManager) {
            this.islandManager.resize(this.width, this.height);
        }
    }

    async startGame() {
        // Initialize audio
        await rhythmAudio.init();
        rhythmAudio.resume();
        
        // Setup rhythm manager
        this.rhythmManager = new RhythmManager();
        this.rhythmManager.setBeatInterval(rhythmAudio.getBeatInterval());
        
        this.rhythmManager.onHit = (quality, points, combo) => {
            this.score += points;
            
            // Add progress to island
            const progressAmount = quality === 'perfect' ? 15 : 10;
            const result = this.islandManager.addProgress(progressAmount);
            
            if (result.islandComplete) {
                rhythmAudio.playIslandComplete();
            }
            
            this.updateUI();
        };
        
        // Setup island manager
        this.islandManager = new IslandManager(this.width, this.height);
        
        // Setup beat callback
        rhythmAudio.beatCallback = () => {
            this.rhythmManager.onBeat();
        };
        
        // Reset
        this.score = 0;
        this.updateUI();
        
        // Start
        rhythmAudio.startAmbient();
        rhythmAudio.startBeatLoop();
        
        this.showScreen('game');
        this.state = 'playing';
        this.startTime = Date.now();
        
        this.lastTime = performance.now();
        this.gameLoop();
    }

    handleTap() {
        if (this.state !== 'playing') return;
        
        const result = this.rhythmManager.tap();
        
        // Play sound
        rhythmAudio.playTap(result.quality);
        
        // Update combo display
        this.updateComboDisplay(result.combo);
    }

    gameLoop(currentTime = performance.now()) {
        if (this.state !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        // Check time
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.sessionTime) {
            this.endGame();
            return;
        }
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // Update islands
        this.islandManager.update(deltaTime);
        
        // Update waves
        this.waves.forEach(wave => {
            wave.phase += wave.speed;
        });
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > this.width + cloud.width) {
                cloud.x = -cloud.width;
            }
        });
        
        // Update UI
        this.updateProgressBar();
    }

    render() {
        // Sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.4, '#98D8E8');
        skyGradient.addColorStop(0.6, '#4AB8D8');
        skyGradient.addColorStop(1, '#1A7DA8');
        
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Clouds
        this.renderClouds();
        
        // Waves (behind islands)
        this.renderWaves();
        
        // Islands
        this.islandManager.render(this.ctx);
    }

    renderClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            
            // Main body
            this.ctx.beginPath();
            this.ctx.ellipse(cloud.x, cloud.y, cloud.width / 2, cloud.width / 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Puffs
            this.ctx.beginPath();
            this.ctx.arc(cloud.x - cloud.width * 0.25, cloud.y - cloud.width * 0.1, cloud.width * 0.2, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.width * 0.15, cloud.y - cloud.width * 0.15, cloud.width * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderWaves() {
        this.waves.forEach((wave, index) => {
            const y = this.height * wave.y;
            
            this.ctx.fillStyle = `rgba(26, 125, 168, ${wave.alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            
            for (let x = 0; x <= this.width; x += 10) {
                const waveY = y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
                this.ctx.lineTo(x, waveY);
            }
            
            this.ctx.lineTo(this.width, this.height);
            this.ctx.lineTo(0, this.height);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
    }

    updateComboDisplay(combo) {
        if (combo > 2) {
            this.comboDisplay.classList.remove('hidden');
            document.getElementById('combo').textContent = combo;
        } else {
            this.comboDisplay.classList.add('hidden');
        }
    }

    updateProgressBar() {
        const progress = this.islandManager.getCurrentProgress();
        document.getElementById('island-progress').style.width = `${progress}%`;
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        cancelAnimationFrame(this.animationId);
        
        document.getElementById('pause-score').textContent = this.score;
        document.getElementById('pause-islands').textContent = this.islandManager.getCompletedCount();
        
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
        
        rhythmAudio.stopAmbient();
        rhythmAudio.playComplete();
        
        // Update final stats
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-islands').textContent = this.islandManager.getCompletedCount();
        document.getElementById('final-combo').textContent = this.rhythmManager.getBestCombo();
        
        // Draw archipelago preview
        this.drawArchipelago();
        
        this.showScreen('end');
    }

    drawArchipelago() {
        const container = document.getElementById('archipelago');
        container.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        canvas.width = 250;
        canvas.height = 120;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Ocean background
        ctx.fillStyle = '#4AB8D8';
        ctx.fillRect(0, 0, 250, 120);
        
        // Draw mini islands
        const count = Math.min(this.islandManager.getCompletedCount() + 1, 8);
        for (let i = 0; i < count; i++) {
            const x = 30 + (i % 4) * 55;
            const y = 35 + Math.floor(i / 4) * 50;
            
            // Island
            ctx.fillStyle = '#F5E6C8';
            ctx.beginPath();
            ctx.ellipse(x, y, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Palm
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x + 2, y - 18);
            ctx.stroke();
            
            ctx.fillStyle = '#228B22';
            for (let j = 0; j < 4; j++) {
                const angle = (j / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(x + 2, y - 18);
                ctx.lineTo(x + 2 + Math.cos(angle) * 10, y - 15 + Math.sin(angle) * 5);
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#228B22';
                ctx.stroke();
            }
        }
    }

    resetGame() {
        this.score = 0;
        this.islandManager = null;
        this.rhythmManager = null;
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new RhythmGame();
    console.log('Rhythm Islands initialized! 🏝️');
});

