/**
 * Creature Lab - PNEUOMA Create
 * Design fantastical creatures from parts
 */

class CreatureLab {
    constructor() {
        this.creatureName = 'New Creature';
        this.bodyType = 'round';
        this.headType = 'round';
        this.eyeType = 'normal';
        this.mouthType = 'smile';
        this.legType = 'none';
        this.wingType = 'none';
        this.tailType = 'none';
        this.headExtras = [];
        this.color = 'pink';
        this.pattern = 'solid';
        this.bodySize = 100;
        this.glowIntensity = 30;
        this.traits = ['Curious', 'Friendly'];
        
        // Colors
        this.colorValues = {
            pink: { main: '#f472b6', light: '#f9a8d4', dark: '#db2777' },
            purple: { main: '#a78bfa', light: '#c4b5fd', dark: '#7c3aed' },
            blue: { main: '#60a5fa', light: '#93c5fd', dark: '#2563eb' },
            cyan: { main: '#22d3ee', light: '#67e8f9', dark: '#0891b2' },
            green: { main: '#4ade80', light: '#86efac', dark: '#16a34a' },
            yellow: { main: '#facc15', light: '#fde047', dark: '#ca8a04' },
            orange: { main: '#fb923c', light: '#fdba74', dark: '#ea580c' },
            red: { main: '#f87171', light: '#fca5a5', dark: '#dc2626' }
        };
        
        // Audio
        this.audioContext = null;
        this.musicPlaying = false;
        this.musicNodes = [];
        
        this.init();
    }
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updateCreature();
    }
    
    // ==================== AUDIO ====================
    
    initAudio() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.25;
        this.masterGain.connect(this.audioContext.destination);
    }
    
    startMusic() {
        if (!this.audioContext) this.initAudio();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.musicPlaying = true;
        document.getElementById('music-toggle').classList.add('playing');
        document.querySelector('.music-icon').textContent = '🔊';
        
        // Playful, curious ambient sound
        this.createLabAmbience();
    }
    
    createLabAmbience() {
        // Bubbly base
        const bubbleOsc = this.audioContext.createOscillator();
        const bubbleGain = this.audioContext.createGain();
        const bubbleFilter = this.audioContext.createBiquadFilter();
        
        bubbleOsc.type = 'sine';
        bubbleOsc.frequency.value = 200;
        bubbleFilter.type = 'lowpass';
        bubbleFilter.frequency.value = 400;
        bubbleGain.gain.value = 0.1;
        
        // LFO for bubble effect
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 2;
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain);
        lfoGain.connect(bubbleOsc.frequency);
        lfo.start();
        
        bubbleOsc.connect(bubbleFilter);
        bubbleFilter.connect(bubbleGain);
        bubbleGain.connect(this.masterGain);
        bubbleOsc.start();
        
        this.musicNodes.push({ osc: bubbleOsc, gain: bubbleGain, lfo });
        
        // Magical chimes
        this.chimeInterval = setInterval(() => {
            if (this.musicPlaying) this.playChime();
        }, 2000 + Math.random() * 3000);
        
        // Harmonic pad
        [262, 330, 392].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.value = 0.03;
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            
            this.musicNodes.push({ osc, gain });
        });
    }
    
    playChime() {
        if (!this.musicPlaying) return;
        
        const notes = [523, 659, 784, 880, 1047]; // C5, E5, G5, A5, C6
        const freq = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.08;
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 1.5);
    }
    
    stopMusic() {
        this.musicPlaying = false;
        document.getElementById('music-toggle').classList.remove('playing');
        document.querySelector('.music-icon').textContent = '🔇';
        
        if (this.chimeInterval) clearInterval(this.chimeInterval);
        
        this.musicNodes.forEach(node => {
            if (node.gain) {
                node.gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
            }
            setTimeout(() => {
                if (node.osc) node.osc.stop();
                if (node.lfo) node.lfo.stop();
            }, 600);
        });
        
        this.musicNodes = [];
    }
    
    toggleMusic() {
        if (this.musicPlaying) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        this.vibrate([15]);
    }
    
    // ==================== SETUP ====================
    
    cacheElements() {
        this.startScreen = document.getElementById('start-screen');
        this.labScreen = document.getElementById('lab-screen');
        this.creature = document.getElementById('creature');
        this.body = document.getElementById('body');
        this.head = document.getElementById('head');
        this.eyes = document.getElementById('eyes');
        this.mouth = document.getElementById('mouth');
        this.headExtrasEl = document.getElementById('head-extras');
        this.legs = document.getElementById('legs');
        this.wingLeft = document.getElementById('wing-left');
        this.wingRight = document.getElementById('wing-right');
        this.tail = document.getElementById('tail');
        this.creatureNameEl = document.getElementById('creature-name');
        this.nameModal = document.getElementById('name-modal');
        this.nameInput = document.getElementById('name-input');
        this.saveModal = document.getElementById('save-modal');
    }
    
    setupEventListeners() {
        // Begin button
        document.getElementById('begin-btn').addEventListener('click', () => {
            this.showLab();
        });
        
        // Music toggle
        document.getElementById('music-toggle').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchPanel(tab));
        });
        
        // Body type
        document.querySelectorAll('[data-body]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-body]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.bodyType = btn.dataset.body;
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Head type
        document.querySelectorAll('[data-head]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-head]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.headType = btn.dataset.head;
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Eyes
        document.querySelectorAll('[data-eyes]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-eyes]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.eyeType = btn.dataset.eyes;
                this.updateCreature();
                this.vibrate([15]);
            });
        });
        
        // Mouth
        document.querySelectorAll('[data-mouth]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-mouth]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mouthType = btn.dataset.mouth;
                this.updateCreature();
                this.vibrate([15]);
            });
        });
        
        // Head extras (toggle)
        document.querySelectorAll('[data-extra]').forEach(btn => {
            btn.addEventListener('click', () => {
                const extra = btn.dataset.extra;
                btn.classList.toggle('active');
                
                if (this.headExtras.includes(extra)) {
                    this.headExtras = this.headExtras.filter(e => e !== extra);
                } else {
                    // Only allow one extra at a time
                    this.headExtras = [extra];
                    document.querySelectorAll('[data-extra]').forEach(b => {
                        if (b !== btn) b.classList.remove('active');
                    });
                }
                
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Legs
        document.querySelectorAll('[data-legs]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-legs]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.legType = btn.dataset.legs;
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Wings
        document.querySelectorAll('[data-wings]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-wings]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.wingType = btn.dataset.wings;
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Tail
        document.querySelectorAll('[data-tail]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-tail]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.tailType = btn.dataset.tail;
                this.updateCreature();
                this.vibrate([20]);
            });
        });
        
        // Color
        document.querySelectorAll('[data-color]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-color]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.color = btn.dataset.color;
                this.updateCreature();
                this.vibrate([15]);
            });
        });
        
        // Pattern
        document.querySelectorAll('[data-pattern]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-pattern]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.pattern = btn.dataset.pattern;
                this.updateCreature();
                this.vibrate([15]);
            });
        });
        
        // Body size
        document.getElementById('body-size').addEventListener('input', (e) => {
            this.bodySize = parseInt(e.target.value);
            this.creature.style.transform = `scale(${this.bodySize / 100})`;
        });
        
        // Glow intensity
        document.getElementById('glow-intensity').addEventListener('input', (e) => {
            this.glowIntensity = parseInt(e.target.value);
            this.updateCreature();
        });
        
        // Traits
        document.querySelectorAll('.trait-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const trait = btn.dataset.trait;
                
                if (btn.classList.contains('active')) {
                    // Deselect
                    btn.classList.remove('active');
                    this.traits = this.traits.filter(t => t !== trait);
                } else {
                    // Select (max 2)
                    if (this.traits.length < 2) {
                        btn.classList.add('active');
                        this.traits.push(trait);
                    } else {
                        // Replace oldest
                        const oldTrait = this.traits.shift();
                        document.querySelector(`[data-trait="${oldTrait}"]`).classList.remove('active');
                        btn.classList.add('active');
                        this.traits.push(trait);
                    }
                }
                
                this.updateTraitsDisplay();
                this.vibrate([15]);
            });
        });
        
        // Randomize
        document.getElementById('randomize-btn').addEventListener('click', () => {
            this.randomize();
        });
        
        // Animate
        document.getElementById('animate-btn').addEventListener('click', () => {
            this.animateCreature();
        });
        
        // Save
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveCreature();
        });
        
        // Rename
        document.getElementById('rename-btn').addEventListener('click', () => {
            this.nameInput.value = this.creatureName === 'New Creature' ? '' : this.creatureName;
            this.nameModal.classList.add('active');
            this.nameInput.focus();
        });
        
        // Name modal
        document.getElementById('name-cancel').addEventListener('click', () => {
            this.nameModal.classList.remove('active');
        });
        
        document.getElementById('name-save').addEventListener('click', () => {
            if (this.nameInput.value.trim()) {
                this.creatureName = this.nameInput.value.trim();
                this.creatureNameEl.textContent = this.creatureName;
            }
            this.nameModal.classList.remove('active');
        });
        
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('name-save').click();
            }
        });
        
        // Save modal close
        document.getElementById('save-close').addEventListener('click', () => {
            this.saveModal.classList.remove('active');
        });
    }
    
    showLab() {
        this.startScreen.classList.remove('active');
        this.labScreen.classList.add('active');
        this.vibrate([30, 50, 30]);
    }
    
    switchPanel(tab) {
        document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.panel-content').forEach(p => p.classList.remove('active'));
        document.getElementById(`${tab.dataset.panel}-panel`).classList.add('active');
        
        this.vibrate([10]);
    }
    
    // ==================== CREATURE UPDATES ====================
    
    updateCreature() {
        const colors = this.colorValues[this.color];
        
        // Set CSS variables
        document.documentElement.style.setProperty('--creature-color', colors.main);
        document.documentElement.style.setProperty('--creature-color-light', colors.light);
        document.documentElement.style.setProperty('--creature-color-dark', colors.dark);
        
        // Body
        this.body.className = `creature-part body ${this.bodyType}`;
        
        // Head
        this.head.className = `creature-part head ${this.headType}`;
        
        // Eyes
        this.eyes.className = `eyes ${this.eyeType}`;
        
        // Mouth
        this.mouth.className = `mouth ${this.mouthType}`;
        
        // Head extras
        this.headExtrasEl.className = `extras ${this.headExtras.join(' ')}`;
        
        // Legs
        this.legs.className = `creature-part legs ${this.legType}`;
        
        // Wings
        this.wingLeft.className = `creature-part wing wing-left ${this.wingType}`;
        this.wingRight.className = `creature-part wing wing-right ${this.wingType}`;
        if (this.wingType !== 'none') {
            this.wingLeft.classList.add('visible');
            this.wingRight.classList.add('visible');
        }
        
        // Tail
        this.tail.className = `creature-part tail ${this.tailType}`;
        if (this.tailType !== 'none') {
            this.tail.classList.add('visible');
        }
        
        // Pattern
        this.creature.className = `creature ${this.pattern}`;
        
        // Glow
        const glowOpacity = this.glowIntensity / 100;
        this.body.style.boxShadow = `
            0 0 ${30 * glowOpacity}px ${colors.main}80,
            inset -10px -10px 30px rgba(0, 0, 0, 0.3),
            inset 5px 5px 15px rgba(255, 255, 255, 0.2)
        `;
    }
    
    updateTraitsDisplay() {
        const display = document.getElementById('personality-display');
        display.innerHTML = this.traits.map(t => `<span class="trait">${t}</span>`).join('');
    }
    
    animateCreature() {
        this.creature.classList.add('animate');
        this.vibrate([30, 30, 30]);
        
        // Play a sound
        if (this.audioContext) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = 400;
            osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        }
        
        setTimeout(() => {
            this.creature.classList.remove('animate');
        }, 600);
    }
    
    randomize() {
        // Random body
        const bodies = ['round', 'oval', 'blob', 'fluffy', 'spiky', 'long'];
        this.bodyType = bodies[Math.floor(Math.random() * bodies.length)];
        document.querySelectorAll('[data-body]').forEach(b => {
            b.classList.toggle('active', b.dataset.body === this.bodyType);
        });
        
        // Random head
        const heads = ['round', 'triangle', 'square', 'star'];
        this.headType = heads[Math.floor(Math.random() * heads.length)];
        document.querySelectorAll('[data-head]').forEach(b => {
            b.classList.toggle('active', b.dataset.head === this.headType);
        });
        
        // Random eyes
        const eyeTypes = ['normal', 'big', 'sleepy', 'alien', 'cyclops', 'many'];
        this.eyeType = eyeTypes[Math.floor(Math.random() * eyeTypes.length)];
        document.querySelectorAll('[data-eyes]').forEach(b => {
            b.classList.toggle('active', b.dataset.eyes === this.eyeType);
        });
        
        // Random mouth
        const mouths = ['smile', 'open', 'teeth', 'beak', 'none'];
        this.mouthType = mouths[Math.floor(Math.random() * mouths.length)];
        document.querySelectorAll('[data-mouth]').forEach(b => {
            b.classList.toggle('active', b.dataset.mouth === this.mouthType);
        });
        
        // Random legs
        const legTypes = ['none', 'two', 'four', 'many', 'tentacles'];
        this.legType = legTypes[Math.floor(Math.random() * legTypes.length)];
        document.querySelectorAll('[data-legs]').forEach(b => {
            b.classList.toggle('active', b.dataset.legs === this.legType);
        });
        
        // Random wings
        const wingTypes = ['none', 'butterfly', 'bat', 'angel', 'dragon'];
        this.wingType = Math.random() > 0.5 ? wingTypes[Math.floor(Math.random() * wingTypes.length)] : 'none';
        document.querySelectorAll('[data-wings]').forEach(b => {
            b.classList.toggle('active', b.dataset.wings === this.wingType);
        });
        
        // Random tail
        const tailTypes = ['none', 'fluffy', 'long', 'fish', 'devil'];
        this.tailType = Math.random() > 0.4 ? tailTypes[Math.floor(Math.random() * tailTypes.length)] : 'none';
        document.querySelectorAll('[data-tail]').forEach(b => {
            b.classList.toggle('active', b.dataset.tail === this.tailType);
        });
        
        // Random extras
        const extras = ['horns', 'ears', 'antenna', 'crown'];
        this.headExtras = Math.random() > 0.5 ? [extras[Math.floor(Math.random() * extras.length)]] : [];
        document.querySelectorAll('[data-extra]').forEach(b => {
            b.classList.toggle('active', this.headExtras.includes(b.dataset.extra));
        });
        
        // Random color
        const colors = Object.keys(this.colorValues);
        this.color = colors[Math.floor(Math.random() * colors.length)];
        document.querySelectorAll('[data-color]').forEach(b => {
            b.classList.toggle('active', b.dataset.color === this.color);
        });
        
        // Random pattern
        const patterns = ['solid', 'spots', 'stripes', 'gradient', 'sparkle'];
        this.pattern = patterns[Math.floor(Math.random() * patterns.length)];
        document.querySelectorAll('[data-pattern]').forEach(b => {
            b.classList.toggle('active', b.dataset.pattern === this.pattern);
        });
        
        // Random traits
        const allTraits = ['Curious', 'Friendly', 'Brave', 'Shy', 'Playful', 'Wise', 'Mischievous', 'Gentle', 'Energetic', 'Dreamy', 'Protective', 'Musical'];
        const shuffled = allTraits.sort(() => 0.5 - Math.random());
        this.traits = shuffled.slice(0, 2);
        document.querySelectorAll('.trait-btn').forEach(b => {
            b.classList.toggle('active', this.traits.includes(b.dataset.trait));
        });
        this.updateTraitsDisplay();
        
        // Generate random name
        const prefixes = ['Snorf', 'Blip', 'Zuzu', 'Floof', 'Wisp', 'Boop', 'Puff', 'Glim', 'Squee', 'Nib'];
        const suffixes = ['kins', 'bert', 'ling', 'oo', 'ie', 'us', 'ara', 'ix', 'o', 'y'];
        this.creatureName = prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
        this.creatureNameEl.textContent = this.creatureName;
        
        this.updateCreature();
        this.animateCreature();
        this.vibrate([50, 30, 50, 30, 50]);
    }
    
    saveCreature() {
        const creatureData = {
            name: this.creatureName,
            bodyType: this.bodyType,
            headType: this.headType,
            eyeType: this.eyeType,
            mouthType: this.mouthType,
            legType: this.legType,
            wingType: this.wingType,
            tailType: this.tailType,
            headExtras: this.headExtras,
            color: this.color,
            pattern: this.pattern,
            bodySize: this.bodySize,
            glowIntensity: this.glowIntensity,
            traits: this.traits,
            savedAt: new Date().toISOString()
        };
        
        let creatures = JSON.parse(localStorage.getItem('pneuoma-creatures') || '[]');
        creatures.push(creatureData);
        localStorage.setItem('pneuoma-creatures', JSON.stringify(creatures));
        
        document.getElementById('save-message').textContent = 
            `"${this.creatureName}" has been added to your collection!`;
        this.saveModal.classList.add('active');
        this.vibrate([30, 30, 30]);
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.creatureLab = new CreatureLab();
});

