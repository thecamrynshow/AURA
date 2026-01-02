// ============================================
// Bounce — Content (Truths & Affirmations)
// ============================================

const Content = {
    // Perspective truths by rejection type
    truths: {
        team: [
            "one tryout doesn't measure your worth",
            "even pros got cut somewhere",
            "this teaches resilience",
            "there are other paths forward",
            "your value isn't tied to a roster"
        ],
        social: [
            "not everyone will get you — and that's okay",
            "the right people will find you",
            "being left out once doesn't make you an outsider",
            "their choice isn't your definition",
            "alone time can build strength"
        ],
        grade: [
            "one grade isn't your whole story",
            "smart people fail tests all the time",
            "this is data, not destiny",
            "learning happens through mistakes",
            "your brain is still growing"
        ],
        crush: [
            "their 'no' opened space for a better 'yes'",
            "rejection protects you sometimes",
            "you were brave enough to try",
            "this feeling will fade",
            "your worth isn't based on one person's view"
        ],
        mistake: [
            "everyone messes up — literally everyone",
            "embarrassment means you care",
            "people forget faster than you think",
            "this will become a story you tell",
            "mistakes prove you're trying"
        ],
        other: [
            "whatever happened doesn't define you",
            "feelings are temporary, you are permanent",
            "you've survived 100% of your bad days",
            "this is just one moment",
            "growth often hurts first"
        ]
    },
    
    // Affirmations by rejection type
    affirmations: {
        team: [
            "I'll get stronger from this",
            "My next shot is coming",
            "I'm more than one tryout"
        ],
        social: [
            "I belong somewhere",
            "The right people will see me",
            "I'm enough on my own"
        ],
        grade: [
            "One grade doesn't define me",
            "I can learn from this",
            "I'm still growing"
        ],
        crush: [
            "I was brave to try",
            "Better things are coming",
            "I'm worthy of love"
        ],
        mistake: [
            "Everyone messes up",
            "I can move past this",
            "Mistakes help me grow"
        ],
        other: [
            "I can handle this",
            "This won't last forever",
            "I'm still standing"
        ]
    },
    
    // Grounding exercises
    grounding: [
        {
            desc: "push your feet into the floor",
            prompt: "feel the ground under you"
        },
        {
            desc: "squeeze your hands into fists",
            prompt: "feel the tension, then release"
        },
        {
            desc: "press your shoulders down",
            prompt: "away from your ears"
        }
    ],
    
    // Get random truths for type
    getTruths(type, count = 3) {
        const available = this.truths[type] || this.truths.other;
        return Utils.shuffle(available).slice(0, count);
    },
    
    // Get affirmation for type
    getAffirmation(type) {
        const available = this.affirmations[type] || this.affirmations.other;
        return Utils.randomFrom(available);
    },
    
    // Get grounding exercise
    getGrounding() {
        return Utils.randomFrom(this.grounding);
    }
};


