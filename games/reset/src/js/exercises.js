/**
 * Reset — Exercises
 * Different reset modes with their specific exercises
 */

const Exercises = {
    // Quick Breath - Box breathing focus
    quick: {
        name: 'Quick Breath',
        breathPattern: 'box',
        phases: [
            {
                name: 'Centering',
                duration: 15000,
                instructions: [
                    'Close your eyes if comfortable',
                    'Let your shoulders drop',
                    'Notice where you are'
                ]
            },
            {
                name: 'Box Breathing',
                duration: 90000,
                instructions: [
                    'Follow the breathing rhythm',
                    'Equal inhale, hold, exhale, hold',
                    'Four counts each phase'
                ]
            },
            {
                name: 'Return',
                duration: 15000,
                instructions: [
                    'Gently return to natural breath',
                    'Notice how you feel',
                    'Ready to continue your day'
                ]
            }
        ]
    },
    
    // Eye Reset - Screen strain relief
    eyes: {
        name: 'Eye Reset',
        breathPattern: 'simple',
        phases: [
            {
                name: '20-20-20',
                duration: 25000,
                instructions: [
                    'Look away from screen',
                    'Focus on something 20 feet away',
                    'Breathe naturally'
                ],
                exercise: 'distance'
            },
            {
                name: 'Eye Circles',
                duration: 40000,
                instructions: [
                    'Follow the dot with your eyes',
                    'Keep your head still',
                    'Move only your eyes'
                ],
                exercise: 'circles'
            },
            {
                name: 'Palm Rest',
                duration: 45000,
                instructions: [
                    'Close your eyes',
                    'Cup palms over eyes',
                    'Enjoy the darkness'
                ],
                exercise: 'palming'
            },
            {
                name: 'Blink Break',
                duration: 30000,
                instructions: [
                    'Blink slowly 10 times',
                    'Really close your eyes fully',
                    'Lubricate and refresh'
                ],
                exercise: 'blink'
            },
            {
                name: 'Refresh',
                duration: 20000,
                instructions: [
                    'Open your eyes gently',
                    'Let them adjust',
                    'Back to screen with fresh eyes'
                ]
            }
        ]
    },
    
    // Body Scan - Tension release
    body: {
        name: 'Body Scan',
        breathPattern: 'relaxing',
        phases: [
            {
                name: 'Grounding',
                duration: 30000,
                instructions: [
                    'Feet flat on floor',
                    'Feel the support beneath you',
                    'You are held'
                ],
                bodyPart: 'feet'
            },
            {
                name: 'Legs',
                duration: 45000,
                instructions: [
                    'Notice your legs',
                    'Release any tension in thighs',
                    'Let them be heavy'
                ],
                bodyPart: 'legs'
            },
            {
                name: 'Core',
                duration: 45000,
                instructions: [
                    'Soften your belly',
                    'Release your lower back',
                    'Let your breath fill this space'
                ],
                bodyPart: 'core'
            },
            {
                name: 'Shoulders',
                duration: 60000,
                instructions: [
                    'Drop your shoulders',
                    'Release tension from neck',
                    'This is where we hold stress'
                ],
                bodyPart: 'shoulders'
            },
            {
                name: 'Face',
                duration: 45000,
                instructions: [
                    'Unclench your jaw',
                    'Soften your forehead',
                    'Let your face be neutral'
                ],
                bodyPart: 'face'
            },
            {
                name: 'Integration',
                duration: 45000,
                instructions: [
                    'Feel your whole body',
                    'Breathing as one',
                    'Lighter than before'
                ],
                bodyPart: 'whole'
            }
        ]
    },
    
    // Full Reset - Complete sequence
    full: {
        name: 'Full Reset',
        breathPattern: 'coherent',
        phases: [
            {
                name: 'Arrival',
                duration: 30000,
                instructions: [
                    'Pause from your work',
                    'Close your eyes',
                    'You have permission to stop'
                ]
            },
            {
                name: 'Breath Anchor',
                duration: 60000,
                instructions: [
                    'Find your breath',
                    'Coherent rhythm: 5 in, 5 out',
                    'Smooth and steady'
                ]
            },
            {
                name: 'Body Release',
                duration: 60000,
                instructions: [
                    'Scan from head to toe',
                    'Find tension, let it go',
                    'Shoulders, jaw, hands'
                ]
            },
            {
                name: 'Mental Clear',
                duration: 60000,
                instructions: [
                    'Acknowledge your thoughts',
                    'Set them aside for now',
                    'They will wait'
                ]
            },
            {
                name: 'Energy Refresh',
                duration: 45000,
                instructions: [
                    'Feel renewed energy',
                    'Clear mind, relaxed body',
                    'Ready for what\'s next'
                ]
            },
            {
                name: 'Return',
                duration: 30000,
                instructions: [
                    'Gently return',
                    'Open your eyes when ready',
                    'Carry this calm with you'
                ]
            }
        ]
    }
};

class ExerciseController {
    constructor() {
        this.currentExercise = null;
        this.currentPhaseIndex = 0;
        this.phaseStartTime = 0;
        this.isRunning = false;
        this.onPhaseChange = null;
        this.onInstructionChange = null;
        this.onComplete = null;
        this.instructionIndex = 0;
        this.instructionTimer = null;
        this.phaseTimer = null;
    }
    
    setExercise(exerciseName) {
        this.currentExercise = Exercises[exerciseName];
        this.currentPhaseIndex = 0;
        this.instructionIndex = 0;
    }
    
    start() {
        if (!this.currentExercise) return;
        this.isRunning = true;
        this.runPhase();
    }
    
    stop() {
        this.isRunning = false;
        this.clearTimers();
    }
    
    pause() {
        this.isRunning = false;
        this.clearTimers();
    }
    
    resume() {
        this.isRunning = true;
        this.runPhase();
    }
    
    clearTimers() {
        if (this.instructionTimer) clearInterval(this.instructionTimer);
        if (this.phaseTimer) clearTimeout(this.phaseTimer);
    }
    
    runPhase() {
        if (!this.isRunning || !this.currentExercise) return;
        if (this.currentPhaseIndex >= this.currentExercise.phases.length) {
            if (this.onComplete) this.onComplete();
            return;
        }
        
        const phase = this.currentExercise.phases[this.currentPhaseIndex];
        this.instructionIndex = 0;
        this.phaseStartTime = Date.now();
        
        if (this.onPhaseChange) {
            this.onPhaseChange(phase, this.currentPhaseIndex, this.currentExercise.phases.length);
        }
        
        // Cycle through instructions
        this.showInstruction(phase);
        this.instructionTimer = setInterval(() => {
            if (!this.isRunning) return;
            this.instructionIndex = (this.instructionIndex + 1) % phase.instructions.length;
            this.showInstruction(phase);
        }, phase.duration / phase.instructions.length);
        
        // Move to next phase
        this.phaseTimer = setTimeout(() => {
            this.clearTimers();
            this.currentPhaseIndex++;
            this.runPhase();
        }, phase.duration);
    }
    
    showInstruction(phase) {
        if (this.onInstructionChange) {
            this.onInstructionChange(phase.instructions[this.instructionIndex], phase);
        }
    }
    
    getCurrentPhase() {
        if (!this.currentExercise) return null;
        return this.currentExercise.phases[this.currentPhaseIndex];
    }
    
    getProgress() {
        if (!this.currentExercise) return 0;
        
        let totalDuration = 0;
        let elapsedDuration = 0;
        
        this.currentExercise.phases.forEach((phase, i) => {
            totalDuration += phase.duration;
            if (i < this.currentPhaseIndex) {
                elapsedDuration += phase.duration;
            } else if (i === this.currentPhaseIndex) {
                elapsedDuration += Date.now() - this.phaseStartTime;
            }
        });
        
        return elapsedDuration / totalDuration;
    }
    
    getTotalDuration() {
        if (!this.currentExercise) return 0;
        return this.currentExercise.phases.reduce((sum, phase) => sum + phase.duration, 0);
    }
}

