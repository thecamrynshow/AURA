/* ============================================
   THE DEEP — Main Game Controller
   Descent into Calm | PNEUOMA
   ============================================ */

class DeepGame {
    constructor() {
        // Screens
        this.titleScreen = document.getElementById('titleScreen');
        this.calibrationScreen = document.getElementById('calibrationScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.completeScreen = document.getElementById('completeScreen');
        
        // UI Elements
        this.depthValue = document.getElementById('depthValue');
        this.breathIndicator = document.getElementById('breathIndicator');
        this.breathCircle = document.getElementById('breathCircle');
        this.breathUp = document.getElementById('breathUp');
        this.breathDown = document.getElementById('breathDown');
        this.zoneLabel = document.getElementById('zoneLabel');
        this.discoveryPopup = document.getElementById('discoveryPopup');
        this.discCount = document.getElementById('discCount');
        
        // Calibration elements
        this.micPermission = document.getElementById('micPermission');
        this.calibrationBreathing = document.getElementById('calibrationBreathing');
        this.breathLevel = document.getElementById('breathLevel');
        this.calibInstruction = document.getElementById('calibInstruction');
        
        // Complete screen elements
        this.maxDepthEl = document.getElementById('maxDepth');
        this.statTime = document.getElementById('statTime');
        this.statDiscoveries = document.getElementById('statDiscoveries');
        this.statBreaths = document.getElementById('statBreaths');
        this.discoveriesGrid = document.getElementById('discoveriesGrid');
        
        // Ocean canvas
        this.canvas = document.getElementById('oceanCanvas');
        this.ocean = new Ocean(this.canvas);
        
        // State
        this.currentScreen = 'title';
        this.isPlaying = false;
        this.startTime = 0;
        this.breathCount = 0;
        this.maxDepthReached = 0;
        this.lastBreathState = 'neutral';
        this.currentZone = null;
        
        // Breath processing interval
        this.breathInterval = null;
        
        this.init();
    }

    init() {
        // Initialize audio
        deepAudio.init();
        
        // Bind events
        this.bindEvents();
        
        // Set up audio callbacks
        deepAudio.onBreathChange = (state) => this.handleBreathChange(state);
        deepAudio.onBreathLevel = (level) => this.handleBreathLevel(level);
        
        // Set up ocean discovery callback
        this.ocean.onDiscovery = (creature) => this.handleDiscovery(creature);
        
        console.log('The Deep initialized');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('calibration');
            deepAudio.resume();
        });
        
        // Enable mic button
        document.getElementById('enableMicBtn').addEventListener('click', () => {
            this.requestMicrophone();
        });
        
        // Dive again button
        document.getElementById('diveAgainBtn').addEventListener('click', () => {
            this.reset();
            this.showScreen('calibration');
        });
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}Screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        this.currentScreen = screenName;
    }

    async requestMicrophone() {
        const success = await deepAudio.requestMicrophone();
        
        if (success) {
            this.micPermission.classList.add('hidden');
            this.calibrationBreathing.classList.remove('hidden');
            this.startCalibration();
        } else {
            alert('Microphone access is required for breath detection. Please enable it and try again.');
        }
    }

    async startCalibration() {
        // Step 1: Get baseline
        this.calibInstruction.textContent = 'Breathe normally for a moment...';
        this.updateCalibStep(1);
        
        // Start showing breath level
        this.breathInterval = setInterval(() => {
            const level = deepAudio.getRawBreathLevel();
            this.breathLevel.style.width = `${level * 100}%`;
        }, 50);
        
        await deepAudio.calibrate();
        
        // Step 2: Test inhale
        this.calibInstruction.textContent = 'Take a deep breath IN...';
        this.updateCalibStep(2);
        
        await this.waitForBreath('inhale', 2000);
        
        // Step 3: Ready
        this.calibInstruction.textContent = 'Perfect! Ready to dive.';
        this.updateCalibStep(3);
        
        await this.wait(1500);
        
        clearInterval(this.breathInterval);
        this.startGame();
    }

    updateCalibStep(step) {
        document.querySelectorAll('.calib-step').forEach((el, i) => {
            el.classList.remove('active', 'complete');
            if (i + 1 < step) el.classList.add('complete');
            if (i + 1 === step) el.classList.add('active');
        });
    }

    waitForBreath(targetState, timeout) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            
            const check = () => {
                const breath = deepAudio.processBreath();
                
                if (breath && breath.state === targetState) {
                    resolve(true);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    resolve(false);
                    return;
                }
                
                requestAnimationFrame(check);
            };
            
            check();
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startGame() {
        this.showScreen('game');
        this.isPlaying = true;
        this.startTime = Date.now();
        
        // Start ocean
        this.ocean.start();
        
        // Start ambient audio
        deepAudio.startAmbient();
        
        // Start breath processing
        this.breathInterval = setInterval(() => {
            if (this.isPlaying) {
                deepAudio.processBreath();
            }
        }, 50);
        
        // Start game loop
        this.gameLoop();
        
        // Show zone label
        setTimeout(() => {
            this.zoneLabel.classList.add('visible');
        }, 1000);
    }

    gameLoop() {
        if (!this.isPlaying) return;
        
        // Update ocean with breath state
        this.ocean.updatePlayer(deepAudio.breathState, 1/60);
        
        // Update depth display
        const depth = Math.floor(this.ocean.depth);
        this.depthValue.textContent = depth;
        
        // Track max depth
        if (depth > this.maxDepthReached) {
            this.maxDepthReached = depth;
        }
        
        // Update zone label
        const zone = getZoneByDepth(depth);
        if (zone.key !== this.currentZone) {
            this.currentZone = zone.key;
            this.updateZoneLabel(zone);
        }
        
        // Update ambient audio for depth
        deepAudio.updateAmbientForDepth(depth);
        
        // Update discoveries count
        this.discCount.textContent = this.ocean.discoveries.size;
        
        // Check for completion (reached the bottom)
        if (depth >= 1950 && this.ocean.discoveries.has('ancient')) {
            this.completeGame();
            return;
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    handleBreathChange(state) {
        // Update UI
        this.breathCircle.classList.remove('inhale', 'exhale');
        this.breathUp.classList.remove('active');
        this.breathDown.classList.remove('active');
        
        if (state === 'inhale') {
            this.breathCircle.classList.add('inhale');
            this.breathUp.classList.add('active');
            
            // Count breaths
            if (this.lastBreathState !== 'inhale') {
                this.breathCount++;
            }
        } else if (state === 'exhale') {
            this.breathCircle.classList.add('exhale');
            this.breathDown.classList.add('active');
        }
        
        this.lastBreathState = state;
    }

    handleBreathLevel(level) {
        // Could be used for visual feedback
    }

    handleDiscovery(creature) {
        // Play sound
        deepAudio.playDiscovery();
        
        // Show popup
        document.getElementById('discoveryIcon').textContent = creature.emoji;
        document.getElementById('discoveryName').textContent = creature.name;
        document.getElementById('discoveryDesc').textContent = creature.desc;
        
        this.discoveryPopup.classList.remove('hidden');
        this.discoveryPopup.classList.add('visible');
        
        // Vibrate
        vibrate([100, 50, 100]);
        
        // Hide after delay
        setTimeout(() => {
            this.discoveryPopup.classList.remove('visible');
            setTimeout(() => {
                this.discoveryPopup.classList.add('hidden');
            }, 500);
        }, 3000);
        
        // Update count
        this.discCount.textContent = this.ocean.discoveries.size;
    }

    updateZoneLabel(zone) {
        const zoneName = this.zoneLabel.querySelector('.zone-name');
        const zoneRange = this.zoneLabel.querySelector('.zone-range');
        
        zoneName.textContent = zone.name;
        zoneRange.textContent = `${zone.range[0]}-${zone.range[1]}m`;
        
        // Flash animation
        this.zoneLabel.style.animation = 'none';
        this.zoneLabel.offsetHeight; // Trigger reflow
        this.zoneLabel.style.animation = 'zone-change 0.5s ease';
    }

    completeGame() {
        this.isPlaying = false;
        
        // Stop breath processing
        clearInterval(this.breathInterval);
        
        // Stop ocean
        this.ocean.stop();
        
        // Stop audio
        deepAudio.stopAmbient();
        deepAudio.playComplete();
        
        // Calculate stats
        const duration = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Update complete screen
        this.maxDepthEl.textContent = this.maxDepthReached;
        this.statTime.textContent = formatTime(duration);
        this.statDiscoveries.textContent = this.ocean.discoveries.size;
        this.statBreaths.textContent = this.breathCount;
        
        // Populate discoveries grid
        this.populateDiscoveriesGrid();
        
        // Show complete screen
        this.showScreen('complete');
    }

    populateDiscoveriesGrid() {
        const allCreatures = getAllCreatures();
        this.discoveriesGrid.innerHTML = '';
        
        allCreatures.forEach(creature => {
            const item = document.createElement('div');
            item.className = 'discovery-item';
            
            if (this.ocean.discoveries.has(creature.id)) {
                item.classList.add('found');
                item.textContent = creature.emoji;
                item.title = creature.name;
            } else {
                item.classList.add('locked');
                item.textContent = '?';
            }
            
            this.discoveriesGrid.appendChild(item);
        });
    }

    reset() {
        this.breathCount = 0;
        this.maxDepthReached = 0;
        this.currentZone = null;
        this.lastBreathState = 'neutral';
        
        this.ocean.depth = 0;
        this.ocean.targetDepth = 0;
        this.ocean.creatures = [];
        this.ocean.discoveries.clear();
        this.ocean.player.velocity = 0;
        this.ocean.player.y = this.ocean.height / 2;
        this.ocean.player.targetY = this.ocean.player.y;
        
        this.discCount.textContent = '0';
        this.depthValue.textContent = '0';
        
        this.zoneLabel.classList.remove('visible');
    }
}

// Add zone change animation
const style = document.createElement('style');
style.textContent = `
    @keyframes zone-change {
        0% { transform: translateY(-50%) scale(1); }
        50% { transform: translateY(-50%) scale(1.1); }
        100% { transform: translateY(-50%) scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.deepGame = new DeepGame();
    console.log('The Deep — Descent into Calm | PNEUOMA');
});

