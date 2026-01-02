/* ============================================
   SONGBIRD — Utility Functions
   ============================================ */

// Clamp value
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Random float
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Random integer
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random pick from array
function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Musical notes and frequencies
const NOTES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.00
};

// Get note name from frequency
function frequencyToNote(freq) {
    if (freq < 200) return null;
    
    let closest = null;
    let minDiff = Infinity;
    
    for (const [note, noteFreq] of Object.entries(NOTES)) {
        const diff = Math.abs(freq - noteFreq);
        if (diff < minDiff) {
            minDiff = diff;
            closest = note;
        }
    }
    
    // Only return if close enough (within 20Hz)
    return minDiff < 30 ? closest : null;
}

// Normalize frequency to 0-1 range (for pitch indicator)
function normalizePitch(freq) {
    const minFreq = 200;
    const maxFreq = 1000;
    return clamp((freq - minFreq) / (maxFreq - minFreq), 0, 1);
}

// Bird types
const BIRD_TYPES = [
    { name: 'Robin', emoji: '🐦', color: '#ef6461', notes: ['E4', 'G4', 'E4'] },
    { name: 'Dove', emoji: '🕊️', color: '#a8d8ea', notes: ['C4', 'E4', 'G4'] },
    { name: 'Canary', emoji: '🐤', color: '#ffd166', notes: ['G4', 'A4', 'G4', 'E4'] },
    { name: 'Bluebird', emoji: '🐦', color: '#5da9e9', notes: ['D4', 'F4', 'A4'] },
    { name: 'Finch', emoji: '🐦', color: '#7bc950', notes: ['E4', 'E4', 'G4', 'G4'] }
];

console.log('Songbird Utils loaded');


