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
        
        this.init();
    }

    async init() {
        await solfegeAudio.init();
        this.bindEvents();
        this.bindExerciseCallbacks();
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
        };

        this.exercises.onNoteWrong = (sung, target) => {
            const targetSolfege = SOLFEGE[target]?.name || target;
            this.showFeedback(`Try ${targetSolfege}`, '🎵', true);
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
            }, 1000);
        };
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
        
        // Show exercise name
        this.targetInstructionEl.textContent = exercise.name;
        
        // Play the target notes first so they can hear them
        this.targetInstructionEl.textContent = 'Listen...';
        this.targetSolfegeEl.textContent = '🎵';
        
        // Play the scale/melody
        let delay = 0;
        exercise.notes.forEach((note, i) => {
            setTimeout(() => {
                solfegeAudio.playNote(note, 0.4);
                this.piano.lightKey(note);
                setTimeout(() => this.piano.clearKey(note), 350);
            }, delay);
            delay += 400;
        });
        
        // After playing, show first target
        setTimeout(() => {
            this.targetInstructionEl.textContent = 'Sing this note:';
            this.updateTargetDisplay();
        }, delay + 500);
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
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.solfege = new Solfege();
});

console.log('🎼 Solfege Main loaded');

