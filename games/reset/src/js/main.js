/**
 * Reset — Main Game Controller
 * Workplace Stress Relief
 */

// Analytics helper: never breaks gameplay if gtag is blocked.
function safeTrack(eventName, params) {
    if (typeof window.gtag === 'function') {
        try {
            window.gtag('event', eventName, params || {});
        } catch (e) {
            // swallow
        }
    }
    try {
        if (window.PneuomaDiscovery) {
            window.PneuomaDiscovery.dualTrack('reset', eventName, params || {});
        }
    } catch (e) { /* swallow */ }
}

function discoveryTrack(eventType, params) {
    try {
        if (window.PneuomaDiscovery) {
            window.PneuomaDiscovery.track('reset', eventType, params || {});
        }
    } catch (e) { /* swallow */ }
}

class ResetGame {
    constructor() {
        this.state = 'title'; // title, playing, paused, complete
        this.mode = null;
        this.duration = 0;
        this.elapsedTime = 0;
        this.startTime = 0;
        this.breathController = new BreathingController();
        this.exerciseController = new ExerciseController();
        this.soundEnabled = true;
        this.gameLoop = null;
        this.progressCircumference = 2 * Math.PI * 90; // Based on r=90

        // Music regulation GA tracking (optional; only fires when `music_context` is present).
        this.musicContext = null; // e.g. `music-breathing`
        this.gradeBand = 'all';
        this.musicGameName = 'Music Breathing';
        this.breathingMode = 'ocean-phrase';
        this.musicTrackingEnabled = false;
        this.musicStartTime = 0;
        this.musicLastReportedSec = 0;
        this.musicTimeInterval = null;
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setupControllers();
        
        // Load sound preference
        this.soundEnabled = Utils.storage.get('soundEnabled', true);
        this.elements.soundToggle.checked = this.soundEnabled;

        this.setupMusicTracking();

        discoveryTrack('page_view', {
            page_path: window.location.pathname,
            feature_used: 'reset_title'
        });
    }
    
    cacheElements() {
        this.elements = {
            // Screens
            titleScreen: Utils.$('titleScreen'),
            gameScreen: Utils.$('gameScreen'),
            endScreen: Utils.$('endScreen'),
            pauseOverlay: Utils.$('pauseOverlay'),
            
            // Title elements
            modeCards: Utils.$$('.mode-card'),
            soundToggle: Utils.$('soundToggle'),
            
            // Game elements
            timerDisplay: Utils.$('timerDisplay'),
            progressFill: Utils.$('progressFill'),
            breathCircle: Utils.$('breathCircle'),
            breathText: Utils.$('breathText'),
            instruction: Utils.$('instruction'),
            subInstruction: Utils.$('subInstruction'),
            phaseDots: Utils.$$('.phase-dot'),
            phaseName: Utils.$('phaseName'),
            pauseBtn: Utils.$('pauseBtn'),
            
            // Overlay elements
            resumeBtn: Utils.$('resumeBtn'),
            quitBtn: Utils.$('quitBtn'),
            
            // End elements
            endMessage: Utils.$('endMessage'),
            sessionDuration: Utils.$('sessionDuration'),
            breathCount: Utils.$('breathCount'),
            anotherBtn: Utils.$('anotherBtn')
        };
    }
    
    bindEvents() {
        // Mode selection
        this.elements.modeCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectMode(card.dataset.mode, parseInt(card.dataset.duration));
            });
        });
        
        // Sound toggle
        this.elements.soundToggle.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            Utils.storage.set('soundEnabled', this.soundEnabled);
            Audio.setEnabled(this.soundEnabled);
        });
        
        // Pause/Resume
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.resumeBtn.addEventListener('click', () => this.resume());
        this.elements.quitBtn.addEventListener('click', () => this.quit());
        
        // Play again
        this.elements.anotherBtn.addEventListener('click', () => this.reset());
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'playing') this.pause();
                else if (this.state === 'paused') this.resume();
            }
            if (e.code === 'Escape') {
                if (this.state === 'playing' || this.state === 'paused') {
                    this.quit();
                }
            }
        });
    }
    
    setupControllers() {
        // Breathing callbacks
        this.breathController.onPhaseChange = (phase, index) => {
            this.updateBreathVisual(phase);
        };
        
        this.breathController.onBreathComplete = (count) => {
            // Track breath count
        };
        
        // Exercise callbacks
        this.exerciseController.onPhaseChange = (phase, index, total) => {
            this.updatePhaseIndicator(index, total, phase.name);
            Audio.playChime(440 + index * 50);
        };
        
        this.exerciseController.onInstructionChange = (instruction, phase) => {
            this.elements.instruction.textContent = instruction;
            if (phase.exercise) {
                this.elements.subInstruction.textContent = `Exercise: ${phase.exercise}`;
            } else {
                this.elements.subInstruction.textContent = '';
            }
        };
        
        this.exerciseController.onComplete = () => {
            this.complete();
        };
    }

    setupMusicTracking() {
        try {
            const params = new URLSearchParams(window.location.search || '');
            this.musicContext = params.get('music_context');
            this.gradeBand =
                params.get('grade_band') ||
                params.get('music_grade_band') ||
                params.get('gradeBand') ||
                'all';

            // Optional: phrase/breathing label for analytics context.
            this.breathingMode =
                params.get('breathing_mode') ||
                params.get('breathingMode') ||
                this.breathingMode ||
                'ocean-phrase';

            this.musicTrackingEnabled = this.musicContext === 'music-breathing';

            // If embedded for the music-breathing flow, optionally start immediately.
            const autoStart =
                params.get('auto_start') ||
                params.get('autoStart') ||
                params.get('auto-start');
            if (autoStart === '1' && this.musicTrackingEnabled) {
                const resetModeMap = {
                    'ocean-phrase': 'quick',
                    'choir-breath': 'eyes',
                    'wind-breath': 'body',
                    'slow-phrase': 'full',
                    'focus-phrase': 'quick'
                };

                const mappedMode = resetModeMap[this.breathingMode] || 'quick';
                const card = this.elements?.modeCards?.find(
                    c => c.dataset && c.dataset.mode === mappedMode
                );
                const durationSec = card ? parseInt(card.dataset.duration, 10) : 120;

                // Fire-and-forget: we don't want to block page load.
                this.selectMode(mappedMode, durationSec).catch(() => {});
            }
        } catch (e) {
            this.musicTrackingEnabled = false;
        }
    }

    sendMusicTimeSpent(reason) {
        if (!this.musicTrackingEnabled) return;
        const sec = this.musicStartTime
            ? Math.max(0, Math.round((Date.now() - this.musicStartTime) / 1000))
            : 0;

        if (sec <= 0 || sec <= this.musicLastReportedSec) return;
        this.musicLastReportedSec = sec;

        safeTrack('music_game_time_spent', {
            game_name: this.musicGameName,
            grade_band: this.gradeBand,
            engagement_time: sec,
            engagement_time_sec: sec,
            reason: reason || 'interval',
            breathing_mode: this.breathingMode
        });
    }

    stopMusicTimeTracking() {
        if (this.musicTimeInterval) {
            clearInterval(this.musicTimeInterval);
            this.musicTimeInterval = null;
        }
    }
    
    async selectMode(mode, duration) {
        this.mode = mode;
        this.duration = duration * 1000; // Convert to ms
        
        // Initialize audio on first interaction
        await Audio.init();
        Audio.setEnabled(this.soundEnabled);
        Audio.playClick();
        
        this.startGame();
    }
    
    startGame() {
        this.state = 'playing';
        this.elapsedTime = 0;
        this.startTime = Date.now();
        
        // Show game screen
        this.showScreen('game');
        Utils.addClass(this.elements.timerDisplay, 'visible');

        if (this.musicTrackingEnabled) {
            this.musicStartTime = Date.now();
            this.musicLastReportedSec = 0;
            this.stopMusicTimeTracking();

            const durationSec = this.duration ? Math.max(0, Math.round(this.duration / 1000)) : 0;

            safeTrack('breathing_session_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                breathing_mode: this.breathingMode,
                duration: durationSec,
                duration_sec: durationSec
            });

            safeTrack('music_game_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand
            });

            this.musicTimeInterval = setInterval(() => {
                this.sendMusicTimeSpent('interval');
            }, 30000);
        }
        
        // Setup controllers
        const exercise = Exercises[this.mode];
        this.exerciseController.setExercise(this.mode);
        this.breathController.setPattern(exercise.breathPattern);
        
        // Setup progress ring
        this.elements.progressFill.style.strokeDasharray = this.progressCircumference;
        this.elements.progressFill.style.strokeDashoffset = 0;
        
        // Setup phase dots
        this.setupPhaseDots(exercise.phases.length);
        
        // Start
        Audio.startAmbient();
        this.exerciseController.start();
        this.breathController.start();
        
        // Start game loop
        this.gameLoop = setInterval(() => this.update(), 100);

        discoveryTrack('session_started', {
            feature_used: 'reset_session',
            mode: this.mode,
            duration_sec: Math.round(this.duration / 1000)
        });
        discoveryTrack('demo_started', {
            feature_used: 'reset_demo',
            mode: this.mode
        });
    }
    
    setupPhaseDots(count) {
        const container = this.elements.phaseDots[0].parentElement;
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = 'phase-dot' + (i === 0 ? ' active' : '');
            container.appendChild(dot);
        }
    }
    
    update() {
        if (this.state !== 'playing') return;
        
        this.elapsedTime = Date.now() - this.startTime;
        
        // Update timer
        const remaining = Math.max(0, this.duration - this.elapsedTime);
        this.elements.timerDisplay.querySelector('.timer-value').textContent = 
            Utils.formatTime(remaining / 1000);
        
        // Update progress ring
        const progress = this.elapsedTime / this.duration;
        const offset = this.progressCircumference * (1 - progress);
        this.elements.progressFill.style.strokeDashoffset = offset;
        
        // Check completion
        if (this.elapsedTime >= this.duration) {
            this.complete();
        }
    }
    
    updateBreathVisual(phase) {
        const circle = this.elements.breathCircle;
        const text = this.elements.breathText;
        
        // Remove all states
        Utils.removeClass(circle, 'inhale');
        Utils.removeClass(circle, 'hold');
        Utils.removeClass(circle, 'exhale');
        
        // Add current state
        Utils.addClass(circle, phase.action);
        text.textContent = phase.text;
        
        // Set transition duration based on phase duration
        circle.style.transitionDuration = `${phase.duration}ms`;
    }
    
    updatePhaseIndicator(index, total, name) {
        // Update dots
        const dots = Utils.$$('.phase-dot');
        dots.forEach((dot, i) => {
            Utils.removeClass(dot, 'active');
            Utils.removeClass(dot, 'complete');
            
            if (i < index) {
                Utils.addClass(dot, 'complete');
            } else if (i === index) {
                Utils.addClass(dot, 'active');
            }
        });
        
        // Update name
        this.elements.phaseName.textContent = name;
    }
    
    pause() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        this.breathController.pause();
        this.exerciseController.pause();
        
        Utils.addClass(this.elements.pauseOverlay, 'active');
        Audio.playClick();
    }
    
    resume() {
        if (this.state !== 'paused') return;
        
        this.state = 'playing';
        this.startTime = Date.now() - this.elapsedTime; // Adjust start time
        
        this.breathController.resume();
        this.exerciseController.resume();
        
        Utils.removeClass(this.elements.pauseOverlay, 'active');
        Audio.playClick();
    }
    
    quit() {
        this.stopAll();
        this.showScreen('title');
        Utils.removeClass(this.elements.pauseOverlay, 'active');
        Utils.removeClass(this.elements.timerDisplay, 'visible');
    }
    
    complete() {
        this.stopAll();
        
        // Calculate stats
        const duration = Math.round(this.elapsedTime / 1000);
        const breaths = this.breathController.getBreathCount();
        
        // Update end screen
        this.elements.sessionDuration.textContent = Utils.formatTime(duration);
        this.elements.breathCount.textContent = breaths;
        
        // Set completion message based on mode
        const messages = {
            quick: "Quick reset complete. Back to it with fresh focus.",
            eyes: "Eyes refreshed. The screen won't feel so harsh now.",
            body: "Tension released. Your body thanks you.",
            full: "Full reset achieved. You've given yourself a gift."
        };
        this.elements.endMessage.textContent = messages[this.mode] || "Reset complete.";

        discoveryTrack('first_value_reached', {
            first_value_key: 'reset_complete',
            feature_used: 'reset_complete',
            mode: this.mode,
            duration_sec: duration,
            breath_count: breaths
        });

        if (this.musicTrackingEnabled) {
            this.stopMusicTimeTracking();
            const durationSec = duration;
            safeTrack('breathing_session_complete', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                breathing_mode: this.breathingMode,
                duration: durationSec,
                duration_sec: durationSec
            });

            safeTrack('music_game_complete', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                engagement_time: durationSec,
                engagement_time_sec: durationSec
            });

            // Final time spent event.
            safeTrack('music_game_time_spent', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                engagement_time: durationSec,
                engagement_time_sec: durationSec,
                reason: 'complete',
                breathing_mode: this.breathingMode
            });
        }

        Audio.playComplete();
        this.showScreen('end');
        Utils.removeClass(this.elements.timerDisplay, 'visible');
    }
    
    stopAll() {
        this.state = 'complete';

        this.stopMusicTimeTracking();
        
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.breathController.stop();
        this.exerciseController.stop();
        Audio.stopAmbient();
    }
    
    reset() {
        this.state = 'title';
        this.mode = null;
        this.elapsedTime = 0;
        
        this.showScreen('title');

        this.stopMusicTimeTracking();
    }
    
    showScreen(screenName) {
        // Hide all screens
        Utils.removeClass(this.elements.titleScreen, 'active');
        Utils.removeClass(this.elements.gameScreen, 'active');
        Utils.removeClass(this.elements.endScreen, 'active');
        
        // Show target screen
        const screenMap = {
            title: this.elements.titleScreen,
            game: this.elements.gameScreen,
            end: this.elements.endScreen
        };
        
        if (screenMap[screenName]) {
            Utils.addClass(screenMap[screenName], 'active');
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ResetGame();
});



