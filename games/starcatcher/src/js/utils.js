/* Star Catcher - Utility Functions */

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
    
    easeOutQuad(t) {
        return t * (2 - t);
    },
    
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

console.log('Star Catcher Utils loaded');

