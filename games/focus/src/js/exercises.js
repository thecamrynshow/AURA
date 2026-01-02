/**
 * Focus — Exercises
 * Brain dump, attention training, breathing
 */

const Exercises = {
    // Common distracting thoughts for teens
    thoughts: [
        "that thing I said",
        "my phone",
        "what they think",
        "that video",
        "later plans",
        "random worry",
        "that text",
        "social media",
        "that song",
        "hungry",
        "tired",
        "bored feeling"
    ],
    
    // Get random subset of thoughts
    getRandomThoughts(count = 6) {
        const shuffled = [...this.thoughts].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },
    
    // Intention options with emojis
    intentions: [
        { id: 'homework', label: '📚 Homework', emoji: '📚' },
        { id: 'reading', label: '📖 Reading', emoji: '📖' },
        { id: 'project', label: '🎨 Project', emoji: '🎨' },
        { id: 'studying', label: '📝 Studying', emoji: '📝' },
        { id: 'writing', label: '✍️ Writing', emoji: '✍️' },
        { id: 'other', label: '✨ Something else', emoji: '✨' }
    ],
    
    // Time options in minutes
    timeOptions: [15, 25, 45],
    
    // Attention training duration (seconds)
    attentionDuration: 15,
    
    // Focus breathing cycles
    breathCycles: 3,
    
    // Breath timing (ms)
    breathTiming: {
        inhale: 4000,
        hold: 2000,
        exhale: 4000
    }
};

class AttentionTrainer {
    constructor() {
        this.isRunning = false;
        this.duration = Exercises.attentionDuration;
        this.elapsed = 0;
        this.onProgress = null;
        this.onComplete = null;
    }
    
    start() {
        this.isRunning = true;
        this.elapsed = 0;
        
        const interval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }
            
            this.elapsed++;
            
            if (this.onProgress) {
                this.onProgress(this.elapsed, this.duration);
            }
            
            if (this.elapsed >= this.duration) {
                this.isRunning = false;
                clearInterval(interval);
                if (this.onComplete) this.onComplete();
            }
        }, 1000);
    }
    
    stop() {
        this.isRunning = false;
    }
}

class FocusBreathing {
    constructor() {
        this.isRunning = false;
        this.currentCycle = 0;
        this.totalCycles = Exercises.breathCycles;
        this.onPhase = null;
        this.onCycleComplete = null;
        this.onComplete = null;
    }
    
    start() {
        this.isRunning = true;
        this.currentCycle = 0;
        this.runCycle();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    async runCycle() {
        if (!this.isRunning) return;
        if (this.currentCycle >= this.totalCycles) {
            if (this.onComplete) this.onComplete();
            return;
        }
        
        // Inhale
        if (this.onPhase) this.onPhase('inhale', Exercises.breathTiming.inhale);
        await Utils.delay(Exercises.breathTiming.inhale);
        
        if (!this.isRunning) return;
        
        // Hold
        if (this.onPhase) this.onPhase('hold', Exercises.breathTiming.hold);
        await Utils.delay(Exercises.breathTiming.hold);
        
        if (!this.isRunning) return;
        
        // Exhale
        if (this.onPhase) this.onPhase('exhale', Exercises.breathTiming.exhale);
        await Utils.delay(Exercises.breathTiming.exhale);
        
        this.currentCycle++;
        if (this.onCycleComplete) this.onCycleComplete(this.currentCycle, this.totalCycles);
        
        // Next cycle
        this.runCycle();
    }
}


