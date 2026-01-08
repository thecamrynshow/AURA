# PNEUOMA — The #1 Nervous System Regulation Games Platform

[![Live Site](https://img.shields.io/badge/🌐_Live-pneuoma.com-06b6d4?style=for-the-badge)](https://pneuoma.com)
[![Games](https://img.shields.io/badge/🎮_Games-30+_Live-8b5cf6?style=for-the-badge)](https://pneuoma.com/platform/games/)
[![Create](https://img.shields.io/badge/🌌_Create-VR_Ready-f472b6?style=for-the-badge)](https://pneuoma.com/platform/create/)
[![Schools](https://img.shields.io/badge/🏫_Schools-Pilot_Program-22c55e?style=for-the-badge)](https://pneuoma.com/platform/schools/)

> **Free nervous system regulation games for kids, teens, and adults. Calm anxiety, improve focus, and build emotional resilience through breath-controlled gameplay.**

PNEUOMA (πνεῦμα - Greek for "breath/spirit") is the leading platform for **nervous system wellness games**. We provide biofeedback games, daily rituals, multiplayer co-regulation, and creative experiences that train regulation through breath, voice, and presence.

**🔍 Search:** nervous system regulation games | breathing games for kids | calm down games | ADHD games | anxiety games for children

---

## 🎯 Why PNEUOMA?

| Problem | PNEUOMA Solution |
|---------|------------------|
| Kids can't calm down | Breath-controlled games make regulation fun |
| ADHD/Autism dysregulation | Sensory games with haptic feedback |
| Classroom disruptions | Classroom Sync for whole-class regulation |
| Screen time guilt | Games that actually help, not harm |
| Therapy homework is boring | Gamified breathing exercises |

---

## 🎮 What We Offer

### Nervous System Regulation Games (30+ Live)

Breath-controlled, voice-activated games designed by a music therapist:

| Age Group | Games | Examples | Best For |
|-----------|-------|----------|----------|
| **Kids 4-8** | 8 games | Cloud Keeper, Tidepool, Echo Garden, Rainbow | First-time regulation, sensory play |
| **Kids 8-13** | 10 games | Project AURA, Ember, ALIGN, Pulse, Dragon's Breath | Building awareness, focus training |
| **Teens 13-18** | 8 games | The Deep, Bounce, Chill, Vibe Check | Self-regulation, social sync |
| **Adults 18+** | 7 games | Drift, Reset, Anchor, Decompress | Stress relief, HRV training |

**✅ 15 games FREE** — No account required. No download needed.

### 🌌 Create Section (NEW!)

Build your own worlds with VR-ready creative tools:

| Experience | Description | Features |
|------------|-------------|----------|
| **Universe Hub** | Host your own solar system | Invite friends, add planets, multiplayer |
| **World Builder** | Design custom planets | Terrain, atmosphere, suns, moons, life |
| **Creature Lab** | Create fantastical creatures | Body parts, colors, personalities |
| **Planet Surface** | Walk on your planet (2D) | Time of day, weather, creatures |
| **Planet Explore** | First-person 3D exploration | WebXR/VR ready, Apple Vision Pro |

### 🧘 Daily Rituals (8 Live)

Guided breathing experiences for specific moments:

- 🌅 **Morning Rise** — Start your day regulated
- 🌙 **Sleep Descent** — Ease into rest
- 🎯 **Deep Focus** — Pre-task preparation
- 🔥 **Emergency Reset** — Crisis calm-down (3 minutes)
- 🔄 **Transition Reset** — Between activity shifts
- 💆 **Decompress** — End of day unwinding
- 🧘 **Deep Recovery** — Nervous system restoration
- ✨ **Before** — Pre-event preparation

### 👥 Multiplayer Co-Regulation (6 Modes)

Breathe together in real-time:

- 👨‍👩‍👧 **Parent + Child** — Guided regulation together
- 💑 **Partners** — Couples co-regulation
- 👨‍👩‍👧‍👦 **Family Circle** — Whole family sessions
- 🩺 **Therapy Circle** — Group therapy breathing
- 🏫 **Classroom Sync** — Teacher-led class regulation
- 📱 **Remote Sync** — Long-distance co-regulation

---

## 🏫 For Schools & Therapists

**PNEUOMA provides Human Nervous System Infrastructure for Education:**

- **Classroom Sync** — Teachers guide whole-class breathing in real-time
- **Reduces disruptions** — Regulated students focus better
- **No downloads** — Works on any device with a browser
- **Progress tracking** — See which students need support
- **FERPA compliant** — No personal data collection required

**Use cases:**
- Morning brain breaks
- Post-recess reset
- Before tests/assessments
- Counseling sessions
- Special education classrooms
- After-school programs

📧 **School pilot inquiries:** camrynjackson@pneuoma.com

---

## 💳 Pricing

| Plan | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 forever | 15 games, 3 rituals, 3 multiplayer modes, all Create tools |
| **Premium** | $9.99/mo | All 30+ games, 8 rituals, 6 multiplayer modes, priority features |
| **Family** | $14.99/mo | Premium + up to 10 family profiles |
| **Schools** | Custom | Site license, admin dashboard, progress reports |

All paid plans include a **7-day free trial**.

---

## 🛠 Technical Stack

### Frontend
- **Three.js** — 3D rendering (Planet Explore VR)
- **WebXR API** — VR/AR headset support
- **HTML5 Canvas** — 2D game rendering
- **Web Audio API** — Dynamic soundscapes & biofeedback
- **MediaDevices API** — Microphone breath/voice detection
- **Vibration API** — Haptic feedback for calming
- **CSS3** — Animations, gradients, responsive design
- **Vanilla JavaScript** — No frameworks, fast loading

### Backend
- **Node.js** — Server runtime
- **Socket.io** — Real-time multiplayer sync
- **Express** — API endpoints
- **JWT** — Authentication tokens
- **Stripe** — Subscription payments

### Hosting
- **GitHub Pages** — Frontend (static site)
- **Render** — Backend server (WebSocket + API)

---

## 📁 Project Structure

```
AURA/
├── index.html              # Homepage
├── styles.css              # Global styles
├── main.js                 # Global JavaScript
├── robots.txt              # SEO crawl rules
├── sitemap.xml             # SEO sitemap (70+ URLs)
│
├── games/                  # All 30+ games
│   ├── aura/               # Project AURA (flagship)
│   ├── ember/              # Haptic regulation game
│   ├── align/              # Life simulation game
│   ├── bounce/             # Classroom sync ball game
│   └── ...                 # More games
│
├── platform/               # Platform sections
│   ├── games/              # Games hub
│   ├── rituals/            # 8 daily rituals
│   ├── multiplayer/        # 6 multiplayer modes
│   ├── schools/            # For Schools landing
│   └── create/             # NEW: Creative tools
│       ├── universe/       # Universe Hub
│       ├── world-builder/  # Planet creation
│       ├── creature-lab/   # Creature design
│       ├── planet-surface/ # 2D surface view
│       └── planet-explore/ # 3D VR exploration
│
├── auth/                   # Authentication
├── server/                 # Backend server
└── pitch-deck/             # Investor deck
```

---

## 🚀 Getting Started

### Play Now (No Setup)
Visit [pneuoma.com](https://pneuoma.com) and click any game!

### Local Development

```bash
# Clone the repo
git clone https://github.com/thecamrynshow/AURA.git
cd AURA

# Serve frontend
python3 -m http.server 3000
# or
npx serve -p 3000

# Open http://localhost:3000
```

### Backend Server (for multiplayer)

```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:3001
```

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
PORT=3001
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 📊 SEO Keywords

PNEUOMA is optimized to rank for:

**Primary:**
- nervous system regulation games
- breathing games for kids
- calm down games for children

**Secondary:**
- ADHD games for kids
- autism calming games
- anxiety games for children
- SEL games for classroom
- self-regulation activities
- emotional regulation games
- biofeedback games

**Long-tail:**
- free breathing games for kids with anxiety
- classroom calm down activities
- polyvagal games for therapy
- co-regulation games for parents

---

## 🎯 Key Features

### Biofeedback Mechanics
- **Breath Detection** — Microphone picks up inhale/exhale
- **Voice/Pitch Detection** — Sing, hum, or whistle to interact
- **Haptic Feedback** — Vibration patterns for tactile regulation
- **Audio-Based Haptics** — Sub-bass frequencies on iOS

### Therapeutic Design
- No enemies, timers, or competitive scores
- No addictive mechanics or dark patterns
- Calm closure rituals end each session
- Designed to regulate, not stimulate

### VR Ready (Planet Explore)
- WebXR integration for VR headsets
- Apple Vision Pro compatible
- Meta Quest compatible
- First-person 3D exploration
- Mobile joystick controls

### Accessibility
- Works on any device with a browser
- No downloads required
- Ages 4+ content
- Touch, voice, and breath controls

---

## 📈 Traction & Impact

- **500+ schools** interested in pilot program
- **10,000+ sessions** played
- **4.8/5 rating** from therapists
- **Published research** on breath-based games

---

## 🤝 Partnerships

Ideal partners include:
- School districts (K-12)
- Children's hospitals
- Therapy practices (OT, PT, SLP, Mental Health)
- Corporate wellness programs
- Pediatric clinics

---

## 📞 Contact

**Camryn Jackson** — Founder & Architect

- 🌐 [pneuoma.com](https://pneuoma.com)
- 📧 camrynjackson@pneuoma.com
- 📅 [Schedule a demo](https://calendly.com/camrynjackson-pneuoma/30min)
- 🐦 [@pneuoma](https://twitter.com/pneuoma)

---

## 📄 License

Proprietary. All rights reserved.

For educational or therapeutic licensing, contact camrynjackson@pneuoma.com.

---

<p align="center">
  <strong>πνεῦμα</strong><br>
  <em>"Breathe. Play. Regulate."</em>
</p>
