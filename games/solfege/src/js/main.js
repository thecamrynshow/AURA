/* ============================================
   SOLFÈGE — Main Game Controller
   Do Re Mi Fa Sol La Ti Do
   ============================================ */

class Solfege {
    constructor() {
        this.piano = new Piano(document.getElementById('piano'));
        this.exercises = new ExerciseManager();
        
        // UI Elements
        this.targetSolfegeEl = document.getElementById('targetSolfege');
        this.targetInstructionEl = document.getElementById('targetInstruction');
        this.yourSolfegeEl = document.getElementById('yourSolfege');
        this.progressDotsEl = document.getElementById('progressDots');
        this.progressLabelEl = document.getElementById('progressLabel');
        this.feedbackEl = document.getElementById('feedback');
        this.scoreValueEl = document.getElementById('scoreValue');
        
        // State
        this.isRunning = false;
        this.useMicrophone = false;
        this.score = 0;
        this.lastDetectedNote = null;
        this.noteHoldTime = 0;
        this.noteHoldRequired = 200; // ms to hold note to count (reduced for responsiveness)

        // Music regulation GA tracking (only when `music_context` is present).
        this.musicContext = null; // e.g. `solfege-trainer` | `ear-training`
        this.gradeBand = 'all';
        this.musicGameName = 'Solfège Trainer';
        this.musicTrackingEnabled = false;
        this.musicStartTime = 0;
        this.musicLastReportedSec = 0;
        this.musicTimeInterval = null;
        
        this.init();
    }

    async init() {
        await solfegeAudio.init();
        this.bindEvents();
        this.bindExerciseCallbacks();
        this.setupMusicTracking();
        console.log('🎼 Solfège initialized — Do Re Mi Fa Sol La Ti Do');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('mic');
            solfegeAudio.resume();
        });

        // Mic button
        document.getElementById('enableMicBtn').addEventListener('click', async () => {
            const success = await solfegeAudio.requestMicrophone();
            if (success) {
                this.useMicrophone = true;
                this.startGame();
            } else {
                this.useMicrophone = false;
                this.startGame();
            }
        });

        // Keyboard button
        document.getElementById('useKeyboardBtn').addEventListener('click', () => {
            this.useMicrophone = false;
            this.startGame();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            const note = KEYBOARD_MAP[e.key.toLowerCase()];
            if (note) {
                // Only count keyboard input if NOT using microphone
                // Piano keys are just for reference when mic is enabled
                if (!this.useMicrophone) {
                    this.handleNoteInput(note);
                }
                solfegeAudio.playNote(note);
                this.piano.lightKey(note);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (!this.isRunning) return;
            
            const note = KEYBOARD_MAP[e.key.toLowerCase()];
            if (note) {
                this.piano.clearKey(note);
            }
        });

        // Piano click/touch
        document.getElementById('piano').addEventListener('click', (e) => {
            if (!this.isRunning) return;
            
            const key = e.target.closest('.piano-key');
            if (key && key.dataset.note) {
                const note = key.dataset.note;
                // Only count piano click if NOT using microphone
                // Piano is just for reference/hearing the note when mic is enabled
                if (!this.useMicrophone) {
                    this.handleNoteInput(note);
                }
                solfegeAudio.playNote(note);
                this.piano.lightKey(note);
                
                setTimeout(() => this.piano.clearKey(note), 200);
            }
        });

        // Play again
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.showScreen('mic');
        });
    }

    bindExerciseCallbacks() {
        this.exercises.onNoteMatch = (sung, target) => {
            this.score += 10;
            this.scoreValueEl.textContent = this.score;
            this.showFeedback('Perfect!', '✨', false);
            solfegeAudio.playMatch();
            
            // Update target display
            this.updateTargetDisplay();

            if (this.musicTrackingEnabled) {
                this.safeTrack('note_correct', {
                    game_name: this.musicGameName,
                    grade_band: this.gradeBand,
                    sung: sung,
                    target: target
                });
            }
        };

        this.exercises.onNoteWrong = (sung, target) => {
            const targetSolfege = SOLFEGE[target]?.name || target;
            this.showFeedback(`Try ${targetSolfege}`, '🎵', true);

            if (this.musicTrackingEnabled) {
                this.safeTrack('note_incorrect', {
                    game_name: this.musicGameName,
                    grade_band: this.gradeBand,
                    sung: sung,
                    target: target
                });
            }
        };

        this.exercises.onExerciseComplete = (index) => {
            this.showFeedback('Great job!', '🌟', false);
            this.updateProgressDots();
            
            // Brief pause before next exercise
            setTimeout(() => {
                if (this.exercises.currentExerciseIndex < this.exercises.exercises.length) {
                    this.startExercise();
                }
            }, 1500);
        };

        this.exercises.onAllComplete = (stats) => {
            document.getElementById('notesHit').textContent = stats.correct;
            document.getElementById('accuracy').textContent = stats.accuracy + '%';
            
            setTimeout(() => {
                this.isRunning = false;
                this.showScreen('complete');
                solfegeAudio.playSuccess();

                if (this.musicTrackingEnabled) {
                    this.stopMusicTimeTracking();
                    const engagementSec = this.getMusicEngagementSeconds();

                    this.safeTrack('session_complete', {
                        game_name: this.musicGameName,
                        grade_band: this.gradeBand,
                        correct: stats.correct,
                        total: stats.total,
                        accuracy_score: stats.accuracy,
                        engagement_time_sec: engagementSec
                    });

                    // Ear-training uses the same underlying exercise set, but emits
                    // different labeled events for analytics/aggregation.
                    if (this.musicContext === 'ear-training') {
                        this.safeTrack('exercise_complete', {
                            game_name: 'Ear Training',
                            grade_band: this.gradeBand,
                            accuracy_score: stats.accuracy
                        });
                    }

                    this.safeTrack('music_game_complete', {
                        game_name: this.musicGameName,
                        grade_band: this.gradeBand,
                        engagement_time: engagementSec,
                        engagement_time_sec: engagementSec
                    });

                    this.safeTrack('music_game_time_spent', {
                        game_name: this.musicGameName,
                        grade_band: this.gradeBand,
                        engagement_time: engagementSec,
                        engagement_time_sec: engagementSec,
                        reason: 'complete'
                    });
                }
            }, 1000);
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

            this.musicTrackingEnabled = !!this.musicContext;

            if (this.musicContext === 'ear-training') this.musicGameName = 'Ear Training';
            else if (this.musicContext === 'solfege-trainer') this.musicGameName = 'Solfège Trainer';
        } catch (e) {
            this.musicTrackingEnabled = false;
        }
    }

    safeTrack(eventName, params) {
        if (typeof window.gtag !== 'function') return;
        try {
            window.gtag('event', eventName, params || {});
        } catch (e) {
            // Never break gameplay on analytics failures.
        }
    }

    getMusicEngagementSeconds() {
        if (!this.musicStartTime) return 0;
        return Math.max(0, Math.round((Date.now() - this.musicStartTime) / 1000));
    }

    sendMusicTimeSpent(reason) {
        const sec = this.getMusicEngagementSeconds();
        if (!this.musicTrackingEnabled) return;
        if (sec <= 0 || sec <= this.musicLastReportedSec) return;
        this.musicLastReportedSec = sec;

        this.safeTrack('music_game_time_spent', {
            game_name: this.musicGameName,
            grade_band: this.gradeBand,
            engagement_time: sec,
            engagement_time_sec: sec,
            reason: reason || 'interval'
        });
    }

    stopMusicTimeTracking() {
        if (this.musicTimeInterval) {
            clearInterval(this.musicTimeInterval);
            this.musicTimeInterval = null;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId + 'Screen').classList.add('active');
    }

    startGame() {
        this.showScreen('game');
        this.isRunning = true;

        if (this.musicTrackingEnabled) {
            this.musicStartTime = Date.now();
            this.musicLastReportedSec = 0;
            this.stopMusicTimeTracking();

            // Cluster-required events.
            this.safeTrack('session_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand
            });

            if (this.musicContext === 'ear-training') {
                this.safeTrack('exercise_start', {
                    game_name: 'Ear Training',
                    grade_band: this.gradeBand
                });
            }

            this.safeTrack('music_game_start', {
                game_name: this.musicGameName,
                grade_band: this.gradeBand
            });

            this.musicTimeInterval = setInterval(
                () => this.sendMusicTimeSpent('interval'),
                30000
            );
        }
        
        // Initialize progress dots
        this.initProgressDots();
        
        // Start first exercise after brief intro
        setTimeout(() => {
            this.startExercise();
        }, 500);
        
        // Start game loop
        this.gameLoop();
    }

    initProgressDots() {
        this.progressDotsEl.innerHTML = '';
        this.exercises.exercises.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'progress-dot' + (i === 0 ? ' current' : '');
            this.progressDotsEl.appendChild(dot);
        });
    }

    updateProgressDots() {
        const dots = this.progressDotsEl.querySelectorAll('.progress-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('current', 'complete');
            if (i < this.exercises.currentExerciseIndex) {
                dot.classList.add('complete');
            } else if (i === this.exercises.currentExerciseIndex) {
                dot.classList.add('current');
            }
        });
        
        this.progressLabelEl.textContent = 
            `Exercise ${this.exercises.currentExerciseIndex + 1} of ${this.exercises.exercises.length}`;
    }

    startExercise() {
        const exercise = this.exercises.getCurrentExercise();
        if (!exercise) return;
        
        // Show exercise name - NO automatic playback (interferes with mic)
        this.targetInstructionEl.textContent = exercise.name;
        
        // Show the notes visually without playing them
        // User can tap piano keys to hear notes if needed
        this.targetSolfegeEl.textContent = '🎵';
        
        // Brief visual preview - light up keys without sound
        let delay = 0;
        exercise.notes.forEach((note, i) => {
            setTimeout(() => {
                this.piano.lightKey(note);
                setTimeout(() => this.piano.clearKey(note), 300);
            }, delay);
            delay += 350;
        });
        
        // After visual preview, show first target
        setTimeout(() => {
            this.targetInstructionEl.textContent = 'Sing this note:';
            this.updateTargetDisplay();
        }, delay + 300);
    }

    updateTargetDisplay() {
        const solfege = this.exercises.getCurrentSolfege();
        const note = this.exercises.getCurrentNote();
        
        if (solfege && SOLFEGE[note]) {
            this.targetSolfegeEl.textContent = solfege;
            this.targetSolfegeEl.style.color = SOLFEGE[note].color;
            
            // Highlight target key on piano
            this.piano.lightKey(note);
            setTimeout(() => {
                this.piano.clearAll();
            }, 300);
        }
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        // Process audio if using microphone
        if (this.useMicrophone) {
            const solfegeData = solfegeAudio.processAudio();
            
            if (solfegeData) {
                // Update your pitch display
                this.yourSolfegeEl.textContent = solfegeData.solfege;
                this.yourSolfegeEl.style.color = solfegeData.color;
                
                // Light up corresponding key
                this.piano.lightBySolfege(solfegeData.solfege);
                
                // Handle the note
                if (solfegeData.note !== this.lastDetectedNote) {
                    this.lastDetectedNote = solfegeData.note;
                    this.noteHoldTime = Date.now();
                } else if (Date.now() - this.noteHoldTime > this.noteHoldRequired) {
                    // Note held long enough, count it
                    this.handleNoteInput(solfegeData.note);
                    this.noteHoldTime = Date.now() + 1000; // Prevent immediate re-trigger
                }
            } else {
                this.yourSolfegeEl.textContent = '—';
                this.yourSolfegeEl.style.color = '';
                this.piano.clearAll();
                this.lastDetectedNote = null;
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    handleNoteInput(note) {
        this.exercises.checkNote(note);
    }

    showFeedback(text, icon, isError) {
        const feedbackText = this.feedbackEl.querySelector('.feedback-text');
        const feedbackIcon = this.feedbackEl.querySelector('.feedback-icon');
        
        feedbackText.textContent = text;
        feedbackIcon.textContent = icon;
        
        this.feedbackEl.classList.toggle('error', isError);
        this.feedbackEl.classList.add('visible');
        
        setTimeout(() => {
            this.feedbackEl.classList.remove('visible');
        }, 1000);
    }

    resetGame() {
        this.exercises.reset();
        this.score = 0;
        this.scoreValueEl.textContent = '0';
        this.yourSolfegeEl.textContent = '—';
        this.yourSolfegeEl.style.color = '';
        this.piano.clearAll();

        this.stopMusicTimeTracking();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.solfege = new Solfege();
});

console.log('🎼 Solfege Main loaded');

