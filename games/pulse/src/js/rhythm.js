/* ============================================
   Pulse — Rhythm System
   Beat generation and timing
   ============================================ */

class Beat {
    constructor(x, y, spawnTime, targetTime, type = 'normal') {
        this.x = x;
        this.y = y;
        this.spawnTime = spawnTime;
        this.targetTime = targetTime;
        this.type = type; // 'normal', 'inhale', 'exhale', 'hold'
        
        // Visual properties
        this.radius = 60;
        this.opacity = 0;
        this.scale = 2;
        this.hit = false;
        this.missed = false;
        this.hitAccuracy = 0; // -1 to 1, 0 is perfect
        
        // Movement
        this.startX = x;
        this.startY = y;
        this.angle = 0;
    }

    update(currentTime, centerX, centerY) {
        const travelDuration = this.targetTime - this.spawnTime;
        const elapsed = currentTime - this.spawnTime;
        const progress = Utils.clamp(elapsed / travelDuration, 0, 1);
        
        // Move toward center
        const eased = Utils.easeOutCubic(progress);
        this.x = Utils.lerp(this.startX, centerX, eased);
        this.y = Utils.lerp(this.startY, centerY, eased);
        
        // Scale shrinks as it approaches
        this.scale = Utils.lerp(2, 1, eased);
        
        // Opacity
        if (progress < 0.1) {
            this.opacity = Utils.lerp(0, 1, progress / 0.1);
        } else if (progress > 0.9 && !this.hit) {
            this.opacity = Utils.lerp(1, 0.5, (progress - 0.9) / 0.1);
        } else {
            this.opacity = this.hit ? 1 : 1;
        }
        
        // Check if missed (past target time without hit)
        if (currentTime > this.targetTime + 300 && !this.hit) {
            this.missed = true;
        }
    }

    checkHit(currentTime, hitWindow = 200) {
        if (this.hit || this.missed) return null;
        
        const timeDiff = currentTime - this.targetTime;
        
        // Perfect: within 50ms
        if (Math.abs(timeDiff) <= 50) {
            this.hit = true;
            this.hitAccuracy = 0;
            return 'perfect';
        }
        // Good: within 100ms
        if (Math.abs(timeDiff) <= 100) {
            this.hit = true;
            this.hitAccuracy = timeDiff / 100;
            return 'good';
        }
        // OK: within hit window
        if (Math.abs(timeDiff) <= hitWindow) {
            this.hit = true;
            this.hitAccuracy = timeDiff / hitWindow;
            return 'ok';
        }
        
        return null;
    }

    isExpired() {
        return this.hit || this.missed;
    }
}

class RhythmEngine {
    constructor() {
        this.bpm = 65; // Starting BPM (matches calm heart rate)
        this.beats = [];
        this.lastBeatTime = 0;
        this.beatInterval = 60000 / this.bpm; // ms between beats
        
        // Timing
        this.startTime = 0;
        this.currentTime = 0;
        
        // Scoring
        this.streak = 0;
        this.bestStreak = 0;
        this.totalHits = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.okHits = 0;
        this.missedBeats = 0;
        
        // Flow state (0-1)
        this.flow = 0;
        this.targetFlow = 0;
        
        // Spawn configuration
        this.spawnRadius = 300;
        this.travelTime = 2000; // Time for beat to reach center
        
        // Beat patterns
        this.patternIndex = 0;
        this.patterns = this.createPatterns();
        
        // Breath sync
        this.breathPhase = 0; // 0-1
        this.lastBreathSync = 0;
    }

    createPatterns() {
        // Different beat spawn patterns (angles in radians)
        return [
            // Simple - top
            [0],
            // Two sides
            [-Math.PI/2, Math.PI/2],
            // Four corners
            [-Math.PI/4, Math.PI/4, -3*Math.PI/4, 3*Math.PI/4],
            // Circle of 6
            [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3].map(a => a - Math.PI/2),
            // Alternating
            [-Math.PI/2],
            [Math.PI/2],
            // Triangle
            [-Math.PI/2, Math.PI/6, 5*Math.PI/6].map(a => a),
        ];
    }

    start() {
        this.startTime = Date.now();
        this.currentTime = 0;
        this.lastBeatTime = this.startTime;
        this.reset();
    }

    reset() {
        this.beats = [];
        this.streak = 0;
        this.bestStreak = 0;
        this.totalHits = 0;
        this.perfectHits = 0;
        this.goodHits = 0;
        this.okHits = 0;
        this.missedBeats = 0;
        this.flow = 0;
        this.patternIndex = 0;
    }

    update(centerX, centerY, breathPhase, isBreathing) {
        this.currentTime = Date.now();
        this.breathPhase = breathPhase;
        
        // Check if it's time to spawn new beat
        const timeSinceLastBeat = this.currentTime - this.lastBeatTime;
        if (timeSinceLastBeat >= this.beatInterval) {
            this.spawnBeat(centerX, centerY);
            this.lastBeatTime = this.currentTime;
            
            // Cycle through patterns based on flow
            if (this.flow > 0.5) {
                this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
            }
        }
        
        // Update all beats
        this.beats.forEach(beat => {
            beat.update(this.currentTime, centerX, centerY);
        });
        
        // Check for breathing hits
        if (isBreathing) {
            this.checkBreathHit();
        }
        
        // Check for missed beats
        this.beats.forEach(beat => {
            if (beat.missed && !beat._countedMiss) {
                beat._countedMiss = true;
                this.onMiss();
            }
        });
        
        // Clean up expired beats
        this.beats = this.beats.filter(beat => !beat.isExpired() || (beat.hit && this.currentTime - beat.targetTime < 500));
        
        // Update flow
        this.flow = Utils.lerp(this.flow, this.targetFlow, 0.05);
        
        // Adaptive BPM based on flow (subtle adjustment)
        const targetBPM = Utils.lerp(60, 75, this.flow);
        this.bpm = Utils.lerp(this.bpm, targetBPM, 0.01);
        this.beatInterval = 60000 / this.bpm;
    }

    spawnBeat(centerX, centerY) {
        // Get current pattern
        const pattern = this.patterns[this.patternIndex % this.patterns.length];
        
        // For simpler gameplay, spawn one beat at a time
        const angleIndex = Math.floor(this.totalHits + this.missedBeats) % pattern.length;
        const angle = pattern[angleIndex] - Math.PI/2; // Offset so 0 is top
        
        const spawnX = centerX + Math.cos(angle) * this.spawnRadius;
        const spawnY = centerY + Math.sin(angle) * this.spawnRadius;
        
        // Determine beat type based on breath phase
        let beatType = 'normal';
        if (this.breathPhase < 0.4) {
            beatType = 'inhale';
        } else if (this.breathPhase < 0.6) {
            beatType = 'hold';
        } else {
            beatType = 'exhale';
        }
        
        const beat = new Beat(
            spawnX, 
            spawnY,
            this.currentTime,
            this.currentTime + this.travelTime,
            beatType
        );
        beat.angle = angle;
        
        this.beats.push(beat);
        
        // Emit event for audio
        GameEvents.emit('beatSpawned', { beat });
    }

    checkBreathHit() {
        // Find the beat closest to target time
        let closestBeat = null;
        let closestDiff = Infinity;
        
        this.beats.forEach(beat => {
            if (beat.hit || beat.missed) return;
            
            const diff = Math.abs(this.currentTime - beat.targetTime);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestBeat = beat;
            }
        });
        
        if (closestBeat) {
            const result = closestBeat.checkHit(this.currentTime);
            if (result) {
                this.onHit(result, closestBeat);
            }
        }
    }

    onHit(accuracy, beat) {
        this.totalHits++;
        this.streak++;
        
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
        }
        
        // Track accuracy types
        switch (accuracy) {
            case 'perfect':
                this.perfectHits++;
                this.targetFlow = Utils.clamp(this.targetFlow + 0.08, 0, 1);
                break;
            case 'good':
                this.goodHits++;
                this.targetFlow = Utils.clamp(this.targetFlow + 0.04, 0, 1);
                break;
            case 'ok':
                this.okHits++;
                this.targetFlow = Utils.clamp(this.targetFlow + 0.02, 0, 1);
                break;
        }
        
        // Streak bonus
        if (this.streak >= 10) {
            this.targetFlow = Utils.clamp(this.targetFlow + 0.02, 0, 1);
        }
        
        GameEvents.emit('beatHit', { accuracy, beat, streak: this.streak, flow: this.flow });
    }

    onMiss() {
        this.missedBeats++;
        this.streak = 0;
        this.targetFlow = Utils.clamp(this.targetFlow - 0.1, 0, 1);
        
        GameEvents.emit('beatMissed', { flow: this.flow });
    }

    getAccuracyPercent() {
        const total = this.totalHits + this.missedBeats;
        if (total === 0) return 100;
        return Math.round((this.totalHits / total) * 100);
    }

    getSessionDuration() {
        return (this.currentTime - this.startTime) / 1000;
    }

    getBeats() {
        return this.beats;
    }

    getFlow() {
        return this.flow;
    }

    getBPM() {
        return Math.round(this.bpm);
    }

    getStreak() {
        return this.streak;
    }

    getBestStreak() {
        return this.bestStreak;
    }
}




