# PNEUOMA AI Companions

Therapeutic AI companions available 24/7 for support when you need it most.

[![Bully Buddy](https://img.shields.io/badge/🛡️_Bully_Buddy-Live-3b82f6?style=for-the-badge)](https://pneuoma.com/platform/companions/bully-buddy/)
[![Valor](https://img.shields.io/badge/🎖️_Valor-Live-4b5563?style=for-the-badge)](https://pneuoma.com/platform/companions/valor/)
[![Anchor](https://img.shields.io/badge/🌱_Anchor-Live-22c55e?style=for-the-badge)](https://pneuoma.com/platform/companions/anchor/)
[![Haven](https://img.shields.io/badge/🕊️_Haven-Live-c4b5fd?style=for-the-badge)](https://pneuoma.com/platform/companions/haven/)

---

## 🤖 The Companions

### 🛡️ Bully Buddy
**For kids and teens experiencing bullying**

- Age-appropriate support (8-18)
- Helps process bullying experiences
- Teaches what to say when bullied
- Builds confidence and resilience
- Creates safety plans
- Recognizes when to involve adults
- Addresses cyberbullying, social exclusion, physical bullying

**Crisis Resources:** 988, Crisis Text Line 741741

---

### 🎖️ Valor
**For military veterans dealing with PTSD**

- Understands military culture and terminology
- Grounding techniques for flashbacks (5-4-3-2-1)
- Sleep and nightmare coping strategies
- Hypervigilance and anger management
- Civilian reintegration support
- Survivor's guilt processing
- VA resource connections

**Crisis Resources:** Veterans Crisis Line 1-800-273-8255 (Press 1), Text 838255

---

### 🌱 Anchor
**For people in addiction recovery**

- Like a sponsor in your pocket
- Craving management (HALT, riding the wave)
- Relapse prevention strategies
- Processing shame vs guilt
- Daily check-ins and intentions
- Relationship repair guidance
- "One day at a time" mindset

**Crisis Resources:** SAMHSA 1-800-662-4357, 988

---

### 🕊️ Haven
**For trauma survivors of all kinds**

- Extremely gentle and trauma-informed
- Support for abuse survivors (domestic, sexual, childhood)
- Grief and loss processing
- Trauma from accidents, violence, disasters, war
- Grounding and body safety techniques
- Never pushes for details you're not ready to share
- "It was not your fault"

**Crisis Resources:** 988, Domestic Violence 1-800-799-7233, RAINN 1-800-656-4673

---

## 🧠 How It Works

### Powered by Claude 3.5 Sonnet

Each companion uses Anthropic's Claude AI with specialized therapeutic prompts:

1. **System Prompt** — Detailed personality, capabilities, and rules
2. **Conversation History** — Tracks what you've shared (15 messages)
3. **Context Awareness** — Knows what questions were already asked
4. **Anti-Repetition** — Never asks the same question twice
5. **Crisis Detection** — Identifies keywords and provides hotlines

### Natural Conversation Flow

```
User: "I'm being bullied at school"
AI: "That sounds really hard. What happened? 💙"

User: "Girls are posting about me on Snapchat"
AI: "That's cyberbullying - and it's not okay. Have you screenshotted the posts?"
     ↑ References the SPECIFIC thing you said
     ↑ Gives actionable advice
     ↑ Doesn't repeat "tell me more"
```

### Fallback System

If the AI API is unavailable, companions use intelligent local responses:
- Stage-based (initial → continued → tools)
- Multiple options per stage
- Won't repeat the last response
- Companion-specific voice maintained

---

## 📁 File Structure

```
platform/companions/
├── index.html              # Companions hub page
├── companions.css          # Shared styles
├── README.md               # This file
│
├── bully-buddy/
│   ├── index.html          # Chat interface
│   ├── styles.css          # BB-specific styles
│   └── src/js/bully-buddy.js
│
├── valor/
│   ├── index.html
│   ├── styles.css
│   └── src/js/valor.js
│
├── anchor/
│   ├── index.html
│   ├── styles.css
│   └── src/js/anchor.js
│
└── haven/
    ├── index.html
    ├── styles.css
    └── src/js/haven.js
```

---

## 🔌 API Integration

### Endpoint

```
POST /api/companion/chat
```

### Request Body

```json
{
    "companion": "bully-buddy",
    "message": "I'm scared to go to school",
    "history": [
        { "role": "user", "content": "hi" },
        { "role": "companion", "content": "Hey there! 💙" }
    ]
}
```

### Response

```json
{
    "response": "Feeling scared makes total sense — your brain is trying to protect you. Let's make a plan for tomorrow. 💙",
    "fallback": false
}
```

---

## 🎨 Design Principles

### Visual Identity

| Companion | Color | Emoji | Font |
|-----------|-------|-------|------|
| Bully Buddy | Blue `#3b82f6` | 💙 | Inter |
| Valor | Slate `#4b5563` | 🎖️ | Inter |
| Anchor | Green `#22c55e` | 🌱 | Inter |
| Haven | Lavender `#c4b5fd` | 🕊️ | Lora (serif) |

### UX Principles

1. **Safety first** — Crisis resources always visible
2. **Short messages** — 1-3 sentences, conversational
3. **Quick responses** — Tap buttons for common needs
4. **Voice input** — Web Speech API support
5. **Dark mode** — Gentle on eyes, calming atmosphere
6. **Mobile-first** — Touch-friendly, full-screen chat

---

## 🔐 Privacy

- **No data stored** — Conversations only in browser memory
- **Local storage** — Chat history saved locally (optional clear)
- **No accounts required** — Completely anonymous
- **Crisis resources** — Always provide real help options

---

## 🚨 Crisis Detection

All companions monitor for crisis keywords:

| Keywords | Action |
|----------|--------|
| "kill myself", "suicide", "want to die" | Immediate crisis resources |
| "hurt myself", "self harm", "cutting" | Crisis resources + validation |
| "in danger", "not safe" | Safety planning + hotlines |

---

## 🛠 Development

### Local Testing

```bash
# Start frontend
cd /path/to/AURA
npx serve -p 3000

# Start server (for AI)
cd server
npm run dev
```

### Environment Variable

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

Without this key, companions will use fallback responses.

---

## 📄 License

Part of the PNEUOMA platform. Proprietary.

For inquiries: camrynjackson@pneuoma.com

