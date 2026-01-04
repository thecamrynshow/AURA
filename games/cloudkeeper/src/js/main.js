/* ============================================
   CLOUD KEEPER — Main Game Controller
   The gentlest game for the youngest players
   ============================================ */

class CloudKeeper {
    constructor() {
        this.canvas = document.getElementById('skyCanvas');
        this.sky = new Sky(this.canvas);
        
        // UI Elements
        this.cloudCountEl = document.getElementById('cloudCount');
        this.breathBubble = document.getElementById('breathBubble');
        this.bubbleFill = document.getElementById('bubbleFill');
        this.encouragement = document.getElementById('encouragement');
        this.starsFoundEl = document.getElementById('starsFound');
        this.totalCloudsEl = document.getElementById('totalClouds');
        
        // State
        this.currentScreen = 'title';
        this.isPlaying = false;
        this.controlMode = 'touch'; // 'mic' or 'touch'
        this.cloudCount = 0;
        
        // Encouragement cooldown
        this.lastEncouragement = 0;
        this.encouragementCooldown = 5000;
        
        // Breath processing
        this.breathInterval = null;
        
        this.init();
    }

    async init() {
        await cloudAudio.init();
        this.bindEvents();
        console.log('☁️ Cloud Keeper initialized — Gentle Sky Play');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('howto');
            cloudAudio.resume();
            cloudAudio.playChime(0);
        });

        // Control choice buttons
        document.getElementById('useMicBtn').addEventListener('click', async () => {
            this.controlMode = 'mic';
            const success = await cloudAudio.requestMicrophone();
            if (success) {
                this.startGame();
            } else {
                // Fall back to touch
                alert('Microphone not available. Tap to play instead! 🎈');
                this.controlMode = 'touch';
                this.startGame();
            }
        });

        document.getElementById('useTouchBtn').addEventListener('click', () => {
            this.controlMode = 'touch';
            this.startGame();
        });

        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.reset();
            this.showScreen('howto');
        });

        // Pause button - return to title
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.endGame();
            this.showScreen('title');
        });

        // Touch/click to push clouds
        this.canvas.addEventListener('click', (e) => {
            if (!this.isPlaying) return;
            this.handleTap(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.isPlaying) return;
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTap(touch.clientX, touch.clientY);
        });

        // Keyboard - space to blow
        document.addEventListener('keydown', (e) => {
            if (!this.isPlaying) return;
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleBlow(0.5);
            }
        });
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId + 'Screen').classList.add('active');
        this.currentScreen = screenId;
    }

    startGame() {
        this.showScreen('game');
        this.isPlaying = true;
        this.cloudCount = 0;
        this.updateCloudCount();
        
        // Reset star display
        this.starsFoundEl.querySelectorAll('.star').forEach(star => {
            star.classList.remove('found');
        });
        
        // Show breath bubble if using mic
        this.breathBubble.style.display = this.controlMode === 'mic' ? 'flex' : 'none';
        
        // Start sky
        this.sky.start();
        
        // Start breath processing if using mic
        if (this.controlMode === 'mic') {
            this.startBreathProcessing();
        }
        
        // Start game loop
        this.gameLoop();
        
        cloudAudio.playChime(1);
    }

    startBreathProcessing() {
        cloudAudio.onBlowStart = () => {
            this.breathBubble.classList.add('blowing');
        };

        cloudAudio.onBlowEnd = () => {
            this.breathBubble.classList.remove('blowing');
        };

        cloudAudio.onBlowLevel = (level) => {
            // Update bubble fill
            const fillPercent = Math.min(100, level * 300);
            this.bubbleFill.style.height = fillPercent + '%';
            
            // Blow clouds if strong enough
            if (level > 0.15) {
                this.handleBlow(level);
            }
        };

        this.breathInterval = setInterval(() => {
            if (this.isPlaying) {
                cloudAudio.processBreath();
            }
        }, 50);
    }

    handleBlow(force) {
        this.sky.blowClouds(force * 5);
        this.cloudCount++;
        this.updateCloudCount();
        cloudAudio.playWhoosh();
    }

    handleTap(x, y) {
        const pushed = this.sky.pushCloud(x, y);
        if (pushed) {
            this.cloudCount++;
            this.updateCloudCount();
            cloudAudio.playWhoosh();
            gentleVibrate();
        }
    }

    updateCloudCount() {
        this.cloudCountEl.textContent = this.cloudCount;
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        // Check for newly found stars
        const starFound = this.sky.update();
        if (starFound) {
            this.handleStarFound();
        }
        
        // Update star display
        this.updateStarDisplay();
        
        // Check for random encouragement
        this.maybeShowEncouragement();
        
        // Check if game complete
        if (this.sky.isComplete()) {
            setTimeout(() => this.showCelebration(), 1000);
            return;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    handleStarFound() {
        cloudAudio.playStarFound();
        this.showEncouragement('You found a star! ⭐');
    }

    updateStarDisplay() {
        const stars = this.starsFoundEl.querySelectorAll('.star');
        stars.forEach((star, i) => {
            if (i < this.sky.starsFound) {
                star.classList.add('found');
            }
        });
    }

    maybeShowEncouragement() {
        if (Date.now() - this.lastEncouragement < this.encouragementCooldown) return;
        
        // Random chance to encourage
        if (this.cloudCount > 0 && Math.random() < 0.002) {
            this.showEncouragement(getEncouragement());
        }
    }

    showEncouragement(text) {
        this.encouragement.querySelector('.encourage-text').textContent = text;
        this.encouragement.classList.add('show');
        this.lastEncouragement = Date.now();
        
        setTimeout(() => {
            this.encouragement.classList.remove('show');
        }, 2000);
    }

    showCelebration() {
        this.isPlaying = false;
        this.sky.stop();
        
        if (this.breathInterval) {
            clearInterval(this.breathInterval);
            this.breathInterval = null;
        }
        
        this.totalCloudsEl.textContent = this.sky.cloudsMoved;
        this.showScreen('celebration');
        cloudAudio.playCelebration();
    }

    endGame() {
        this.isPlaying = false;
        this.sky.stop();
        
        if (this.breathInterval) {
            clearInterval(this.breathInterval);
            this.breathInterval = null;
        }
    }

    reset() {
        this.cloudCount = 0;
        this.updateCloudCount();
        this.sky.reset();
        
        // Reset star display
        this.starsFoundEl.querySelectorAll('.star').forEach(star => {
            star.classList.remove('found');
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cloudKeeper = new CloudKeeper();
});

console.log('☁️ Cloud Keeper Main loaded');



