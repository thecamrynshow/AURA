# Project AURA — Regulation Game Prototype v1

A game designed to actively regulate the nervous system through breath-based gameplay mechanics.

![Project AURA](https://img.shields.io/badge/Platform-Mobile%20Web-blue)
![Session Length](https://img.shields.io/badge/Session-5--12%20min-green)
![Ages](https://img.shields.io/badge/Ages-8%2B-orange)

## 🧩 Prototype Goal

**Primary Goal:** Demonstrate that gameplay can actively regulate the nervous system.

**Success Metrics:**
- Player exits calmer than when they entered
- Player reports increased focus
- Player willingly returns without craving/compulsion
- Parent/teacher sees behavioral shift within days

## 🎮 How to Play

### Running the Game

1. **Local Server (Recommended)**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8000
   ```

2. Open `http://localhost:8000` in your browser (Chrome/Safari recommended)

3. **For Mobile:** Open the same URL on your phone while on the same network

### Controls

- **Joystick (Mobile):** Touch and drag the on-screen joystick to move
- **Keyboard (Desktop):** WASD or Arrow keys to move
- **Breath:** Breathe into your device's microphone - the game responds to your breath patterns

## 🌿 The World: Field of Still Water

A vast glowing landscape featuring:
- Floating islands
- Gentle wind
- Glowing pathways
- Soft sky gradients
- Distant mountains
- Ambient light creatures

**No enemies. No timers. No score.**

## 🫁 Core Mechanic: Breath = Power

The microphone detects your breath patterns:

| Breath Pattern | World Response |
|----------------|----------------|
| Fast / chaotic | Fog increases, movement slows |
| Slow & steady | Clarity increases, movement smooth |
| Deep exhale | Bridges form, paths open |

## 🧭 Movement System

Movement is tied to your breath state:

**When breath is calm:**
- Glide farther
- Jump higher
- World brightens
- Music resolves into harmony

**When breath is dysregulated:**
- Gravity increases
- Sky dims
- Sounds distort slightly

## 🔮 Challenges

### Challenge 1: The Wind Crossing
A floating bridge appears with strong wind pushing against you. Cross by:
- Slowing your breathing
- Matching the pulse pattern
- Remaining steady

### Challenge 2: The Crystal Grove
Crystals hum out of sync. Restore harmony by:
- Holding breath steady
- Tapping crystals in rhythm with your pulse
- Listening deeply

### Challenge 3: The Light Animal
A glowing creature appears frightened. Connect with it by:
- Sitting still
- Breathing slowly
- Emitting calming pulses

## 🎵 Audio System

Music is dynamic and responsive:
- Tempo slows as breath slows
- Harmonics increase with coherence
- Bass stabilizes with long exhales

This trains the vagus nerve directly.

## 🌈 End of Session Ritual

Every session ends with:
- Soft light
- Final deep breath cycle
- Screen fades to warm glow
- Message: "Your nervous system is balanced."

This closure prevents dopamine addiction loops.

## 🧠 PNEU Integration

After each session, the game tracks:
- Breath stability score
- Regulation curve
- Recovery speed

Over time, PNEU learns:
- What environments regulate each player
- How long their nervous system takes to settle
- Which stimuli dysregulate them

## 🔧 Technical Details

### Technologies Used
- HTML5 Canvas for rendering
- Web Audio API for dynamic audio
- MediaDevices API for microphone input
- LocalStorage for PNEU profile persistence

### Browser Support
- Chrome (Desktop & Mobile) ✅
- Safari (Desktop & iOS) ✅
- Firefox ✅
- Edge ✅

### Permissions Required
- Microphone access (for breath detection)

## 📁 Project Structure

```
project-aura/
├── index.html          # Main entry point
├── README.md           # This file
└── src/
    ├── css/
    │   └── styles.css  # All styling
    └── js/
        ├── utils.js    # Utility functions
        ├── audio.js    # Dynamic audio system
        ├── breath.js   # Breath detection
        ├── world.js    # World rendering
        ├── player.js   # Player controller
        ├── challenges.js # Challenge system
        ├── pneu.js     # PNEU integration
        └── main.js     # Game controller
```

## 🚀 Future Development

- [ ] iOS native app
- [ ] Biometric sensor integration (heart rate)
- [ ] Multiplayer calm sessions
- [ ] Additional worlds and challenges
- [ ] Parent/teacher dashboard
- [ ] Cloud PNEU sync

## 📄 License

MIT License - Feel free to use and modify for therapeutic and educational purposes.

---

*"Your nervous system is balanced."*
