/* ============================================
   ZONE — Activity Controllers
   Breathing, Grounding, Movement activities
   ============================================ */

// ========== BREATHING ACTIVITY ==========
class BreathingActivity {
    constructor() {
        this.overlay = document.getElementById('breathingActivity');
        this.circle = document.getElementById('breathingCircle');
        this.text = document.getElementById('breathText');
        this.instruction = document.getElementById('breathInstruction');
        this.countEl = document.getElementById('breathCount');
        this.totalEl = document.getElementById('breathTotal');
        
        this.isActive = false;
        this.breathCount = 0;
        this.targetBreaths = 5;
        this.phase = 'ready'; // ready, inhale, hold, exhale
        this.animationFrame = null;
        
        this.onComplete = null;
        this.onProgress = null;
    }

    start(targetBreaths = 5) {
        this.targetBreaths = targetBreaths;
        this.breathCount = 0;
        this.phase = 'ready';
        this.isActive = true;
        
        this.totalEl.textContent = targetBreaths;
        this.countEl.textContent = 0;
        
        this.overlay.classList.add('active');
        
        // Start breathing cycle after a moment
        setTimeout(() => this.breathCycle(), 1000);
    }

    async breathCycle() {
        if (!this.isActive) return;
        
        // Inhale (4 seconds)
        this.phase = 'inhale';
        this.text.textContent = 'Breathe In';
        this.circle.classList.remove('exhale');
        this.circle.classList.add('inhale');
        zoneAudio.playBreathTone('inhale');
        
        await this.wait(4000);
        if (!this.isActive) return;
        
        // Hold (2 seconds)
        this.phase = 'hold';
        this.text.textContent = 'Hold';
        
        await this.wait(2000);
        if (!this.isActive) return;
        
        // Exhale (4 seconds)
        this.phase = 'exhale';
        this.text.textContent = 'Breathe Out';
        this.circle.classList.remove('inhale');
        this.circle.classList.add('exhale');
        zoneAudio.playBreathTone('exhale');
        
        await this.wait(4000);
        if (!this.isActive) return;
        
        // Complete one breath
        this.breathCount++;
        this.countEl.textContent = this.breathCount;
        
        // Progress feedback
        if (this.onProgress) {
            this.onProgress(15); // 15% per breath
        }
        
        vibrate(50);
        
        // Check if done
        if (this.breathCount >= this.targetBreaths) {
            this.complete();
        } else {
            // Small pause between breaths
            this.text.textContent = 'Rest';
            await this.wait(1000);
            this.breathCycle();
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    complete() {
        this.isActive = false;
        this.text.textContent = 'Well done';
        
        zoneAudio.playFeedback('success');
        
        setTimeout(() => {
            this.overlay.classList.remove('active');
            this.circle.classList.remove('inhale', 'exhale');
            
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    stop() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.circle.classList.remove('inhale', 'exhale');
    }
}

// ========== GROUNDING ACTIVITY ==========
class GroundingActivity {
    constructor() {
        this.overlay = document.getElementById('groundingActivity');
        this.title = document.getElementById('groundingTitle');
        this.prompt = document.getElementById('groundingPrompt');
        this.stepNumber = this.overlay.querySelector('.step-number');
        this.stepSense = this.overlay.querySelector('.step-sense');
        this.items = document.querySelectorAll('.ground-item');
        
        this.isActive = false;
        this.currentStep = 5;
        this.foundCount = 0;
        
        this.steps = [
            { count: 5, sense: 'things you can SEE', emoji: '👀' },
            { count: 4, sense: 'things you can TOUCH', emoji: '✋' },
            { count: 3, sense: 'things you can HEAR', emoji: '👂' },
            { count: 2, sense: 'things you can SMELL', emoji: '👃' },
            { count: 1, sense: 'thing you can TASTE', emoji: '👅' }
        ];
        this.stepIndex = 0;
        
        this.onComplete = null;
        this.onProgress = null;
        
        this.bindEvents();
    }

    bindEvents() {
        this.items.forEach((item, index) => {
            item.addEventListener('click', () => this.markFound(index));
        });
    }

    start() {
        this.stepIndex = 0;
        this.isActive = true;
        
        this.overlay.classList.add('active');
        this.showStep();
    }

    showStep() {
        const step = this.steps[this.stepIndex];
        this.currentStep = step.count;
        this.foundCount = 0;
        
        this.stepNumber.textContent = step.count;
        this.stepSense.textContent = step.sense;
        
        // Reset and show correct number of items
        this.items.forEach((item, i) => {
            item.classList.remove('found');
            item.style.display = i < step.count ? 'block' : 'none';
        });
        
        zoneAudio.playFeedback('tap');
    }

    markFound(index) {
        if (!this.isActive) return;
        
        const item = this.items[index];
        if (item.classList.contains('found')) return;
        
        item.classList.add('found');
        this.foundCount++;
        
        zoneAudio.playFeedback('tap');
        vibrate(30);
        
        // Progress feedback
        if (this.onProgress) {
            this.onProgress(4); // Small progress per item
        }
        
        // Check if step complete
        if (this.foundCount >= this.currentStep) {
            this.nextStep();
        }
    }

    nextStep() {
        this.stepIndex++;
        
        if (this.stepIndex >= this.steps.length) {
            this.complete();
        } else {
            setTimeout(() => this.showStep(), 500);
        }
    }

    complete() {
        this.isActive = false;
        this.stepNumber.textContent = '✓';
        this.stepSense.textContent = 'You\'re grounded';
        
        zoneAudio.playFeedback('success');
        
        setTimeout(() => {
            this.overlay.classList.remove('active');
            
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    stop() {
        this.isActive = false;
        this.overlay.classList.remove('active');
    }
}

// ========== MOVEMENT ACTIVITY ==========
class MovementActivity {
    constructor() {
        this.overlay = document.getElementById('movementActivity');
        this.figure = document.getElementById('movementFigure');
        this.instruction = document.getElementById('movementInstruction');
        this.timerFill = document.getElementById('movementTimerFill');
        
        this.isActive = false;
        this.currentExercise = 0;
        this.timer = null;
        this.duration = 5000; // 5 seconds per exercise
        
        this.exercises = [
            { instruction: 'Shake your hands really fast! 🙌', animation: 'shaking' },
            { instruction: 'Roll your shoulders back 5 times 🔄', animation: '' },
            { instruction: 'Take 3 big stretches up to the sky ☀️', animation: '' },
            { instruction: 'Stomp your feet on the ground 👟', animation: '' },
            { instruction: 'Give yourself a big hug 🤗', animation: '' }
        ];
        
        this.onComplete = null;
        this.onProgress = null;
    }

    start(numExercises = 3) {
        this.exercises = shuffle(this.exercises).slice(0, numExercises);
        this.currentExercise = 0;
        this.isActive = true;
        
        this.overlay.classList.add('active');
        this.showExercise();
    }

    showExercise() {
        const exercise = this.exercises[this.currentExercise];
        this.instruction.textContent = exercise.instruction;
        
        // Reset timer
        this.timerFill.style.transition = 'none';
        this.timerFill.style.width = '0%';
        
        // Trigger animation
        this.figure.classList.remove('shaking');
        if (exercise.animation) {
            setTimeout(() => this.figure.classList.add(exercise.animation), 50);
        }
        
        // Start timer animation
        setTimeout(() => {
            this.timerFill.style.transition = `width ${this.duration}ms linear`;
            this.timerFill.style.width = '100%';
        }, 50);
        
        zoneAudio.playFeedback('tap');
        
        // Progress
        if (this.onProgress) {
            this.onProgress(10);
        }
        
        // Move to next after duration
        this.timer = setTimeout(() => {
            this.nextExercise();
        }, this.duration);
    }

    nextExercise() {
        this.currentExercise++;
        
        if (this.currentExercise >= this.exercises.length) {
            this.complete();
        } else {
            this.showExercise();
        }
    }

    complete() {
        this.isActive = false;
        this.figure.classList.remove('shaking');
        this.instruction.textContent = 'Great job moving! 🎉';
        
        zoneAudio.playFeedback('success');
        
        setTimeout(() => {
            this.overlay.classList.remove('active');
            
            if (this.onComplete) {
                this.onComplete();
            }
        }, 1500);
    }

    stop() {
        this.isActive = false;
        clearTimeout(this.timer);
        this.figure.classList.remove('shaking');
        this.overlay.classList.remove('active');
    }
}

// Global activity instances
const breathingActivity = new BreathingActivity();
const groundingActivity = new GroundingActivity();
const movementActivity = new MovementActivity();

console.log('ZONE Activities loaded');



