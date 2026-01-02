/* Rhythm Islands - Rhythm System */

class RhythmManager {
    constructor() {
        this.beatInterval = 750; // Will be set by audio BPM
        this.lastBeatTime = 0;
        this.nextBeatTime = 0;
        
        // Timing windows (in ms)
        this.perfectWindow = 80;
        this.goodWindow = 150;
        
        // Visual beat ring
        this.beatRing = document.getElementById('beat-ring');
        this.feedbackEl = document.getElementById('hit-feedback');
        
        // Stats
        this.combo = 0;
        this.bestCombo = 0;
        this.totalHits = 0;
        this.perfectHits = 0;
        
        // Callbacks
        this.onHit = null;
        this.onMiss = null;
        
        // Beat tracking
        this.beatActive = false;
        this.canHit = true;
    }

    setBeatInterval(interval) {
        this.beatInterval = interval;
    }

    onBeat() {
        this.lastBeatTime = performance.now();
        this.nextBeatTime = this.lastBeatTime + this.beatInterval;
        this.beatActive = true;
        this.canHit = true;
        
        // Animate beat ring
        this.animateBeatRing();
    }

    animateBeatRing() {
        if (!this.beatRing) return;
        
        this.beatRing.classList.remove('approaching');
        void this.beatRing.offsetWidth; // Force reflow
        this.beatRing.classList.add('approaching');
    }

    tap() {
        const now = performance.now();
        
        if (!this.canHit) {
            return { quality: 'miss', points: 0 };
        }
        
        // Calculate timing offset from beat
        const timeSinceBeat = now - this.lastBeatTime;
        const timeUntilNext = this.nextBeatTime - now;
        
        // Check if closer to last beat or next beat
        const offset = Math.min(timeSinceBeat, timeUntilNext);
        
        let quality = 'miss';
        let points = 0;
        
        if (offset <= this.perfectWindow) {
            quality = 'perfect';
            points = 100;
            this.combo++;
            this.perfectHits++;
            this.totalHits++;
        } else if (offset <= this.goodWindow) {
            quality = 'good';
            points = 50;
            this.combo++;
            this.totalHits++;
        } else {
            quality = 'miss';
            points = 0;
            this.combo = 0;
        }
        
        // Update best combo
        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }
        
        // Combo bonus
        if (this.combo > 5) {
            points = Math.floor(points * (1 + this.combo * 0.1));
        }
        
        // Show feedback
        this.showFeedback(quality);
        
        // Prevent double-hits on same beat
        if (quality !== 'miss') {
            this.canHit = false;
        }
        
        // Callbacks
        if (quality !== 'miss' && this.onHit) {
            this.onHit(quality, points, this.combo);
        } else if (quality === 'miss' && this.onMiss) {
            this.onMiss();
        }
        
        return { quality, points, combo: this.combo };
    }

    showFeedback(quality) {
        if (!this.feedbackEl) return;
        
        const textEl = this.feedbackEl.querySelector('.feedback-text');
        textEl.className = `feedback-text ${quality}`;
        
        switch (quality) {
            case 'perfect':
                textEl.textContent = 'Perfect! ✨';
                break;
            case 'good':
                textEl.textContent = 'Good!';
                break;
            case 'miss':
                textEl.textContent = 'Miss';
                break;
        }
        
        this.feedbackEl.classList.remove('hidden');
        
        // Hide after animation
        setTimeout(() => {
            this.feedbackEl.classList.add('hidden');
        }, 500);
    }

    getCombo() {
        return this.combo;
    }

    getBestCombo() {
        return this.bestCombo;
    }

    getStats() {
        return {
            combo: this.combo,
            bestCombo: this.bestCombo,
            totalHits: this.totalHits,
            perfectHits: this.perfectHits,
            accuracy: this.totalHits > 0 ? (this.perfectHits / this.totalHits * 100).toFixed(1) : 0
        };
    }

    reset() {
        this.combo = 0;
        this.bestCombo = 0;
        this.totalHits = 0;
        this.perfectHits = 0;
    }
}

console.log('Rhythm System loaded');

