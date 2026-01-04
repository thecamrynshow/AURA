/* ============================================
   BEFORE — Prep Protocols
   Guided preparation sequences
   ============================================ */

class PrepProtocol {
    constructor() {
        // UI Elements
        this.phaseNameEl = document.getElementById('phaseName');
        this.phaseInstructionEl = document.getElementById('phaseInstruction');
        this.breathCircle = document.getElementById('breathCircle');
        this.circleText = document.getElementById('circleText');
        this.affirmationEl = document.getElementById('affirmation');
        this.affirmationTextEl = document.getElementById('affirmationText');
        this.progressFill = document.getElementById('progressFill');
        this.timerDisplay = document.querySelector('.timer-value');
        
        // State
        this.event = null;
        this.goal = null;
        this.isRunning = false;
        this.currentPhase = 0;
        this.phaseTimer = null;
        this.breathTimer = null;
        
        // Timing
        this.totalDuration = 300; // 5 minutes in seconds
        this.elapsed = 0;
        this.tickInterval = null;
        
        // Phases
        this.phases = [
            { name: 'Ground', duration: 30, instruction: 'Feel your feet on the floor. You are here, now.' },
            { name: 'Breathe', duration: 120, instruction: 'Follow the circle. Let tension dissolve.' },
            { name: 'Visualize', duration: 90, instruction: 'See yourself succeeding. Feel it.' },
            { name: 'Affirm', duration: 60, instruction: 'Speak these truths to yourself.' }
        ];
        
        // Callbacks
        this.onProgress = null;
        this.onPhaseChange = null;
        this.onComplete = null;
    }

    setEvent(eventKey) {
        this.event = EVENTS[eventKey];
    }

    setGoal(goalKey) {
        this.goal = GOALS[goalKey];
    }

    start() {
        if (!this.event || !this.goal) return;
        
        this.isRunning = true;
        this.currentPhase = 0;
        this.elapsed = 0;
        
        // Start timer tick
        this.tickInterval = setInterval(() => {
            this.tick();
        }, 1000);
        
        // Start first phase
        this.runPhase();
    }

    stop() {
        this.isRunning = false;
        
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        
        if (this.phaseTimer) {
            clearTimeout(this.phaseTimer);
            this.phaseTimer = null;
        }
        
        if (this.breathTimer) {
            clearInterval(this.breathTimer);
            this.breathTimer = null;
        }
    }

    tick() {
        this.elapsed++;
        
        // Update timer display
        const remaining = Math.max(0, this.totalDuration - this.elapsed);
        this.timerDisplay.textContent = formatTime(remaining);
        
        // Update progress
        const progress = (this.elapsed / this.totalDuration) * 100;
        this.progressFill.style.width = progress + '%';
        
        if (this.onProgress) {
            this.onProgress(progress / 100);
        }
        
        // Check if complete
        if (this.elapsed >= this.totalDuration) {
            this.complete();
        }
    }

    runPhase() {
        if (!this.isRunning || this.currentPhase >= this.phases.length) {
            return;
        }
        
        const phase = this.phases[this.currentPhase];
        
        // Update UI
        this.phaseNameEl.textContent = phase.name;
        this.phaseInstructionEl.textContent = phase.instruction;
        
        // Update phase dots
        document.querySelectorAll('.phase-dot').forEach((dot, i) => {
            dot.classList.remove('active', 'complete');
            if (i < this.currentPhase) {
                dot.classList.add('complete');
            } else if (i === this.currentPhase) {
                dot.classList.add('active');
            }
        });
        
        // Run phase-specific logic
        switch (phase.name) {
            case 'Ground':
                this.runGroundPhase(phase.duration);
                break;
            case 'Breathe':
                this.runBreathePhase(phase.duration);
                break;
            case 'Visualize':
                this.runVisualizePhase(phase.duration);
                break;
            case 'Affirm':
                this.runAffirmPhase(phase.duration);
                break;
        }
        
        if (this.onPhaseChange) {
            this.onPhaseChange(phase.name);
        }
        
        beforeAudio.playPhaseChange();
    }

    nextPhase() {
        this.currentPhase++;
        
        if (this.currentPhase >= this.phases.length) {
            // All phases complete, but wait for timer
            return;
        }
        
        this.runPhase();
    }

    runGroundPhase(duration) {
        this.circleText.textContent = 'Ground';
        this.breathCircle.className = 'breath-circle';
        this.affirmationEl.classList.remove('visible');
        
        // Show grounding prompts
        const prompts = [
            'Feel your feet...',
            'Notice your breath...',
            'You are safe here...',
            'This moment is yours...'
        ];
        
        let promptIndex = 0;
        const promptInterval = duration / prompts.length * 1000;
        
        const showPrompt = () => {
            if (promptIndex < prompts.length && this.isRunning) {
                this.circleText.textContent = prompts[promptIndex];
                promptIndex++;
            }
        };
        
        showPrompt();
        this.breathTimer = setInterval(showPrompt, promptInterval);
        
        this.phaseTimer = setTimeout(() => {
            clearInterval(this.breathTimer);
            this.nextPhase();
        }, duration * 1000);
    }

    runBreathePhase(duration) {
        const pattern = this.goal.breathPattern;
        this.affirmationEl.classList.remove('visible');
        
        const runBreathCycle = () => {
            if (!this.isRunning) return;
            
            // Inhale
            this.circleText.textContent = 'Inhale';
            this.breathCircle.className = 'breath-circle inhale';
            beforeAudio.playBreathCue('inhale');
            
            setTimeout(() => {
                if (!this.isRunning) return;
                
                if (pattern.hold > 0) {
                    // Hold
                    this.circleText.textContent = 'Hold';
                    this.breathCircle.className = 'breath-circle hold';
                    beforeAudio.playBreathCue('hold');
                    
                    setTimeout(() => {
                        if (!this.isRunning) return;
                        
                        // Exhale
                        this.circleText.textContent = 'Exhale';
                        this.breathCircle.className = 'breath-circle exhale';
                        beforeAudio.playBreathCue('exhale');
                    }, pattern.hold * 1000);
                } else {
                    // Exhale directly
                    this.circleText.textContent = 'Exhale';
                    this.breathCircle.className = 'breath-circle exhale';
                    beforeAudio.playBreathCue('exhale');
                }
            }, pattern.inhale * 1000);
        };
        
        runBreathCycle();
        
        const cycleTime = (pattern.inhale + pattern.hold + pattern.exhale) * 1000;
        this.breathTimer = setInterval(runBreathCycle, cycleTime);
        
        this.phaseTimer = setTimeout(() => {
            clearInterval(this.breathTimer);
            this.breathCircle.className = 'breath-circle';
            this.nextPhase();
        }, duration * 1000);
    }

    runVisualizePhase(duration) {
        this.circleText.textContent = 'See it';
        this.breathCircle.className = 'breath-circle';
        
        const prompts = [
            `See yourself at your ${this.event.name.toLowerCase()}...`,
            `You are ${this.goal.name.toLowerCase()}...`,
            'Watch yourself succeed...',
            'Feel the satisfaction...',
            'This is your moment...'
        ];
        
        let promptIndex = 0;
        const promptInterval = duration / prompts.length * 1000;
        
        // Show visualization prompts
        this.affirmationEl.classList.add('visible');
        
        const showPrompt = () => {
            if (promptIndex < prompts.length && this.isRunning) {
                this.affirmationTextEl.textContent = prompts[promptIndex];
                promptIndex++;
            }
        };
        
        showPrompt();
        this.breathTimer = setInterval(showPrompt, promptInterval);
        
        this.phaseTimer = setTimeout(() => {
            clearInterval(this.breathTimer);
            this.nextPhase();
        }, duration * 1000);
    }

    runAffirmPhase(duration) {
        this.circleText.textContent = 'Affirm';
        this.breathCircle.className = 'breath-circle';
        
        // Combine event and goal affirmations
        const allAffirmations = [
            ...this.event.affirmations,
            ...this.goal.affirmations
        ];
        
        let affirmIndex = 0;
        const affirmInterval = duration / 4 * 1000;
        
        this.affirmationEl.classList.add('visible');
        
        const showAffirmation = () => {
            if (affirmIndex < 4 && this.isRunning) {
                const affirmation = randomPick(allAffirmations);
                this.affirmationTextEl.textContent = `"${affirmation}"`;
                affirmIndex++;
            }
        };
        
        showAffirmation();
        this.breathTimer = setInterval(showAffirmation, affirmInterval);
        
        this.phaseTimer = setTimeout(() => {
            clearInterval(this.breathTimer);
            // Don't call nextPhase - wait for complete
        }, duration * 1000);
    }

    complete() {
        this.stop();
        
        // Mark all phases complete
        document.querySelectorAll('.phase-dot').forEach(dot => {
            dot.classList.remove('active');
            dot.classList.add('complete');
        });
        
        if (this.onComplete) {
            this.onComplete();
        }
    }
}

console.log('Before Protocols loaded');



