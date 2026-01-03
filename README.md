# PNEUOMA — Nervous System Regulation Platform

[![Live Site](https://img.shields.io/badge/Live-pneuoma.com-06b6d4)](https://pneuoma.com)
[![Games](https://img.shields.io/badge/Games-27%20Live-8b5cf6)](https://pneuoma.com/platform/games/)
[![Rituals](https://img.shields.io/badge/Rituals-8%20Live-f472b6)](https://pneuoma.com/platform/rituals/)
[![License](https://img.shields.io/badge/License-Proprietary-gray)]()

> **Helping kids and adults calm their minds, focus better, and feel safe — every day, through play.**

PNEUOMA (πνεῦμα - Greek for "breath/spirit") is the leading platform for nervous system wellness. We provide biofeedback games, daily rituals, and multiplayer experiences that train regulation through breath, voice, and presence.

---

## 🎮 What We Offer

### Games (27 Live)
Breath-controlled, voice-activated games for all ages:

| Age Group | Games | Examples |
|-----------|-------|----------|
| **Kids 4-8** | 6 games | Cloud Keeper, Tidepool, Echo Garden |
| **Kids 8-13** | 7 games | Project AURA, Pulse, Songbird, Dragon's Breath |
| **Teens 13-18** | 7 games | The Deep, Solfège, Star Catcher, Rhythm Islands |
| **Adults 18+** | 7 games | Drift, Reset, Anchor, Breathscape |

**12 games FREE** — No account required to start playing.

### Rituals (8 Live)
Guided breathing experiences for specific moments:
- 🌅 Morning Rise — Start your day regulated
- 🌙 Sleep Descent — Ease into rest
- 🎯 Deep Focus — Pre-task preparation
- 🔥 Emergency Reset — Crisis calm-down
- 🔄 Transition Reset — Between activity shifts
- 💆 Decompress — End of day unwinding
- 🧘 Deep Recovery — Nervous system restoration
- ✨ Before — Pre-event preparation

### Multiplayer (6 Modes)
Co-regulate with others in real-time:
- 👨‍👩‍👧 **Parent + Child** — Guided regulation together
- 💑 **Partners** — Couples co-regulation
- 👨‍👩‍👧‍👦 **Family Circle** — Whole family sessions
- 🩺 **Therapy Circle** — Group therapy breathing
- 🏫 **Classroom Sync** — Teacher-led class regulation
- 📱 **Remote Sync** — Long-distance co-regulation

---

## 🏫 For Schools

PNEUOMA provides **Human Nervous System Infrastructure for Education**:
- Classroom Sync lets teachers guide whole-class breathing exercises
- Reduces disruptions, improves focus
- Works in classrooms, counseling offices, special education
- **Pilot program available** for districts

[Learn more →](https://pneuoma.com/platform/schools/)

---

## 💳 Pricing

| Plan | Price | What's Included |
|------|-------|-----------------|
| **Free** | $0 | 12 games, 3 rituals, 3 multiplayer modes |
| **Premium** | $9.99/mo | All 27 games, 8 rituals, 6 multiplayer modes |
| **Family** | $14.99/mo | Premium + up to 10 family profiles |

All paid plans include a **7-day free trial**.

---

## 🛠 Tech Stack

### Frontend
- **HTML5 Canvas** — Game rendering
- **Web Audio API** — Dynamic soundscapes & biofeedback
- **MediaDevices API** — Microphone breath/voice detection
- **CSS3** — Animations, gradients, responsive design
- **Vanilla JavaScript** — No frameworks, fast loading

### Backend
- **Node.js** — Server runtime
- **Socket.io** — Real-time multiplayer sync
- **Express** — API endpoints
- **JWT** — Authentication tokens
- **bcryptjs** — Password hashing
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
├── audio.js                # Ambient audio manager
├── favicon.svg             # Breath wave favicon
├── logo.png                # 512x512 logo
├── logo-1024.png           # 1024x1024 logo
├── robots.txt              # SEO crawl rules
├── sitemap.xml             # SEO sitemap
├── site.webmanifest        # PWA manifest
│
├── auth/                   # Authentication
│   ├── login.html
│   ├── signup.html
│   ├── subscribe.html
│   ├── success.html
│   ├── forgot-password.html
│   ├── auth.js             # Auth logic
│   ├── auth.css
│   ├── access-control.js   # Free vs premium content
│   └── protect.js          # Content gating
│
├── games/                  # All 27 games
│   ├── aura/               # Project AURA (flagship)
│   ├── tidepool/
│   ├── echogarden/
│   ├── pulse/
│   ├── deep/
│   ├── cloudkeeper/
│   ├── songbird/
│   ├── solfege/
│   ├── dragon/
│   ├── starcatcher/
│   ├── rhythm/
│   └── ... (more games)
│
├── platform/               # Platform sections
│   ├── index.html          # User dashboard
│   ├── games/              # Games hub
│   ├── rituals/            # Rituals hub + 8 rituals
│   ├── multiplayer/        # 6 multiplayer modes
│   ├── apps/               # Apps section
│   └── schools/            # For Schools landing
│
├── server/                 # Backend server
│   ├── index.js            # Main server
│   ├── package.json
│   └── README.md
│
├── pitch-deck/             # Investor/demo deck
│   ├── index.html
│   ├── deck.css
│   ├── deck.js
│   └── DECK-GUIDE.md
│
└── schedule/               # Calendly redirect
    └── index.html
```

---

## 🚀 Getting Started

### View Live Site
Visit [pneuoma.com](https://pneuoma.com)

### Local Development

```bash
# Clone the repo
git clone https://github.com/thecamrynshow/AURA.git
cd AURA

# Serve frontend (any static server)
python3 -m http.server 8000
# or
npx serve

# Open http://localhost:8000
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
MASTER_EMAIL=camrynjackson@pneuoma.com
```

---

## 📊 SEO & Marketing

The site is optimized for:
- **Keywords**: breathing games for kids, calm down games, ADHD games, anxiety games, SEL games classroom
- **Rich Snippets**: FAQ schema, BreadcrumbList, SoftwareApplication
- **Social**: Open Graph, Twitter Cards
- **Performance**: No frameworks, minimal dependencies, fast loading

---

## 🎯 Key Features

### Biofeedback Mechanics
- **Breath Detection** — Microphone picks up inhale/exhale patterns
- **Voice/Pitch Detection** — Sing, hum, or whistle to interact
- **Mobile Optimized** — 3x sensitivity boost on iOS/Android

### Therapeutic Design
- No enemies, timers, or scores
- No addictive mechanics
- Calm closure rituals end each session
- Designed to regulate, not stimulate

### Accessibility
- Works on any device with a browser
- No downloads required
- Ages 4+ content
- WCAG considerations in design

---

## 📞 Contact

**Camryn Jackson** — Founder & Architect

- 🌐 [pneuoma.com](https://pneuoma.com)
- 📧 camrynjackson@pneuoma.com
- 📅 [Schedule a demo](https://calendly.com/camrynjackson-pneuoma/30min)

---

## 📄 License

Proprietary. All rights reserved.

For educational or therapeutic licensing inquiries, contact camrynjackson@pneuoma.com.

---

*"Breathe. Play. Regulate."*
