/* ============================================
   THRESHOLD — Utility Functions
   ============================================ */

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// State definitions
const STATES = {
    // Current states (problems)
    stressed: {
        name: 'Stressed',
        icon: '⚡',
        color: '#ef4444',
        transitions: ['calm', 'grounded', 'focused']
    },
    tired: {
        name: 'Tired',
        icon: '🌙',
        color: '#6366f1',
        transitions: ['energized', 'focused', 'calm']
    },
    anxious: {
        name: 'Anxious',
        icon: '🌀',
        color: '#f59e0b',
        transitions: ['calm', 'grounded', 'confident']
    },
    scattered: {
        name: 'Scattered',
        icon: '💫',
        color: '#ec4899',
        transitions: ['focused', 'grounded', 'calm']
    },
    wired: {
        name: 'Wired',
        icon: '🔥',
        color: '#f97316',
        transitions: ['calm', 'sleepy', 'grounded']
    },
    neutral: {
        name: 'Neutral',
        icon: '◯',
        color: '#6b7280',
        transitions: ['energized', 'focused', 'calm', 'sleepy', 'confident', 'grounded']
    },
    
    // Target states (goals)
    calm: {
        name: 'Calm',
        icon: '🌊',
        color: '#06b6d4'
    },
    focused: {
        name: 'Focused',
        icon: '🎯',
        color: '#8b5cf6'
    },
    energized: {
        name: 'Energized',
        icon: '☀️',
        color: '#fbbf24'
    },
    grounded: {
        name: 'Grounded',
        icon: '🌿',
        color: '#22c55e'
    },
    sleepy: {
        name: 'Sleepy',
        icon: '🌙',
        color: '#6366f1'
    },
    confident: {
        name: 'Confident',
        icon: '💎',
        color: '#f472b6'
    }
};

// Breathing patterns for different transitions
const BREATHING_PATTERNS = {
    // To calm: Long exhales (4-7-8 breathing)
    calm: {
        name: '4-7-8 Breathing',
        inhale: 4,
        hold: 7,
        exhale: 8,
        cycles: 4,
        description: 'Long exhales activate your parasympathetic nervous system'
    },
    
    // To focused: Box breathing
    focused: {
        name: 'Box Breathing',
        inhale: 4,
        hold: 4,
        exhale: 4,
        holdAfter: 4,
        cycles: 4,
        description: 'Equal phases sharpen concentration and clarity'
    },
    
    // To energized: Energizing breath (quick inhales)
    energized: {
        name: 'Energizing Breath',
        inhale: 2,
        hold: 0,
        exhale: 2,
        cycles: 8,
        description: 'Quick rhythmic breathing increases alertness'
    },
    
    // To grounded: Grounding breath
    grounded: {
        name: 'Grounding Breath',
        inhale: 5,
        hold: 2,
        exhale: 5,
        cycles: 5,
        description: 'Deep belly breaths anchor you to the present'
    },
    
    // To sleepy: Sleep preparation (very long exhales)
    sleepy: {
        name: 'Sleep Preparation',
        inhale: 4,
        hold: 4,
        exhale: 10,
        cycles: 4,
        description: 'Extended exhales prepare body and mind for rest'
    },
    
    // To confident: Power breathing
    confident: {
        name: 'Power Breathing',
        inhale: 4,
        hold: 4,
        exhale: 4,
        cycles: 5,
        description: 'Strong controlled breaths build inner strength'
    }
};

// Format time as M:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

console.log('Threshold Utils loaded');

