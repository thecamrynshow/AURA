/* ============================================
   SOLFÈGE — Exercise System
   Scale and melody challenges
   ============================================ */

class ExerciseManager {
    constructor() {
        this.exercises = [];
        this.currentExerciseIndex = 0;
        this.currentNoteIndex = 0;
        
        // Stats
        this.totalNotes = 0;
        this.correctNotes = 0;
        
        // Callbacks
        this.onNoteMatch = null;
        this.onNoteWrong = null;
        this.onExerciseComplete = null;
        this.onAllComplete = null;
        
        this.generateExercises();
    }

    generateExercises() {
        this.exercises = [
            // === WARM UP ===
            // Exercise 1: Ascending scale
            {
                name: 'Ascending Scale',
                notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
            },
            // Exercise 2: Descending scale
            {
                name: 'Descending Scale',
                notes: ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4']
            },
            // Exercise 3: Simple melody (Do Mi Sol)
            {
                name: 'Do Mi Sol',
                notes: ['C4', 'E4', 'G4', 'E4', 'C4']
            },
            
            // === SONGS ===
            // Exercise 4: Twinkle Twinkle Little Star (first verse)
            {
                name: '⭐ Twinkle Twinkle',
                notes: [
                    'C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4',  // Twinkle twinkle little star
                    'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'   // How I wonder what you are
                ]
            },
            // Exercise 5: Mary Had a Little Lamb
            {
                name: '🐑 Mary Had a Little Lamb',
                notes: [
                    'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4',  // Mary had a little lamb
                    'D4', 'D4', 'D4',                          // Little lamb
                    'E4', 'G4', 'G4'                           // Little lamb
                ]
            }
        ];

        // Music regulation presets (only when explicitly embedded with query params).
        // Default /games/solfege/ behavior stays unchanged.
        try {
            const params = new URLSearchParams(window.location.search || '');
            const musicContext = params.get('music_context');
            const mode = params.get('music_solfege_mode');
            const earMode = params.get('music_ear_mode') || params.get('ear_mode');

            let solfegeMode = mode;
            if (musicContext === 'ear-training' && !solfegeMode && earMode) {
                // Minimal mapping so Ear Training can reuse the same underlying
                // note-based exercises without changing defaults.
                const earMap = {
                    'same-different': 'classroom-mode',
                    'high-low': 'pitch-match',
                    'interval-recognition': 'pitch-match',
                    'melody-memory': 'listen-repeat',
                    'pattern-recall': 'listen-repeat'
                };
                solfegeMode = earMap[earMode] || 'listen-repeat';
            }

            if ((musicContext === 'solfege-trainer' || musicContext === 'ear-training') && solfegeMode) {
                const map = {
                    'learn-notes': [0, 1],      // Ascending + Descending
                    'pitch-match': [2],         // Do Mi Sol
                    'listen-repeat': [3, 4],   // Twinkle + Mary
                    'scale-builder': [0, 1],   // Ascending + Descending
                    'classroom-mode': [2, 3]   // Short + engaging
                };

                const picked = map[solfegeMode];
                if (picked) {
                    this.exercises = picked.map((idx) => this.exercises[idx]).filter(Boolean);
                }
            }
        } catch (e) {
            // ignore; keep default exercise list
        }

        this.totalNotes = this.exercises.reduce((sum, ex) => sum + ex.notes.length, 0);
    }

    getCurrentExercise() {
        return this.exercises[this.currentExerciseIndex];
    }

    getCurrentNote() {
        const exercise = this.getCurrentExercise();
        if (!exercise) return null;
        return exercise.notes[this.currentNoteIndex];
    }

    getCurrentSolfege() {
        const note = this.getCurrentNote();
        if (!note || !SOLFEGE[note]) return null;
        return SOLFEGE[note].name;
    }

    // Check if sung note matches target
    checkNote(sungNote) {
        const targetNote = this.getCurrentNote();
        if (!targetNote) return false;
        
        // Match by note name or by solfege
        const targetSolfege = SOLFEGE[targetNote]?.name;
        const sungSolfege = SOLFEGE[sungNote]?.name;
        
        // Match if same note or same solfege (handles Do at different octaves)
        if (sungNote === targetNote || 
            (targetSolfege && sungSolfege && targetSolfege === sungSolfege)) {
            this.correctNotes++;
            this.currentNoteIndex++;
            
            if (this.onNoteMatch) {
                this.onNoteMatch(sungNote, targetNote);
            }
            
            // Check if exercise complete
            if (this.currentNoteIndex >= this.getCurrentExercise().notes.length) {
                this.completeExercise();
            }
            
            return true;
        } else {
            if (this.onNoteWrong) {
                this.onNoteWrong(sungNote, targetNote);
            }
            return false;
        }
    }

    completeExercise() {
        if (this.onExerciseComplete) {
            this.onExerciseComplete(this.currentExerciseIndex);
        }
        
        this.currentExerciseIndex++;
        this.currentNoteIndex = 0;
        
        // Check if all exercises complete
        if (this.currentExerciseIndex >= this.exercises.length) {
            if (this.onAllComplete) {
                this.onAllComplete({
                    correct: this.correctNotes,
                    total: this.totalNotes,
                    accuracy: Math.round((this.correctNotes / this.totalNotes) * 100)
                });
            }
        }
    }

    getProgress() {
        return {
            exerciseIndex: this.currentExerciseIndex,
            noteIndex: this.currentNoteIndex,
            totalExercises: this.exercises.length,
            correct: this.correctNotes,
            total: this.totalNotes
        };
    }

    reset() {
        this.currentExerciseIndex = 0;
        this.currentNoteIndex = 0;
        this.correctNotes = 0;
        this.generateExercises();
    }
}

console.log('Solfege Exercises loaded');

