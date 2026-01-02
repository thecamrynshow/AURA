/* ============================================
   SOLFÈGE — Utility Functions
   ============================================ */

// Clamp value
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Random pick from array
function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Solfege system
const SOLFEGE = {
    'C4': { name: 'Do', color: '#e94560' },
    'D4': { name: 'Re', color: '#ff6b35' },
    'E4': { name: 'Mi', color: '#f7c52d' },
    'F4': { name: 'Fa', color: '#26c485' },
    'G4': { name: 'Sol', color: '#3498db' },
    'A4': { name: 'La', color: '#9b59b6' },
    'B4': { name: 'Ti', color: '#e056fd' },
    'C5': { name: 'Do', color: '#e94560' }
};

// Note frequencies (in Hz)
const NOTE_FREQUENCIES = {
    'C4': 261.63,
    'C#4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'B4': 493.88,
    'C5': 523.25
};

// Get solfege from frequency
function frequencyToSolfege(freq) {
    if (freq < 200 || freq > 600) return null;
    
    let closestNote = null;
    let minDiff = Infinity;
    
    for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
        const diff = Math.abs(freq - noteFreq);
        if (diff < minDiff) {
            minDiff = diff;
            closestNote = note;
        }
    }
    
    // Only return if close enough (within 15Hz - more forgiving)
    if (minDiff < 25 && SOLFEGE[closestNote]) {
        return {
            note: closestNote,
            solfege: SOLFEGE[closestNote].name,
            color: SOLFEGE[closestNote].color
        };
    }
    
    return null;
}

// Get note name from solfege
function solfegeToNote(solfegeName, octave = 4) {
    for (const [note, data] of Object.entries(SOLFEGE)) {
        if (data.name === solfegeName && (octave === 4 ? note.includes('4') : note.includes('5'))) {
            return note;
        }
    }
    return null;
}

// Keyboard mapping to notes
const KEYBOARD_MAP = {
    'a': 'C4',  // Do
    's': 'D4',  // Re
    'd': 'E4',  // Mi
    'f': 'F4',  // Fa
    'g': 'G4',  // Sol
    'h': 'A4',  // La
    'j': 'B4',  // Ti
    'k': 'C5'   // Do (high)
};

console.log('Solfege Utils loaded');


