/* ============================================
   ZONE — Utility Functions
   ============================================ */

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Map value from one range to another
function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

// Ease in out cubic
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Ease out cubic
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random item from array
function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format time as mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Zone definitions
const ZONES = {
    blue: {
        name: 'Blue Zone',
        color: '#5B9BD5',
        colorLight: '#A5C8E4',
        colorDark: '#2E5A87',
        bgColor: '#1a2a3a',
        emoji: '😴',
        emojis: ['😴', '😢', '😶'],
        description: 'Tired, sad, slow, bored',
        activities: ['breathing', 'movement'],
        tips: [
            'Moving your body can help boost your energy',
            'Try taking some deep breaths to wake up your body',
            'A quick stretch can help you feel more alert'
        ]
    },
    green: {
        name: 'Green Zone',
        color: '#70C490',
        colorLight: '#A8E0BC',
        colorDark: '#3D8B5A',
        bgColor: '#1a2d24',
        emoji: '😊',
        emojis: ['😊', '😌', '🙂'],
        description: 'Calm, focused, happy, ready',
        activities: [],
        tips: [
            'You\'re in a great place! Notice how this feels',
            'Remember this feeling - you can come back here',
            'The Green Zone is where we learn best'
        ]
    },
    yellow: {
        name: 'Yellow Zone',
        color: '#F5C842',
        colorLight: '#FAE08A',
        colorDark: '#C49A1A',
        bgColor: '#2d2a1a',
        emoji: '😬',
        emojis: ['😬', '😤', '🤪'],
        description: 'Worried, frustrated, silly, wiggly',
        activities: ['breathing', 'grounding'],
        tips: [
            'Slow breaths can help calm your body',
            'Try the 5-4-3-2-1 grounding when you feel worried',
            'It\'s okay to feel wiggly - let\'s find focus'
        ]
    },
    red: {
        name: 'Red Zone',
        color: '#E85D5D',
        colorLight: '#F5A0A0',
        colorDark: '#B83A3A',
        bgColor: '#2d1a1a',
        emoji: '😡',
        emojis: ['😡', '😱', '🤯'],
        description: 'Angry, scared, out of control',
        activities: ['movement', 'breathing', 'grounding'],
        tips: [
            'Shaking out your hands can release big feelings',
            'Take one breath at a time',
            'It\'s safe to feel this - let\'s work through it together'
        ]
    }
};

// Get zone by name
function getZone(zoneName) {
    return ZONES[zoneName] || ZONES.green;
}

// Get activity order based on starting zone
function getActivityOrder(zoneName) {
    const zone = getZone(zoneName);
    return zone.activities || [];
}

// Get random tip for a zone
function getRandomTip(zoneName) {
    const zone = getZone(zoneName);
    return randomPick(zone.tips);
}

// Check if we're on mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Vibrate if supported
function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

console.log('ZONE Utils loaded');


