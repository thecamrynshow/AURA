/* ============================================
   SONGBIRD — Main Game Controller
   Whistle with the forest
   ============================================ */

class Songbird {
    constructor() {
        this.canvas = document.getElementById('forestCanvas');
        this.forest = new Forest(this.canvas);
        this.birdManager = new BirdManager();
        
        // UI Elements
        this.pitchFill = document.getElementById('pitchFill');
        this.pitchMarker = document.getElementById('pitchMarker');
        this.noteDisplay = document.getElementById('noteDisplay');
        this.challengeDisplay = document.getElementById('challengeDisplay');
        this.challengeNotes = document.getElementById('challengeNotes');
        this.whistlePrompt = document.getElementById('whistlePrompt');
        this.birdCountEl = document.getElementById('birdCount');
        
        // State
        this.isRunning = false;
        this.useMicrophone = false;
        this.currentPitch = 0;
        this.isWhistling = false;
        
        // Game progress
        this.melodiesMatched = 0;
        this.roundsCompleted = 0;
        this.maxRounds = 5;
        
        // Keyboard control
        this.keyboardNotes = {
            '1': 'C4', '2': 'D4', '3': 'E4', '4': 'F4',
            '5': 'G4', '6': 'A4', '7': 'B4', '8': 'C5'
        };
        
        this.init();
    }

    async init() {
        await songbirdAudio.init();
        this.bindEvents();
        this.bindAudioCallbacks();
        console.log('🐦 Songbird initialized — Whistle with the forest');
    }

    bindEvents() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.showScreen('mic');
            songbirdAudio.resume();
        });

        // Mic button
        document.getElementById('enableMicBtn').addEventListener('click', async () => {
            const success = await songbirdAudio.requestMicrophone();
            if (success) {
                this.useMicrophone = true;
                this.startGame();
            } else {
                // Fall back to keyboard
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
            
            const note = this.keyboardNotes[e.key];
            if (note) {
                this.handleNote(note);
                songbirdAudio.playNote(note, 0.2);
            }
        });

        // Play again
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
            this.showScreen('mic');
        });
    }

    bindAudioCallbacks() {
        songbirdAudio.onNoteChange = (note, freq) => {
            if (note) {
                this.handleNote(note);
            }
        };

        songbirdAudio.onPitchChange = (freq, normalized) => {
            this.currentPitch = normalized;
            this.updatePitchUI(normalized);
        };

        songbirdAudio.onWhistleStart = (note, freq) => {
            this.isWhistling = true;
            this.noteDisplay.classList.add('active');
        };

        songbirdAudio.onWhistleEnd = () => {
            this.isWhistling = false;
            this.noteDisplay.classList.remove('active');
            this.currentPitch = 0;
            this.updatePitchUI(0);
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
        this.roundsCompleted = 0;
        this.melodiesMatched = 0;
        
        // Show whistle prompt
        this.whistlePrompt.classList.add('visible');
        
        // Spawn first bird
        setTimeout(() => {
            this.spawnNewBird();
        }, 1000);
        
        // Start game loop
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        // Process audio if using microphone
        if (this.useMicrophone) {
            songbirdAudio.processAudio();
        }
        
        // Update
        this.forest.update();
        this.birdManager.update(this.currentPitch, this.isWhistling);
        
        // Draw
        this.forest.draw();
        this.birdManager.draw(this.forest.ctx);
        
        requestAnimationFrame(() => this.gameLoop());
    }

    spawnNewBird() {
        const bird = this.birdManager.spawnBird();
        
        // Wait for bird to arrive, then start challenge
        setTimeout(() => {
            this.startChallenge(bird);
        }, 2000);
    }

    startChallenge(bird) {
        this.birdManager.setActiveBird(bird);
        
        // Update UI
        this.challengeDisplay.classList.add('visible');
        this.challengeDisplay.querySelector('.challenge-text').textContent = 
            `The ${bird.type.name} sings:`;
        
        // Show notes
        this.challengeNotes.innerHTML = '';
        bird.type.notes.forEach(note => {
            const noteEl = document.createElement('span');
            noteEl.className = 'challenge-note';
            noteEl.textContent = '♪';
            noteEl.dataset.note = note;
            this.challengeNotes.appendChild(noteEl);
        });
        
        // Play the bird's melody
        const duration = songbirdAudio.playMelody(bird.type.notes);
        
        // Then prompt player to whistle back
        setTimeout(() => {
            this.challengeDisplay.querySelector('.challenge-text').textContent = 
                'Your turn! Match the melody:';
            this.whistlePrompt.classList.add('visible');
        }, duration + 500);
    }

    handleNote(note) {
        if (!this.birdManager.activeBird) return;
        
        const result = this.birdManager.checkNote(note);
        
        if (result === 'match') {
            // Highlight matched note
            const noteEls = this.challengeNotes.querySelectorAll('.challenge-note');
            const matchedIndex = this.birdManager.activeBird.currentNoteIndex - 1;
            if (noteEls[matchedIndex]) {
                noteEls[matchedIndex].classList.add('matched');
            }
            songbirdAudio.playMatch();
        } else if (result === 'complete') {
            // Melody complete!
            this.melodiesMatched++;
            this.roundsCompleted++;
            
            // Update bird count
            this.birdCountEl.textContent = this.birdManager.getBefriendedCount();
            
            // Hide challenge
            this.challengeDisplay.classList.remove('visible');
            this.whistlePrompt.classList.remove('visible');
            
            songbirdAudio.playSuccess();
            
            // Check if game complete
            if (this.roundsCompleted >= this.maxRounds) {
                setTimeout(() => {
                    this.endGame();
                }, 2000);
            } else {
                // Spawn next bird
                setTimeout(() => {
                    this.spawnNewBird();
                }, 2000);
            }
        }
        
        // Update note display
        this.noteDisplay.querySelector('.current-note').textContent = 
            note ? '♪' : '';
    }

    updatePitchUI(normalized) {
        const percent = normalized * 100;
        this.pitchFill.style.height = percent + '%';
        this.pitchMarker.style.bottom = percent + '%';
    }

    endGame() {
        this.isRunning = false;
        
        // Update stats
        document.getElementById('birdsFound').textContent = this.birdManager.getBefriendedCount();
        document.getElementById('melodiesMatched').textContent = this.melodiesMatched;
        
        this.showScreen('success');
    }

    resetGame() {
        this.birdManager = new BirdManager();
        this.melodiesMatched = 0;
        this.roundsCompleted = 0;
        this.birdCountEl.textContent = '0';
        this.challengeDisplay.classList.remove('visible');
        this.whistlePrompt.classList.remove('visible');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.songbird = new Songbird();
});

console.log('🐦 Songbird Main loaded');



