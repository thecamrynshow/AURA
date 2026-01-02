// ============================================
// Rise — Content
// ============================================

const Content = {
    stretches: [
        { instruction: 'reach your arms overhead', sub: 'stretch as tall as you can' },
        { instruction: 'roll your shoulders back', sub: 'release any stiffness' },
        { instruction: 'gently turn your head side to side', sub: 'loosen your neck' },
        { instruction: 'take a big stretch however feels good', sub: 'your body knows what it needs' }
    ],
    
    affirmations: {
        calm: [
            "Today I choose calm",
            "Peace flows through me",
            "I move through this day with ease"
        ],
        focused: [
            "My mind is clear and sharp",
            "I am present and attentive",
            "Today I focus on what matters"
        ],
        energized: [
            "I am full of vibrant energy",
            "Today I feel alive and awake",
            "Energy flows through every part of me"
        ],
        open: [
            "I am open to what this day brings",
            "Today I welcome new possibilities",
            "I receive this day with an open heart"
        ],
        grateful: [
            "I am grateful for this new day",
            "Today is a gift I choose to appreciate",
            "I find reasons to be thankful"
        ],
        strong: [
            "I am capable and strong",
            "Today I face challenges with courage",
            "Strength rises within me"
        ]
    },
    
    getAffirmation(intention) {
        const affirmations = this.affirmations[intention] || this.affirmations.calm;
        return affirmations[Math.floor(Math.random() * affirmations.length)];
    }
};


