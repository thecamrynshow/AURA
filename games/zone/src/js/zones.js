/* ============================================
   ZONE — Zone Management System
   Handles zone selection and transitions
   ============================================ */

class ZoneManager {
    constructor() {
        this.currentZone = null;
        this.targetZone = 'green'; // Always aiming for green
        this.progress = 0; // 0-100 progress toward green
        this.sessionStartTime = null;
        
        this.onZoneChange = null;
        this.onProgressUpdate = null;
    }

    // Set the initial zone (from check-in)
    setZone(zoneName) {
        this.currentZone = zoneName;
        this.progress = this.calculateInitialProgress(zoneName);
        
        if (this.onZoneChange) {
            this.onZoneChange(zoneName);
        }
        
        console.log(`Zone set to: ${zoneName}, initial progress: ${this.progress}%`);
    }

    // Calculate initial progress based on starting zone
    calculateInitialProgress(zoneName) {
        switch (zoneName) {
            case 'green':
                return 100; // Already there!
            case 'blue':
            case 'yellow':
                return 30; // One zone away
            case 'red':
                return 10; // Furthest away
            default:
                return 50;
        }
    }

    // Add progress (from completing activities)
    addProgress(amount) {
        this.progress = clamp(this.progress + amount, 0, 100);
        
        if (this.onProgressUpdate) {
            this.onProgressUpdate(this.progress);
        }
        
        // Check if we've reached green
        if (this.progress >= 100 && this.currentZone !== 'green') {
            this.currentZone = 'green';
            if (this.onZoneChange) {
                this.onZoneChange('green');
            }
        }
        
        return this.progress;
    }

    // Get the appropriate activities for current zone
    getActivities() {
        const zone = getZone(this.currentZone);
        return zone.activities || [];
    }

    // Get zone info
    getZoneInfo() {
        return getZone(this.currentZone);
    }

    // Get a tip for the current zone
    getTip() {
        return getRandomTip(this.currentZone);
    }

    // Check if already in green zone
    isInGreenZone() {
        return this.currentZone === 'green';
    }

    // Start session timer
    startSession() {
        this.sessionStartTime = Date.now();
    }

    // Get session duration
    getSessionDuration() {
        if (!this.sessionStartTime) return 0;
        return Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }

    // Reset for new session
    reset() {
        this.currentZone = null;
        this.progress = 0;
        this.sessionStartTime = null;
    }
}

// Global zone manager
const zoneManager = new ZoneManager();

console.log('ZONE Manager loaded');



