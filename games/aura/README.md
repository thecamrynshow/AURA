# Project AURA — Flagship Regulation Game

A breath-controlled exploration game that actively regulates the nervous system through gameplay mechanics.

[![Play Now](https://img.shields.io/badge/Play-pneuoma.com%2Fgames%2Faura-06b6d4)](https://pneuoma.com/games/aura/)
[![Platform](https://img.shields.io/badge/Platform-Web%20(Mobile%20%26%20Desktop)-blue)]()
[![Session](https://img.shields.io/badge/Session-5--12%20min-green)]()
[![Ages](https://img.shields.io/badge/Ages-8%2B-orange)]()

---

## 🧩 Core Concept

**Your breath controls everything.**

Project AURA is a floating-world exploration game where the player's breathing patterns directly affect:
- Movement speed and fluidity
- World visibility and brightness
- Music harmony and tempo
- Challenge accessibility

**Primary Goal:** Player exits calmer than when they entered.

---

## 🎮 How to Play

### Controls

| Input | Action |
|-------|--------|
| **Joystick (Mobile)** | Touch and drag to move |
| **WASD / Arrows (Desktop)** | Move around the world |
| **Microphone** | Breath detection (auto-enabled) |

### Breath Mechanics

| Breath Pattern | World Response |
|----------------|----------------|
| Fast / chaotic | Fog increases, movement slows, sky dims |
| Slow & steady | Clarity increases, movement smooth, sky brightens |
| Deep exhale | Bridges form, hidden paths reveal |
| Breath hold | Special interactions unlock |

---

## 🌿 The World: Field of Still Water

A vast glowing landscape featuring:
- ✨ Floating islands with gentle animations
- 🌬️ Dynamic wind particles
- 🌟 Glowing star field (brightness tied to breath)
- 🌈 Soft sky gradients that shift with regulation
- 🎵 Ambient soundscape that responds to coherence

**No enemies. No timers. No score.**

---

## 🔮 Challenges (4 Total)

### Challenge 1: The Wind Crossing
A floating bridge with strong wind pushing against you.
- **Objective:** Cross to the other side
- **Mechanic:** Slow, steady breathing counters the wind
- **Reward:** Path to new area opens

### Challenge 2: The Crystal Grove
Crystals humming out of sync, creating dissonance.
- **Objective:** Restore harmony to the grove
- **Mechanic:** Hold breath steady, tap crystals in rhythm
- **Reward:** Crystals align, music resolves

### Challenge 3: The Light Animal
A glowing creature appears, startled and cautious.
- **Objective:** Calm the creature, form a connection
- **Mechanic:** Sit still, breathe slowly, emit calming pulses
- **Reward:** Creature follows you, guides to secrets

### Challenge 4: The Aurora Veil ⭐ NEW
A shimmering aurora barrier blocking a hidden realm.
- **Objective:** Pass through the veil
- **Mechanic:** Achieve sustained breath coherence
- **Reward:** Access to the most peaceful zone

---

## 🎵 Audio System

The dynamic audio responds to your state:

| Player State | Audio Response |
|--------------|----------------|
| Calm breath | Harmony increases, tempo slows |
| Coherent pattern | Bass deepens, chords resolve |
| Long exhale | Melodic phrases complete |
| Dysregulated | Subtle dissonance, distant thunder |

This trains the vagus nerve through auditory biofeedback.

---

## 📱 Mobile Optimization

Project AURA is optimized for mobile devices:

- **3x sensitivity boost** on iOS/Android microphones
- **RMS-based volume detection** for reliable breath capture
- **Hysteresis** to prevent flickering between states
- **Touch-friendly joystick** with responsive feel
- **Auto-rotation** support

Works great on:
- iPhones (iOS 14+)
- iPads
- Android phones/tablets
- Desktop browsers (Chrome, Safari, Firefox, Edge)

---

## 🌈 Session Flow

### Entry
1. Ambient music begins softly
2. World fades in from warm glow
3. Brief instruction overlay
4. Microphone permission requested

### Exploration
- Free roaming through the world
- Discover challenges organically
- No required order or completion

### Closure
Every session ends with:
1. Soft light envelops the screen
2. Final guided breath cycle (3 breaths)
3. Fade to warm amber glow
4. Message: *"Your nervous system is balanced."*

This closure prevents dopamine addiction loops.

---

## 🧠 PNEU Integration

After each session, the game tracks:
- **Breath stability score** (0-100)
- **Regulation curve** (how quickly you calmed)
- **Coherence peaks** (longest sustained calm)
- **Recovery speed** (time to re-regulate after challenge)

Over time, PNEU learns:
- What environments regulate this player
- How long their nervous system takes to settle
- Which stimuli dysregulate them

---

## 🔧 Technical Details

### Technologies
- **HTML5 Canvas** — 60fps rendering with DPR scaling
- **Web Audio API** — Dynamic generative music
- **MediaDevices API** — Microphone breath detection
- **LocalStorage** — PNEU profile persistence

### Browser Support
| Browser | Support |
|---------|---------|
| Chrome (Desktop & Mobile) | ✅ Full |
| Safari (macOS & iOS) | ✅ Full |
| Firefox | ✅ Full |
| Edge | ✅ Full |

### Permissions
- 🎤 Microphone access (required for breath detection)

---

## 📁 File Structure

```
games/aura/
├── index.html           # Main entry point
├── README.md            # This file
└── src/
    ├── css/
    │   └── styles.css   # Styling + canvas setup
    └── js/
        ├── utils.js     # Utility functions
        ├── audio.js     # Dynamic audio engine
        ├── breath.js    # Breath detection (mobile optimized)
        ├── world.js     # World rendering + zones
        ├── player.js    # Player controller + joystick
        ├── challenges.js # Challenge system (4 challenges)
        ├── pneu.js      # PNEU profile integration
        └── main.js      # Game controller
```

---

## 🚀 Local Development

```bash
# From project root
cd games/aura

# Start local server
python3 -m http.server 8000
# or
npx serve

# Open http://localhost:8000
```

### Mobile Testing
1. Find your computer's local IP (e.g., `192.168.1.100`)
2. On your phone, visit `http://192.168.1.100:8000`
3. Ensure both devices are on the same WiFi network

---

## 🎯 Design Principles

1. **Regulate, don't stimulate** — No mechanics that increase arousal
2. **Reward calm** — Better gameplay when regulated
3. **No punishment** — Dysregulation just slows, never damages
4. **Closure matters** — Every session ends intentionally
5. **The player's body is the controller** — Breath > buttons

---

## 📊 Success Metrics

A successful session means:
- ✅ Player exits calmer than when they entered
- ✅ Player reports increased focus post-play
- ✅ Player willingly returns without craving/compulsion
- ✅ Parent/teacher sees behavioral shift within days

---

## 🔮 Future Development

- [ ] Additional challenge zones
- [ ] Biometric sensor integration (heart rate via smartwatch)
- [ ] Multiplayer calm sessions (2-4 players)
- [ ] Procedurally generated islands
- [ ] Weather system tied to collective breath
- [ ] AR mode (project world onto real space)

---

## 📄 License

Part of the PNEUOMA platform. Proprietary.

For therapeutic or educational licensing: camrynjackson@pneuoma.com

---

*"Your nervous system is balanced."*
