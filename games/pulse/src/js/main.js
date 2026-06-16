/* ============================================
   Pulse — Main Game Controller
   A PNEUOMA Game
   ============================================ */

// Analytics helper: never breaks gameplay if gtag is blocked.
function safeTrack(eventName, params) {
    if (typeof window.gtag !== 'function') return;
    try {
        window.gtag('event', eventName, params || {});
    } catch (e) {
        // swallow
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.world = null;
        this.rhythmEngine = null;
        this.breathDetector = null;
        this.audioEngine = null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.sessionStartTime = 0;
        this.sessionDuration = 5 * 60 * 1000; // 5 minute session

        // Music regulation GA tracking (optional; only fires when `music_context` is present).
        this.musicContext = null;
        this.gradeBand = 'all';
        this.musicGameName = 'Rhythm Regulation';
        this.regulationMode = 'match';
        this.musicTrackingEnabled = false;
        this.musicStartTime = 0;
        this.musicLastReportedSec = 0;
        this.musicTimeInterval = null;
        
        // Screens
        this.screens = {
            title: document.getElementById('title-screen'),
            game: document.getElementById('game-screen'),
            complete: document.getElementById('complete-screen')
        };
        
        // HUD elements
        this.hud = {
            flowFill: document.getElementById('flow-fill'),
            bpmValue: document.getElementById('bpm-value'),
            streakValue: document.getElementById('streak-value'),
            breathText: document.getElementById('breath-text'),
            comboDisplay: document.getElementById('combo-display'),
            sessionTime: document.getElementById('session-time')
        };
        
        // Stats elements
        this.stats = {
            duration: document.getElementById('stat-duration'),
            accuracy: document.getElementById('stat-accuracy'),
            bestStreak: document.getElementById('stat-best-streak'),
            flow: document.getElementById('stat-flow')
        };
        
        // Insights for end screen
        this.insights = [
            '"When breath and rhythm align, the mind finds focus."',
            '"Each beat is an anchor. Each breath, a return."',
            '"Flow is not found. It is built, one breath at a time."',
            '"The rhythm was always there. You just learned to listen."',
            '"In the space between beats, presence emerges."',
            '"Your nervous system remembers this calm."'
        ];
        
        this.peakFlow = 0;
        this.breathPhaseLabel = 'Breathe in...';
        
        this.init();
    }

    init() {
        // Button handlers
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.startGame());
        
        // Resize handler
        window.addEventListener('resize', () => {
            if (this.world) {
                this.world.resize();
            }
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Pulse — A PNEUOMA Game — initialized');
    }

    setupEventListeners() {
        GameEvents.on('beatHit', (data) => {
            this.onBeatHit(data);
        });
        
        GameEvents.on('beatMissed', (data) => {
            this.onBeatMissed(data);
        });
        
        GameEvents.on('beatSpawned', (data) => {
            if (this.audioEngine) {
                this.audioEngine.playBeat('pulse', 0.3 + this.rhythmEngine.getFlow() * 0.3);
            }
        });
    }

    async startGame() {
        // Initialize components
        this.world = new World(this.canvas);
        this.rhythmEngine = new RhythmEngine();
        this.breathDetector = new BreathDetector();
        this.audioEngine = new AudioEngine();
        
        // Initialize audio systems
        const micInitialized = await this.breathDetector.init();
        if (!micInitialized) {
            alert('Microphone access is required to play Pulse. Please enable microphone access and try again.');
            return;
        }
        
        await this.audioEngine.init();
        
        // Show game screen
        this.showScreen('game');

        // Music regulation tracking (only for the cluster wrapper/landing pages).
        try {
            const params = new URLSearchParams(window.location.search || '');
            this.musicContext = params.get('music_context');
            this.gradeBand =
                params.get('grade_band') ||
                params.get('music_grade_band') ||
                params.get('gradeBand') ||
                'all';
            this.regulationMode =
                params.get('regulation_mode') ||
                params.get('regulationMode') ||
                'match';

            this.musicTrackingEnabled = this.musicContext === 'rhythm-regulation';
        } catch (e) {
            this.musicTrackingEnabled = false;
        }

        // Adjust regulation feel based on classroom mode preset.
        if (this.rhythmEngine) {
            let targetBpm = 65;
            if (this.regulationMode === 'calm') targetBpm = 58;
            else if (this.regulationMode === 'focus') targetBpm = 72;
            else if (this.regulationMode === 'regulation') targetBpm = 70;
            else targetBpm = 65;

            this.rhythmEngine.bpm = targetBpm;
            this.rhythmEngine.beatInterval = 60000 / targetBpm;

            // Shorter calm sessions, slightly longer regulation sessions.
            if (this.regulationMode === 'calm') this.sessionDuration = 3 * 60 * 1000;
            else if (this.regulationMode === 'regulation') this.sessionDuration = 4 * 60 * 1000;
            else this.sessionDuration = 5 * 60 * 1000;
        }

        const safeTrack = (eventName, params) => {
            if (typeof window.gtag !== 'function') return;
            try {
                window.gtag('event', eventName, params || {});
            } catch (e) { /* swallow */ }
        };

        if (this.musicTrackingEnabled) {
            this.musicStartTime = Date.now();
            this.musicLastReportedSec = 0;
            safeTrack('rhythm_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                regulation_mode_selected: this.regulationMode
            });

            safeTrack('regulation_mode_selected', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                regulation_mode_selected: this.regulationMode
            });

            safeTrack('music_game_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand
            });

            this.musicTimeInterval = setInterval(() => {
                const sec = Math.max(0, Math.round((Date.now() - this.musicStartTime) / 1000));
                if (!sec || sec <= this.musicLastReportedSec) return;
                this.musicLastReportedSec = sec;

                safeTrack('music_game_time_spent', {
                    game_name: this.musicGameName,
                    grade_band: this.gradeBand,
                    engagement_time: sec,
                    engagement_time_sec: sec
                });
            }, 30000);
        }
        
        // Start rhythm engine
        this.rhythmEngine.start();
        
        // Start game loop
        this.isRunning = true;
        this.sessionStartTime = Date.now();
        this.peakFlow = 0;
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        // Update breath detection
        this.breathDetector.update();
        const breathLevel = this.breathDetector.getBreathLevel();
        const breathPhase = this.breathDetector.getBreathPhase();
        const isBreathing = this.breathDetector.isBreathing();
        
        // Update rhythm engine
        this.rhythmEngine.update(
            this.world.getCenterX(),
            this.world.getCenterY(),
            breathPhase,
            isBreathing
        );
        
        // Update world
        this.world.update(deltaTime, this.rhythmEngine, breathLevel);
        
        // Update audio ambient level
        this.audioEngine.setAmbientLevel(this.rhythmEngine.getFlow());
        
        // Track peak flow
        const currentFlow = this.rhythmEngine.getFlow();
        if (currentFlow > this.peakFlow) {
            this.peakFlow = currentFlow;
        }
        
        // Update breath guide text
        if (breathPhase < 0.4) {
            this.breathPhaseLabel = 'Breathe in...';
        } else if (breathPhase < 0.5) {
            this.breathPhaseLabel = 'Hold...';
        } else {
            this.breathPhaseLabel = 'Breathe out...';
        }
        
        // Update HUD
        this.updateHUD();
        
        // Check session end
        const elapsed = Date.now() - this.sessionStartTime;
        if (elapsed >= this.sessionDuration) {
            this.endSession();
        }
    }

    render() {
        this.world.render(this.rhythmEngine, this.breathDetector.getBreathLevel());
    }

    updateHUD() {
        const flow = this.rhythmEngine.getFlow();
        const bpm = this.rhythmEngine.getBPM();
        const streak = this.rhythmEngine.getStreak();
        const elapsed = (Date.now() - this.sessionStartTime) / 1000;
        
        this.hud.flowFill.style.width = `${flow * 100}%`;
        this.hud.bpmValue.textContent = bpm;
        this.hud.streakValue.textContent = streak;
        this.hud.breathText.textContent = this.breathPhaseLabel;
        this.hud.sessionTime.textContent = Utils.formatTime(elapsed);
    }

    onBeatHit(data) {
        const { accuracy, beat, streak, flow } = data;
        
        // Add hit effect
        this.world.addHitEffect(beat.x, beat.y, accuracy);
        
        // Play hit sound
        this.audioEngine.playBeat('hit', 0.5 + flow * 0.3);
        
        // Show combo text
        this.showComboText(accuracy, streak);
        
        // Play chord on streak milestones
        if (streak > 0 && streak % 5 === 0) {
            this.audioEngine.playFlowChord(flow);
        }
    }

    onBeatMissed(data) {
        // Play miss sound
        this.audioEngine.playBeat('miss', 0.3);
    }

    showComboText(accuracy, streak) {
        const comboDisplay = this.hud.comboDisplay;
        const comboText = comboDisplay.querySelector('.combo-text');
        
        let text = '';
        switch (accuracy) {
            case 'perfect':
                text = streak >= 5 ? `Perfect! ×${streak}` : 'Perfect!';
                break;
            case 'good':
                text = streak >= 5 ? `Good! ×${streak}` : 'Good!';
                break;
            case 'ok':
                text = 'OK';
                break;
        }
        
        comboText.textContent = text;
        comboDisplay.classList.remove('hidden');
        
        // Reset animation
        comboDisplay.style.animation = 'none';
        comboDisplay.offsetHeight; // Trigger reflow
        comboDisplay.style.animation = '';
        
        setTimeout(() => {
            comboDisplay.classList.add('hidden');
        }, 500);
    }

    endSession() {
        this.isRunning = false;
        
        // Stop audio
        this.breathDetector.stop();
        this.audioEngine.stop();
        
        // Calculate final stats
        const duration = (Date.now() - this.sessionStartTime) / 1000;
        const accuracy = this.rhythmEngine.getAccuracyPercent();
        const bestStreak = this.rhythmEngine.getBestStreak();
        const peakFlowPercent = Math.round(this.peakFlow * 100);
        
        // Update stats display
        this.stats.duration.textContent = Utils.formatTime(duration);
        this.stats.accuracy.textContent = `${accuracy}%`;
        this.stats.bestStreak.textContent = bestStreak;
        this.stats.flow.textContent = `${peakFlowPercent}%`;
        
        // Set insight
        const insightEl = document.getElementById('session-insight');
        const randomInsight = this.insights[Math.floor(Math.random() * this.insights.length)];
        insightEl.textContent = randomInsight;
        
        // Show complete screen
        this.showScreen('complete');

        if (this.musicTrackingEnabled) {
            if (this.musicTimeInterval) clearInterval(this.musicTimeInterval);
            const engagementSec = Math.max(0, Math.round(duration));

            safeTrack('rhythm_complete', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                duration_sec: engagementSec,
                accuracy_score: accuracy,
                best_streak: bestStreak,
                regulation_mode_selected: this.regulationMode
            });

            safeTrack('music_game_complete', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                engagement_time: engagementSec,
                engagement_time_sec: engagementSec
            });

            safeTrack('music_game_time_spent', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand,
                engagement_time: engagementSec,
                engagement_time_sec: engagementSec,
                reason: 'complete'
            });
        }
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
    }
}

// Initialize game on load
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});




