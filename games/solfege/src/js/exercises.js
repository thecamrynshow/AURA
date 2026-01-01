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
            }
        ];
        
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

