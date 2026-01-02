/* ============================================
   SOLFÈGE — Piano Controller
   Visual piano that responds to voice
   ============================================ */

class Piano {
    constructor(element) {
        this.element = element;
        this.keys = {};
        this.activeKey = null;
        
        this.init();
    }

    init() {
        // Cache all keys
        this.element.querySelectorAll('.piano-key').forEach(key => {
            const note = key.dataset.note;
            if (note) {
                this.keys[note] = key;
            }
        });
    }

    // Light up a key
    lightKey(note) {
        // Clear previous
        this.clearAll();
        
        const key = this.keys[note];
        if (key) {
            key.classList.add('lit', 'active');
            this.activeKey = note;
        }
    }

    // Light key by solfege name
    lightBySolfege(solfegeName) {
        this.clearAll();
        
        for (const [note, key] of Object.entries(this.keys)) {
            if (key.dataset.solfege === solfegeName) {
                key.classList.add('lit', 'active');
                this.activeKey = note;
                break;
            }
        }
    }

    // Clear a specific key
    clearKey(note) {
        const key = this.keys[note];
        if (key) {
            key.classList.remove('lit', 'active');
        }
        if (this.activeKey === note) {
            this.activeKey = null;
        }
    }

    // Clear all keys
    clearAll() {
        Object.values(this.keys).forEach(key => {
            key.classList.remove('lit', 'active');
        });
        this.activeKey = null;
    }

    // Flash a key (for target indication)
    flashKey(note, duration = 500) {
        const key = this.keys[note];
        if (key) {
            key.classList.add('lit');
            setTimeout(() => {
                key.classList.remove('lit');
            }, duration);
        }
    }

    // Pulse animation for target note
    pulseKey(note) {
        const key = this.keys[note];
        if (key) {
            key.classList.add('pulse');
        }
    }

    stopPulse(note) {
        const key = this.keys[note];
        if (key) {
            key.classList.remove('pulse');
        }
    }

    // Play visual scale animation
    async playVisualScale(speed = 300) {
        const scaleNotes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        
        for (let i = 0; i < scaleNotes.length; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    this.lightKey(scaleNotes[i]);
                    resolve();
                }, speed);
            });
        }
        
        setTimeout(() => this.clearAll(), speed);
    }

    // Get note at position (for touch/click)
    getNoteAt(x, y) {
        for (const [note, key] of Object.entries(this.keys)) {
            const rect = key.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return note;
            }
        }
        return null;
    }
}

console.log('Solfege Piano loaded');


