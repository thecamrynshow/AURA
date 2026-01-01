/**
 * Tidepool - Input System
 * Tracks touch/mouse movement and calculates speed
 */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        
        // Current position
        this.x = window.innerWidth / 2;
        this.y = window.innerHeight / 2;
        
        // Position history for speed calculation
        this.history = [];
        this.maxHistory = 10;
        
        // Movement metrics
        this.speed = 0;
        this.smoothedSpeed = 0;
        this.isActive = false;
        this.lastMoveTime = 0;
        
        // Touch indicator element
        this.indicator = document.getElementById('touch-indicator');
        
        // Presence tracking
        this.presenceLevel = 0.3; // Start low
        this.stillnessTime = 0;
        
        // Bind event handlers
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        
        this.init();
    }
    
    init() {
        // Pointer events (works for mouse and touch)
        this.canvas.addEventListener('pointermove', this.handlePointerMove);
        this.canvas.addEventListener('pointerdown', this.handlePointerDown);
        this.canvas.addEventListener('pointerup', this.handlePointerUp);
        this.canvas.addEventListener('pointerleave', this.handlePointerUp);
        
        // Prevent default touch behaviors
        this.canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    }
    
    handlePointerDown(e) {
        this.isActive = true;
        this.updatePosition(e);
        this.indicator.classList.add('active');
    }
    
    handlePointerUp(e) {
        this.isActive = false;
        this.indicator.classList.remove('active');
        this.indicator.classList.remove('fast');
        this.indicator.classList.remove('slow');
    }
    
    handlePointerMove(e) {
        this.updatePosition(e);
        this.lastMoveTime = performance.now();
    }
    
    updatePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.x = e.clientX - rect.left;
        this.y = e.clientY - rect.top;
        
        // Update indicator position
        if (this.indicator) {
            this.indicator.style.left = `${e.clientX}px`;
            this.indicator.style.top = `${e.clientY}px`;
        }
        
        // Add to history
        this.history.push({
            x: this.x,
            y: this.y,
            time: performance.now()
        });
        
        // Trim history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    update(deltaTime) {
        // Calculate speed from position history
        this.calculateSpeed();
        
        // Smooth the speed
        this.smoothedSpeed = Utils.lerp(this.smoothedSpeed, this.speed, 0.2);
        
        // Update presence level based on movement
        this.updatePresence(deltaTime);
        
        // Update indicator visual based on speed
        this.updateIndicator();
        
        // Check for stillness
        const timeSinceMove = performance.now() - this.lastMoveTime;
        if (timeSinceMove > 500) {
            this.stillnessTime += deltaTime;
        } else {
            this.stillnessTime = 0;
        }
    }
    
    calculateSpeed() {
        if (this.history.length < 2) {
            this.speed = 0;
            return;
        }
        
        // Calculate distance traveled over recent history
        let totalDist = 0;
        let totalTime = 0;
        
        for (let i = 1; i < this.history.length; i++) {
            const prev = this.history[i - 1];
            const curr = this.history[i];
            
            totalDist += Utils.distance(prev.x, prev.y, curr.x, curr.y);
            totalTime += curr.time - prev.time;
        }
        
        // Speed in pixels per frame (normalized to 16ms)
        if (totalTime > 0) {
            this.speed = (totalDist / totalTime) * 16;
        } else {
            this.speed = 0;
        }
        
        // Decay speed if no recent movement
        const timeSinceMove = performance.now() - this.lastMoveTime;
        if (timeSinceMove > 100) {
            this.speed *= Math.max(0, 1 - timeSinceMove / 1000);
        }
    }
    
    updatePresence(deltaTime) {
        // Presence increases with slow, steady movement
        // Decreases with fast or erratic movement
        
        const targetPresence = this.calculateTargetPresence();
        
        // Smooth transition to target
        const lerpSpeed = targetPresence > this.presenceLevel ? 0.02 : 0.03;
        this.presenceLevel = Utils.lerp(this.presenceLevel, targetPresence, lerpSpeed);
        
        // Clamp
        this.presenceLevel = Utils.clamp(this.presenceLevel, 0, 1);
        
        // Emit presence update
        GameEvents.emit('presenceUpdate', {
            level: this.presenceLevel,
            speed: this.smoothedSpeed,
            isStill: this.stillnessTime > 500
        });
    }
    
    calculateTargetPresence() {
        // Fast movement = low presence
        if (this.smoothedSpeed > 15) {
            return 0.1;
        }
        
        // Moderate movement = moderate presence
        if (this.smoothedSpeed > 8) {
            return 0.3;
        }
        
        // Slow movement = high presence
        if (this.smoothedSpeed > 3) {
            return 0.6;
        }
        
        // Very slow or still = highest presence
        if (this.stillnessTime > 2000) {
            return 1.0;
        }
        
        if (this.stillnessTime > 500) {
            return 0.85;
        }
        
        return 0.7;
    }
    
    updateIndicator() {
        if (!this.indicator) return;
        
        // Remove all state classes
        this.indicator.classList.remove('fast', 'slow');
        
        if (this.smoothedSpeed > 10) {
            this.indicator.classList.add('fast');
        } else if (this.smoothedSpeed < 3 && this.isActive) {
            this.indicator.classList.add('slow');
        }
    }
    
    getPosition() {
        return { x: this.x, y: this.y };
    }
    
    getSpeed() {
        return this.smoothedSpeed;
    }
    
    getPresence() {
        return this.presenceLevel;
    }
    
    isStill() {
        return this.stillnessTime > 500;
    }
    
    destroy() {
        this.canvas.removeEventListener('pointermove', this.handlePointerMove);
        this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
        this.canvas.removeEventListener('pointerup', this.handlePointerUp);
        this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    }
}

