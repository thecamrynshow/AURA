/* Star Catcher - Main Game Controller */

class StarCatcherGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = 'start';
        this.starsCaught = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.sessionTime = 3 * 60 * 1000; // 3 minutes
        this.startTime = 0;
        
        // Game objects
        this.net = null;
        this.starManager = null;
        
        // Input
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHolding = false;
        
        // UI
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
        
        // Mouse/touch for net position
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
        
        // Hold for manual breath
        this.canvas.addEventListener('mousedown', () => this.isHolding = true);
        this.canvas.addEventListener('mouseup', () => this.isHolding = false);
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isHolding = true;
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        });
        this.canvas.addEventListener('touchend', () => this.isHolding = false);
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        
        if (this.starManager) {
            this.starManager.resize(this.width, this.height);
        }
        
        // Default mouse to center
        if (this.mouseX === 0) {
            this.mouseX = this.width / 2;
            this.mouseY = this.height * 0.7;
        }
    }

    async startGame() {
        // Initialize audio
        await starAudio.init();
        const micEnabled = await starAudio.requestMicrophone();
        
        if (!micEnabled) {
            console.log('Microphone not available - using touch controls');
        }
        
        starAudio.onBreathLevel = (level) => {
            if (this.net && this.state === 'playing') {
                this.net.setBreathLevel(level);
            }
            this.updateBreathIndicator(level);
        };
        
        // Create game objects
        this.net = new LightNet(this.width / 2, this.height * 0.7);
        this.starManager = new StarManager(this.width, this.height);
        
        // Reset stats
        this.starsCaught = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.updateUI();
        
        // Start ambient
        starAudio.startAmbient();
        starAudio.resume();
        
        // Show game
        this.showScreen('game');
        this.state = 'playing';
        this.startTime = Date.now();
        
        // Start loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(currentTime = performance.now()) {
        if (this.state !== 'playing') return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Process breath
        const breathLevel = starAudio.processBreath();
        
        // Manual breath fallback
        if (this.isHolding) {
            this.net.setBreathLevel(0.3);
            this.updateBreathIndicator(0.3);
        }
        
        // Update
        this.update(deltaTime);
        
        // Render
        this.render();
        
        // Check time
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.sessionTime - elapsed);
        this.updateTimer(remaining);
        
        if (remaining <= 0) {
            this.endGame();
            return;
        }
        
        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        // Update net position
        this.net.setPosition(this.mouseX, this.mouseY);
        this.net.update(deltaTime);
        
        // Update stars
        this.starManager.update(deltaTime);
        
        // Check catches
        const caught = this.starManager.checkCatch(
            this.net.x,
            this.net.y,
            this.net.getRadius()
        );
        
        if (caught) {
            this.onStarCaught(caught);
        }
        
        // Check misses
        const activeStars = this.starManager.getActiveStars();
        // If stars fall off screen, streak breaks
    }

    onStarCaught(star) {
        this.starsCaught++;
        this.streak++;
        
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
        }
        
        starAudio.playCatch();
        
        // Streak bonus
        if (this.streak > 0 && this.streak % 5 === 0) {
            starAudio.playStreak(Math.floor(this.streak / 5));
        }
        
        this.updateUI();
    }

    render() {
        // Clear with night sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a1f');
        gradient.addColorStop(0.5, '#151530');
        gradient.addColorStop(1, '#1f1f45');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render stars
        this.starManager.render(this.ctx);
        
        // Render net
        this.net.render(this.ctx);
    }

    updateUI() {
        document.getElementById('stars-caught').textContent = this.starsCaught;
        document.getElementById('streak').textContent = this.streak;
    }

    updateTimer(remaining) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateBreathIndicator(level) {
        const indicator = document.getElementById('net-power');
        if (indicator) {
            const size = 20 + level * 160;
            indicator.style.width = `${size}%`;
            indicator.style.height = `${size}%`;
        }
    }

    pauseGame() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        cancelAnimationFrame(this.animationId);
        document.getElementById('pause-stars').textContent = this.starsCaught;
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
        
        starAudio.stopAmbient();
        starAudio.playComplete();
        
        // Update final stats
        document.getElementById('final-stars').textContent = this.starsCaught;
        document.getElementById('final-streak').textContent = this.bestStreak;
        
        // Draw constellation
        this.drawConstellation();
        
        this.showScreen('end');
    }

    drawConstellation() {
        const container = document.getElementById('constellation');
        container.innerHTML = '';
        
        // Create mini canvas for constellation
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // Draw random constellation based on stars caught
        const numStars = Math.min(this.starsCaught, 15);
        const points = [];
        
        for (let i = 0; i < numStars; i++) {
            points.push({
                x: Utils.random(20, 180),
                y: Utils.random(20, 130)
            });
        }
        
        // Draw connections
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < points.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.stroke();
        }
        
        // Draw stars
        points.forEach(p => {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
            glow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    resetGame() {
        this.starsCaught = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.net = null;
        this.starManager = null;
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
    window.game = new StarCatcherGame();
    console.log('Star Catcher initialized! ⭐');
});

