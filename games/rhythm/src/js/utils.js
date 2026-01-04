/* Rhythm Islands - Utility Functions */

const Utils = {
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },
    
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    randomInt(min, max) {
        return Math.floor(Utils.random(min, max + 1));
    },
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },
    
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
};

console.log('Rhythm Utils loaded');


