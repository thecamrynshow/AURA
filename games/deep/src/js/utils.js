/* ============================================
   THE DEEP — Utility Functions
   ============================================ */

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Smooth step interpolation
function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
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

// Format time as mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parse hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// RGB to hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Lerp between two colors
function lerpColor(color1, color2, t) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    return rgbToHex(
        lerp(c1.r, c2.r, t),
        lerp(c1.g, c2.g, t),
        lerp(c1.b, c2.b, t)
    );
}

// Depth zones
const DEPTH_ZONES = {
    surface: {
        name: 'Surface',
        range: [0, 100],
        colors: {
            top: '#87CEEB',
            bottom: '#1E90FF'
        },
        lightLevel: 1.0,
        particleDensity: 0.3
    },
    twilight: {
        name: 'Twilight Zone',
        range: [100, 500],
        colors: {
            top: '#1E90FF',
            bottom: '#191970'
        },
        lightLevel: 0.5,
        particleDensity: 0.5
    },
    midnight: {
        name: 'Midnight Zone',
        range: [500, 1000],
        colors: {
            top: '#191970',
            bottom: '#0a0a1a'
        },
        lightLevel: 0.1,
        particleDensity: 0.7
    },
    abyss: {
        name: 'The Abyss',
        range: [1000, 2000],
        colors: {
            top: '#0a0a1a',
            bottom: '#000005'
        },
        lightLevel: 0.0,
        particleDensity: 0.9
    }
};

// Get zone by depth
function getZoneByDepth(depth) {
    for (const [key, zone] of Object.entries(DEPTH_ZONES)) {
        if (depth >= zone.range[0] && depth < zone.range[1]) {
            return { key, ...zone };
        }
    }
    return { key: 'abyss', ...DEPTH_ZONES.abyss };
}

// Get interpolated color for depth
function getDepthColor(depth) {
    const zones = Object.values(DEPTH_ZONES);
    
    for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        if (depth >= zone.range[0] && depth < zone.range[1]) {
            const t = (depth - zone.range[0]) / (zone.range[1] - zone.range[0]);
            return {
                top: lerpColor(zone.colors.top, zone.colors.bottom, t * 0.5),
                bottom: lerpColor(zone.colors.top, zone.colors.bottom, 0.5 + t * 0.5)
            };
        }
    }
    
    // Default to abyss
    return DEPTH_ZONES.abyss.colors;
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

console.log('The Deep Utils loaded');



