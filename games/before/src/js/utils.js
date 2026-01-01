/* ============================================
   BEFORE — Utility Functions
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

// Random item from array
function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Event definitions
const EVENTS = {
    meeting: {
        name: 'Meeting',
        icon: '💼',
        affirmations: [
            "I communicate clearly and confidently.",
            "My ideas have value and deserve to be heard.",
            "I am prepared and professional.",
            "I listen actively and respond thoughtfully."
        ]
    },
    presentation: {
        name: 'Presentation',
        icon: '🎤',
        affirmations: [
            "I am a compelling speaker.",
            "My message resonates with my audience.",
            "I embrace this opportunity to share.",
            "I command the room with presence."
        ]
    },
    test: {
        name: 'Test',
        icon: '📝',
        affirmations: [
            "I have prepared well for this moment.",
            "My mind is clear and focused.",
            "I recall information easily.",
            "I approach each question with confidence."
        ]
    },
    social: {
        name: 'Social',
        icon: '👥',
        affirmations: [
            "I am genuinely interested in others.",
            "I bring positive energy to every interaction.",
            "I am comfortable being myself.",
            "Connection comes naturally to me."
        ]
    },
    athletic: {
        name: 'Athletic',
        icon: '🏃',
        affirmations: [
            "My body is ready and capable.",
            "I trust my training.",
            "I perform at my peak when it matters.",
            "I am strong, fast, and unstoppable."
        ]
    },
    creative: {
        name: 'Creative',
        icon: '🎨',
        affirmations: [
            "Ideas flow through me effortlessly.",
            "I trust my creative instincts.",
            "I am open to inspiration from everywhere.",
            "My creativity knows no bounds."
        ]
    }
};

// Goal definitions
const GOALS = {
    confident: {
        name: 'Confident',
        icon: '💎',
        color: '#f472b6',
        breathPattern: { inhale: 4, hold: 4, exhale: 4 },
        affirmations: [
            "I believe in myself completely.",
            "I am capable of anything I set my mind to.",
            "Confidence flows through me naturally.",
            "I trust myself and my abilities."
        ]
    },
    calm: {
        name: 'Calm',
        icon: '🌊',
        color: '#06b6d4',
        breathPattern: { inhale: 4, hold: 7, exhale: 8 },
        affirmations: [
            "Peace fills every cell of my body.",
            "I release all tension and worry.",
            "Calmness is my natural state.",
            "I am centered and grounded."
        ]
    },
    focused: {
        name: 'Focused',
        icon: '🎯',
        color: '#8b5cf6',
        breathPattern: { inhale: 4, hold: 4, exhale: 4 },
        affirmations: [
            "My mind is sharp and clear.",
            "I concentrate effortlessly.",
            "Distractions fade away.",
            "I am fully present in this moment."
        ]
    },
    energized: {
        name: 'Energized',
        icon: '⚡',
        color: '#f59e0b',
        breathPattern: { inhale: 2, hold: 0, exhale: 2 },
        affirmations: [
            "Energy surges through my body.",
            "I am alert, awake, and alive.",
            "I have unlimited vitality.",
            "I am ready to perform at my best."
        ]
    }
};

// Format time as M:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

console.log('Before Utils loaded');

