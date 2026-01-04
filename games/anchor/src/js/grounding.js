/**
 * Anchor — Grounding System
 * 5-4-3-2-1 Technique Implementation
 */

const GroundingSenses = [
    {
        count: 5,
        sense: 'see',
        name: 'Things You Can See',
        instruction: 'Look around slowly. What catches your eye?',
        icon: '👁️',
        examples: ['A color', 'A shape', 'Movement', 'Light', 'Texture']
    },
    {
        count: 4,
        sense: 'touch',
        name: 'Things You Can Touch',
        instruction: 'What textures and sensations do you feel right now?',
        icon: '✋',
        examples: ['Your clothes', 'The chair', 'Your feet on floor', 'The air']
    },
    {
        count: 3,
        sense: 'hear',
        name: 'Things You Can Hear',
        instruction: 'Listen carefully. What sounds surround you?',
        icon: '👂',
        examples: ['Distant sounds', 'Near sounds', 'Your breath']
    },
    {
        count: 2,
        sense: 'smell',
        name: 'Things You Can Smell',
        instruction: 'Breathe in. What scents can you notice?',
        icon: '👃',
        examples: ['The room', 'Your clothes']
    },
    {
        count: 1,
        sense: 'taste',
        name: 'Thing You Can Taste',
        instruction: 'What taste is in your mouth right now?',
        icon: '👅',
        examples: ['Any taste']
    }
];

class GroundingController {
    constructor() {
        this.currentSenseIndex = 0;
        this.itemsAcknowledged = 0;
        this.isRunning = false;
        
        // Callbacks
        this.onSenseChange = null;
        this.onItemAcknowledged = null;
        this.onSenseComplete = null;
        this.onComplete = null;
    }
    
    start() {
        this.isRunning = true;
        this.currentSenseIndex = 0;
        this.itemsAcknowledged = 0;
        this.startSense();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    startSense() {
        if (!this.isRunning) return;
        if (this.currentSenseIndex >= GroundingSenses.length) {
            this.complete();
            return;
        }
        
        this.itemsAcknowledged = 0;
        const sense = GroundingSenses[this.currentSenseIndex];
        
        if (this.onSenseChange) {
            this.onSenseChange(sense, this.currentSenseIndex);
        }
    }
    
    acknowledgeItem() {
        if (!this.isRunning) return;
        
        const sense = GroundingSenses[this.currentSenseIndex];
        this.itemsAcknowledged++;
        
        if (this.onItemAcknowledged) {
            this.onItemAcknowledged(this.itemsAcknowledged, sense.count);
        }
        
        // Check if sense complete
        if (this.itemsAcknowledged >= sense.count) {
            if (this.onSenseComplete) {
                this.onSenseComplete(sense, this.currentSenseIndex);
            }
            
            // Move to next sense
            this.currentSenseIndex++;
            
            // Pause briefly before next sense
            setTimeout(() => {
                this.startSense();
            }, 2000);
        }
    }
    
    complete() {
        this.isRunning = false;
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    getCurrentSense() {
        return GroundingSenses[this.currentSenseIndex];
    }
    
    getProgress() {
        // Calculate overall progress (0-1)
        let total = 0;
        let completed = 0;
        
        GroundingSenses.forEach((sense, index) => {
            total += sense.count;
            if (index < this.currentSenseIndex) {
                completed += sense.count;
            } else if (index === this.currentSenseIndex) {
                completed += this.itemsAcknowledged;
            }
        });
        
        return completed / total;
    }
    
    getTotalItems() {
        return GroundingSenses.reduce((sum, sense) => sum + sense.count, 0);
    }
    
    getCompletedItems() {
        let completed = 0;
        GroundingSenses.forEach((sense, index) => {
            if (index < this.currentSenseIndex) {
                completed += sense.count;
            } else if (index === this.currentSenseIndex) {
                completed += this.itemsAcknowledged;
            }
        });
        return completed;
    }
}



