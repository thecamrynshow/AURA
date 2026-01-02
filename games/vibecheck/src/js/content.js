// ============================================
// Vibe Check — Content (Reframes by emotion)
// ============================================

const Content = {
    // Reframes by vibe type
    reframes: {
        good: [
            "enjoy this moment. you earned it.",
            "feeling good is valid too.",
            "take note: what made this happen?",
            "let the good vibes flow.",
            "you're allowed to feel happy."
        ],
        meh: [
            "meh is okay. not every day is exciting.",
            "sometimes neutral is actually fine.",
            "you don't have to feel amazing 24/7.",
            "meh days are part of life.",
            "even 'nothing special' days count."
        ],
        anxious: [
            "anxiety is just energy waiting to be redirected.",
            "you've survived 100% of your anxious moments.",
            "this feeling will pass. it always does.",
            "anxiety lies. you're more capable than it says.",
            "what's the smallest next step you can take?"
        ],
        sad: [
            "it's okay to feel sad. tears clean the soul.",
            "sadness means you cared about something.",
            "you won't feel this way forever.",
            "be gentle with yourself right now.",
            "even the longest nights end in morning."
        ],
        angry: [
            "anger means your boundaries matter.",
            "feel it, but don't let it control you.",
            "what is this anger trying to protect?",
            "it's valid to be upset. now what?",
            "anger often hides hurt underneath."
        ],
        confused: [
            "it's okay not to have all the answers.",
            "confusion is the start of learning.",
            "sit with the unknown. it won't last forever.",
            "you don't need to figure it all out today.",
            "clarity will come. trust the process."
        ],
        tired: [
            "rest is productive. seriously.",
            "your body is telling you something.",
            "tired today doesn't mean tired forever.",
            "even machines need to recharge.",
            "what would feel restorative right now?"
        ],
        overwhelmed: [
            "you don't have to do everything right now.",
            "one thing at a time. that's enough.",
            "overwhelm shrinks when you zoom in.",
            "what's the one thing that matters most?",
            "it's okay to say 'not right now.'"
        ],
        numb: [
            "numbness is self-protection. it's okay.",
            "feeling nothing is still feeling something.",
            "you're not broken. you're coping.",
            "the feelings are still there, just quieter.",
            "be patient with yourself."
        ]
    },
    
    // Emoji for each vibe
    emojis: {
        good: '😊',
        meh: '😐',
        anxious: '😰',
        sad: '😢',
        angry: '😤',
        confused: '😕',
        tired: '😴',
        overwhelmed: '🤯',
        numb: '😶'
    },
    
    // Get reframes for a vibe
    getReframes(vibe) {
        return this.reframes[vibe] || this.reframes.meh;
    },
    
    // Get random reframe
    getRandomReframe(vibe) {
        const reframes = this.getReframes(vibe);
        return Utils.randomFrom(reframes);
    },
    
    // Get emoji for vibe
    getEmoji(vibe) {
        return this.emojis[vibe] || '🎭';
    }
};


