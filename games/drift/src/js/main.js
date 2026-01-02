/**
 * Drift — Main Game Controller
 * Sleep Preparation Experience
 */

class DriftGame {
    constructor() {
        this.state = 'title'; // title, journey, sleep
        this.duration = 1200; // 20 minutes default
        this.soundEnabled = true;
        this.continueAfter = true;
        this.journey = new JourneyController();
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupJourney();
        
        // Initialize visuals
        Visuals.init();
        
        // Load preferences
        this.soundEnabled = Utils.storage.get('soundEnabled', true);
        this.continueAfter = Utils.storage.get('continueAfter', true);
        this.elements.soundToggle.checked = this.soundEnabled;
        this.elements.continueToggle.checked = this.continueAfter;
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            journeyScreen: Utils.$('journeyScreen'),
            sleepScreen: Utils.$('sleepScreen'),
            
            // Title elements
            durationBtns: Utils.$$('.duration-btn'),
            soundToggle: Utils.$('soundToggle'),
            continueToggle: Utils.$('continueToggle'),
            startBtn: Utils.$('startBtn'),
            
            // Journey elements
            progressIndicator: Utils.$('progressIndicator'),
            progressFill: Utils.$('progressFill'),
            breathOrb: Utils.$('breathOrb').querySelector('.orb-core'),
            breathInstruction: Utils.$('breathInstruction'),
            phaseTitle: Utils.$('phaseTitle'),
            phaseText: Utils.$('phaseText'),
            ambientText: Utils.$('ambientText'),
            
            // Nav
            gameNav: Utils.$('gameNav')
        };
    }
    
    bindEvents() {
        // Duration selection
        this.elements.durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.elements.durationBtns.forEach(b => Utils.removeClass(b, 'selected'));
                Utils.addClass(btn, 'selected');
                this.duration = parseInt(btn.dataset.duration);
            });
        });
        
        // Sound toggle
        this.elements.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            Utils.storage.set('soundEnabled', this.soundEnabled);
        });
        
        // Continue toggle
        this.elements.continueToggle.addEventListener('change', (e) => {
            this.continueAfter = e.target.checked;
            Utils.storage.set('continueAfter', this.continueAfter);
        });
        
        // Start button
        this.elements.startBtn.addEventListener('click', () => {
            this.startJourney();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.state === 'journey') {
                this.endJourney();
            }
        });
    }
    
    setupJourney() {
        this.journey.onPhaseChange = (phase, index) => {
            // Update visuals based on phase
            const dimPhase = index + 1;
            Visuals.setDimPhase(dimPhase);
        };
        
        this.journey.onMessageChange = (message) => {
            Utils.setText(this.elements.phaseTitle, message.title);
            Utils.setText(this.elements.phaseText, message.text);
        };
        
        this.journey.onBreathChange = (breathPhase) => {
            this.updateBreathVisual(breathPhase);
        };
        
        this.journey.onAmbientText = (text) => {
            this.showAmbientText(text);
        };
        
        this.journey.onProgress = (progress) => {
            this.updateProgress(progress);
        };
        
        this.journey.onComplete = () => {
            this.completeJourney();
        };
    }
    
    async startJourney() {
        this.state = 'journey';
        
        // Initialize audio
        await Audio.init();
        Audio.setEnabled(this.soundEnabled);
        
        // Show journey screen
        this.showScreen('journey');
        Utils.addClass(this.elements.progressIndicator, 'visible');
        
        // Setup cursor hide
        Visuals.setupCursorHide();
        
        // Start audio
        if (this.soundEnabled) {
            Audio.startAmbient();
        }
        
        // Start journey
        this.journey.setDuration(this.duration);
        this.journey.start();
        
        // Start audio fade toward end
        setTimeout(() => {
            Audio.fadeToSleep(this.duration * 0.3 * 1000); // Last 30%
        }, this.duration * 0.7 * 1000);
    }
    
    updateBreathVisual(breathPhase) {
        const orb = this.elements.breathOrb;
        
        // Remove all states
        Utils.removeClass(orb, 'inhale');
        Utils.removeClass(orb, 'hold');
        Utils.removeClass(orb, 'exhale');
        
        // Add current state
        Utils.addClass(orb, breathPhase.action);
        
        // Update text
        Utils.setText(this.elements.breathInstruction, breathPhase.text);
        
        // Set transition duration
        orb.style.transitionDuration = `${breathPhase.duration}ms`;
    }
    
    showAmbientText(text) {
        const el = this.elements.ambientText;
        Utils.setText(el, text);
        Utils.addClass(el, 'visible');
        
        // Fade out after 8 seconds
        setTimeout(() => {
            Utils.removeClass(el, 'visible');
        }, 8000);
    }
    
    updateProgress(progress) {
        // Update progress bar
        this.elements.progressFill.style.width = `${progress * 100}%`;
        
        // Update visuals
        Visuals.animateMoon(progress);
        Visuals.dimStars(progress);
        
        // Update dim phase
        const dimPhase = Visuals.getDimPhase(progress);
        Visuals.setDimPhase(dimPhase);
    }
    
    completeJourney() {
        if (this.continueAfter) {
            // Transition to sleep mode
            this.state = 'sleep';
            this.showScreen('sleep');
            Visuals.setDimPhase('final');
            
            // Audio continues very quietly
        } else {
            this.endJourney();
        }
    }
    
    endJourney() {
        this.state = 'title';
        this.journey.stop();
        Audio.stopAll();
        
        // Reset visuals
        Visuals.setDimPhase(0);
        Utils.removeClass(this.elements.progressIndicator, 'visible');
        
        this.showScreen('title');
    }
    
    showScreen(screenName) {
        Utils.removeClass(this.elements.titleScreen, 'active');
        Utils.removeClass(this.elements.journeyScreen, 'active');
        Utils.removeClass(this.elements.sleepScreen, 'active');
        
        const screenMap = {
            title: this.elements.titleScreen,
            journey: this.elements.journeyScreen,
            sleep: this.elements.sleepScreen
        };
        
        if (screenMap[screenName]) {
            Utils.addClass(screenMap[screenName], 'active');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new DriftGame();
});


