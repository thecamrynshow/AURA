# PNEUOMA Create

Build your own worlds, creatures, and universes. VR-ready creative experiences.

[![World Builder](https://img.shields.io/badge/🌍_World_Builder-Live-4ade80?style=for-the-badge)](https://pneuoma.com/platform/create/world-builder/)
[![Creature Lab](https://img.shields.io/badge/🧬_Creature_Lab-Live-f472b6?style=for-the-badge)](https://pneuoma.com/platform/create/creature-lab/)
[![Planet Explore](https://img.shields.io/badge/🥽_Planet_Explore-VR_Ready-8b5cf6?style=for-the-badge)](https://pneuoma.com/platform/create/planet-explore/)

---

## 🌌 Experiences

### 🌍 World Builder
**Create custom planets from scratch**

- **Terrain Types:** Earth, Ocean, Desert, Ice, Volcanic, Crystal
- **Sky Colors:** Blue, Purple, Pink, Orange, Green, Space (no atmosphere)
- **Suns:** 0-2 suns (yellow primary, blue secondary)
- **Moons:** 0-10 moons with unique colors and orbits
- **Extras:** Planetary rings, aurora borealis
- **Life:** Trees, flowers, mushrooms, birds, fish, creatures
- **Clouds:** Adjustable density
- **Ambient Music:** Generative space soundscape

---

### 🧬 Creature Lab
**Design fantastical life forms**

**Body Options:**
- Shapes: Round, Oval, Blob, Fluffy, Spiky, Long
- Patterns: Solid, Spots, Stripes, Gradient, Sparkle
- Colors: 8 vibrant options
- Glow: Adjustable intensity

**Head Options:**
- Shapes: Round, Triangle, Square, Star
- Eyes: Normal, Big, Sleepy, Alien, Cyclops, Many
- Mouth: Smile, Open, Teeth, Beak, None
- Extras: Horns, Ears, Antenna, Crown

**Limbs:**
- Legs: None, Two, Four, Many, Tentacles
- Wings: None, Butterfly, Bat, Angel, Dragon
- Tail: None, Fluffy, Long, Fish, Devil

**Personality Traits (pick 2):**
Curious, Friendly, Brave, Shy, Playful, Wise, Mischievous, Gentle, Energetic, Dreamy, Protective, Musical

---

### 🌅 Planet Surface (2D)
**Walk around your planet in 2D**

- Time of day cycle
- Weather effects
- Your creatures roaming
- Touch to interact

---

### 🥽 Planet Explore (3D/VR)
**First-person 3D exploration**

**Everything from World Builder carries over:**
- ✅ Terrain type → Ground color, trees, rocks
- ✅ Sky color → 3D sky dome, fog color
- ✅ Suns (0-2) → Actual light sources in sky
- ✅ Moons (0-10) → Orbiting spheres with animation
- ✅ Rings → Giant ring structure in sky
- ✅ Aurora → Glowing curtains in sky
- ✅ Clouds → Fluffy cloud clusters
- ✅ Trees, flowers, mushrooms → 3D models
- ✅ Birds → Flying with wing animation
- ✅ Fish → Swimming ambient life
- ✅ Creatures → Wandering beings

**Controls:**
- **Desktop:** WASD/Arrows to move, Mouse to look
- **Mobile:** Virtual joystick + touch look area
- **VR:** WebXR controllers

**VR Support:**
- Apple Vision Pro
- Meta Quest 2/3/Pro
- Any WebXR-compatible headset

---

### 🌌 Universe Hub
**Host your own solar system**

- Create multiple planets
- Invite friends with codes
- Watch your solar system grow
- Multiplayer exploration

---

## 📁 File Structure

```
platform/create/
├── index.html              # Create hub page
├── create.css              # Shared styles
├── README.md               # This file
│
├── world-builder/
│   ├── index.html
│   ├── styles.css
│   └── src/js/world-builder.js
│
├── creature-lab/
│   ├── index.html
│   ├── styles.css
│   └── src/js/creature-lab.js
│
├── planet-surface/
│   ├── index.html
│   ├── styles.css
│   └── src/js/planet-surface.js
│
├── planet-explore/
│   ├── index.html
│   ├── styles.css
│   └── src/js/planet-explore.js
│
└── universe/
    ├── index.html
    ├── styles.css
    └── src/js/universe.js
```

---

## 🔗 Data Flow

```
World Builder (2D)
    ↓ Save to localStorage
    ↓ Navigate with ?planet=PlanetName
Planet Explore (3D)
    ↓ Load from localStorage
    ↓ Render all customizations
```

### Saved World Data

```javascript
{
    name: "Nova Prime",
    terrain: "crystal",
    skyColor: "purple",
    size: 150,
    clouds: true,
    cloudDensity: 70,
    glowIntensity: 60,
    rotationSpeed: 40,
    lifeforms: ["trees", "flowers", "birds", "creatures"],
    extras: ["ring", "aurora"],
    sunCount: 2,
    moonCount: 5,
    savedAt: "2024-01-15T..."
}
```

---

## 🛠 Technical Stack

### World Builder
- **HTML Canvas** — Starfield background
- **CSS 3D Transforms** — Planet rotation, moons, suns
- **Web Audio API** — Generative ambient music
- **localStorage** — World persistence

### Planet Explore
- **Three.js** — 3D rendering
- **WebXR API** — VR headset support
- **Procedural Generation** — Terrain, mountains, life
- **Shader Materials** — Custom sky dome

### Key Libraries

```html
<!-- Three.js for 3D -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

---

## 🎮 Controls Reference

### World Builder
| Action | Control |
|--------|---------|
| Change terrain | Tap terrain buttons |
| Adjust size | Drag slider |
| Add moons | Drag moon slider (0-10) |
| Add suns | Drag sun slider (0-2) |
| Toggle extras | Tap ring/aurora buttons |
| Randomize | Tap 🎲 button |
| Enter 3D | Tap "🥽 Explore 3D" |

### Planet Explore (Desktop)
| Action | Control |
|--------|---------|
| Move | WASD or Arrow keys |
| Look | Mouse movement |
| Jump | Spacebar |
| Interact | Click creature |

### Planet Explore (Mobile)
| Action | Control |
|--------|---------|
| Move | Left joystick |
| Look | Swipe right side |
| Interact | Tap creature |

### Planet Explore (VR)
| Action | Control |
|--------|---------|
| Move | Left thumbstick |
| Look | Head movement |
| Interact | Controller trigger |

---

## 🎨 Terrain Configurations

| Terrain | Ground Color | Sky | Fog | Trees |
|---------|--------------|-----|-----|-------|
| Earth | Green | Blue | Light blue | Green conifers |
| Ocean | Blue | Cyan | Light cyan | Teal kelp |
| Desert | Orange | Yellow | Cream | Brown cacti |
| Ice | Light blue | White | Pale | Blue crystals |
| Volcanic | Dark red | Dark | Gray | Dead trees |
| Crystal | Purple | Violet | Purple | Crystal shards |

---

## 🌙 Moon System

Each moon has:
- Unique color from palette of 10
- Independent orbit radius
- Random orbit speed (6-20 seconds)
- Gentle Y-axis bobbing
- Slow self-rotation

```javascript
const moonColors = [
    '#e5e7eb', // Gray
    '#fcd34d', // Gold
    '#c084fc', // Purple
    '#ef4444', // Red
    '#34d399', // Green
    '#f472b6', // Pink
    '#fb923c', // Orange
    '#67e8f9', // Cyan
    '#fde047', // Yellow
    '#a78bfa'  // Violet
];
```

---

## 🐦 Life Systems

### Birds
- Flapping wing animation (sine wave)
- Circular flight patterns
- Terrain-specific colors
- Dynamic flock behavior

### Fish
- Swimming motion
- Water-level constraint
- Colorful variety
- School behavior

### Ambient Creatures
- Wandering AI
- Look at player when close
- Bounce animation
- Interaction popup

---

## 📄 License

Part of the PNEUOMA platform. Proprietary.

For inquiries: camrynjackson@pneuoma.com

