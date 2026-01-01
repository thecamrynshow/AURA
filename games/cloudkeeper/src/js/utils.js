/* ============================================
   CLOUD KEEPER — Utility Functions
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

// Pick random item from array
function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Encouragement messages for kids
const ENCOURAGEMENTS = [
    "Great job! 🌟",
    "Wow! ✨",
    "You did it! 🎉",
    "Amazing! 🌈",
    "So good! ⭐",
    "Yay! 🎈",
    "Super! 💫",
    "Wonderful! 🌸",
    "Perfect! 🎀",
    "Hooray! 🦋"
];

// Get random encouragement
function getEncouragement() {
    return randomPick(ENCOURAGEMENTS);
}

// Easing functions
function easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
        return n1 * t * t;
    } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// Check if point is inside circle
function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) <= radius;
}

// Vibrate if supported (gentle)
function gentleVibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(30);
    }
}

console.log('Cloud Keeper Utils loaded');

