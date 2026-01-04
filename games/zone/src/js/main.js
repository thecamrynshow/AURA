/* ============================================
   ZONE — Main Game Controller
   Find Your Calm | PNEUOMA
   ============================================ */

class ZoneGame {
    constructor() {
        // Screens
        this.titleScreen = document.getElementById('titleScreen');
        this.checkinScreen = document.getElementById('checkinScreen');
        this.activityScreen = document.getElementById('activityScreen');
        this.completeScreen = document.getElementById('completeScreen');
        
        // UI Elements
        this.gameContainer = document.getElementById('gameContainer');
        this.zoneIndicator = document.getElementById('zoneIndicator');
        this.progressFill = document.getElementById('progressFill');
        this.startZoneLabel = document.getElementById('startZoneLabel');
        
        // Complete screen elements
        this.completeMessage = document.getElementById('completeMessage');
        this.journeyStart = document.getElementById('journeyStart');
        this.tipText = document.getElementById('tipText');
        
        // State
        this.currentScreen = 'title';
        this.startingZone = null;
        this.activityQueue = [];
        this.currentActivityIndex = 0;
        
        this.init();
    }

    init() {
        // Initialize audio
        zoneAudio.init();
        
        // Bind events
        this.bindEvents();
        
        // Set up zone manager callbacks
        zoneManager.onZoneChange = (zone) => this.handleZoneChange(zone);
        zoneManager.onProgressUpdate = (progress) => this.updateProgress(progress);
        
        // Set up activity callbacks
        breathingActivity.onComplete = () => this.nextActivity();
        breathingActivity.onProgress = (amt) => zoneManager.addProgress(amt);
        
        groundingActivity.onComplete = () => this.nextActivity();
        groundingActivity.onProgress = (amt) => zoneManager.addProgress(amt);
        
        movementActivity.onComplete = () => this.nextActivity();
        movementActivity.onProgress = (amt) => zoneManager.addProgress(amt);
        
        console.log('ZONE Game initialized');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('checkin');
            zoneAudio.resume();
        });
        
        // Zone selection
        document.querySelectorAll('.zone-card').forEach(card => {
            card.addEventListener('click', () => {
                const zone = card.dataset.zone;
                this.selectZone(zone);
            });
        });
        
        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.reset();
            this.showScreen('checkin');
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
        
        // Screen-specific logic
        if (screenName === 'activity') {
            zoneWorld.start();
        } else {
            zoneWorld.stop();
        }
    }

    selectZone(zoneName) {
        this.startingZone = zoneName;
        zoneManager.setZone(zoneName);
        zoneManager.startSession();
        
        // Update UI
        this.updateZoneIndicator(zoneName);
        this.gameContainer.className = `game-container zone-${zoneName}`;
        
        // If already green, skip activities
        if (zoneName === 'green') {
            this.showAlreadyGreen();
            return;
        }
        
        // Set up activity queue based on zone
        this.setupActivities(zoneName);
        
        // Start activities
        this.showScreen('activity');
        zoneWorld.setZone(zoneName, true);
        zoneAudio.startAmbient(zoneName);
        
        // Update progress bar labels
        const zone = getZone(zoneName);
        this.startZoneLabel.textContent = zone.name.replace(' Zone', '');
        
        // Start first activity after a brief pause
        setTimeout(() => this.startActivity(), 1000);
    }

    setupActivities(zoneName) {
        const activities = zoneManager.getActivities();
        this.activityQueue = [...activities];
        this.currentActivityIndex = 0;
        
        console.log(`Activities for ${zoneName}:`, this.activityQueue);
    }

    startActivity() {
        if (this.currentActivityIndex >= this.activityQueue.length) {
            this.completeSession();
            return;
        }
        
        const activity = this.activityQueue[this.currentActivityIndex];
        
        switch (activity) {
            case 'breathing':
                breathingActivity.start(5);
                break;
            case 'grounding':
                groundingActivity.start();
                break;
            case 'movement':
                movementActivity.start(3);
                break;
            default:
                this.nextActivity();
        }
    }

    nextActivity() {
        this.currentActivityIndex++;
        
        // Transition world colors as we progress
        const progress = zoneManager.progress;
        if (progress > 70) {
            zoneWorld.setZone('green');
            zoneAudio.transitionTo('green');
        } else if (progress > 40 && this.startingZone === 'red') {
            zoneWorld.setZone('yellow');
            zoneAudio.transitionTo('yellow');
        }
        
        // Small delay before next activity
        setTimeout(() => this.startActivity(), 500);
    }

    handleZoneChange(zoneName) {
        this.updateZoneIndicator(zoneName);
        this.gameContainer.className = `game-container zone-${zoneName}`;
    }

    updateZoneIndicator(zoneName) {
        const zone = getZone(zoneName);
        this.zoneIndicator.textContent = zone.emoji + ' ' + zone.name;
        this.zoneIndicator.style.color = zone.color;
    }

    updateProgress(progress) {
        this.progressFill.style.width = `${progress}%`;
    }

    showAlreadyGreen() {
        // Special flow for users already in green zone
        this.completeMessage.textContent = "You're already in the Green Zone!";
        
        const startZone = getZone('green');
        this.journeyStart.querySelector('.journey-zone').textContent = startZone.emoji;
        this.journeyStart.querySelector('.journey-label').textContent = 'You are';
        
        document.querySelector('.journey-end .journey-zone').textContent = '🌟';
        document.querySelector('.journey-end .journey-label').textContent = 'Amazing!';
        
        this.tipText.textContent = getRandomTip('green');
        
        this.gameContainer.className = 'game-container zone-green';
        this.showScreen('complete');
        
        zoneAudio.playFeedback('complete');
    }

    completeSession() {
        // Ensure we're at 100%
        zoneManager.addProgress(100 - zoneManager.progress);
        
        // Stop activities and audio
        zoneAudio.stopAmbient();
        zoneAudio.playFeedback('complete');
        
        // Set up completion screen
        const startZone = getZone(this.startingZone);
        const endZone = getZone('green');
        
        this.completeMessage.textContent = `You moved from ${startZone.name} to ${endZone.name}`;
        
        this.journeyStart.querySelector('.journey-zone').textContent = startZone.emoji;
        document.querySelector('.journey-end .journey-zone').textContent = endZone.emoji;
        
        this.tipText.textContent = getRandomTip(this.startingZone);
        
        // Show complete screen
        this.gameContainer.className = 'game-container zone-green';
        this.showScreen('complete');
    }

    reset() {
        zoneManager.reset();
        this.activityQueue = [];
        this.currentActivityIndex = 0;
        this.startingZone = null;
        this.progressFill.style.width = '0%';
        this.zoneIndicator.textContent = '—';
        this.gameContainer.className = 'game-container';
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.zoneGame = new ZoneGame();
    console.log('ZONE — Find Your Calm | PNEUOMA');
});



