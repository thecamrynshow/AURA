// ============================================
// Forge — Content (Affirmations by target)
// ============================================

const Content = {
    affirmations: {
        workout: [
            "My body is ready. My mind is focused.",
            "Every rep makes me stronger.",
            "I push past limits today.",
            "This is my time to grow."
        ],
        competition: [
            "I've trained for this moment.",
            "Pressure creates diamonds. I am ready.",
            "I trust my preparation.",
            "This is what I was built for."
        ],
        presentation: [
            "My voice deserves to be heard.",
            "I know my material. I own the room.",
            "Confidence flows through me.",
            "I speak with clarity and power."
        ],
        interview: [
            "I am the right person for this.",
            "My experience speaks for itself.",
            "I am calm, confident, and capable.",
            "I bring unique value to the table."
        ],
        creative: [
            "Ideas flow freely through me.",
            "I am a channel for creativity.",
            "My work matters. I create boldly.",
            "Inspiration is already within me."
        ],
        general: [
            "I am focused. I am ready. I am unstoppable.",
            "Energy flows where intention goes.",
            "I am fully activated and present.",
            "Nothing can shake my foundation."
        ]
    },
    
    messages: {
        workout: "you're ready to crush it",
        competition: "you're ready to compete",
        presentation: "you're ready to present",
        interview: "you're ready to impress",
        creative: "you're ready to create",
        general: "you're ready for anything"
    },
    
    getAffirmation(target) {
        const affirmations = this.affirmations[target] || this.affirmations.general;
        return Utils.randomFrom(affirmations);
    },
    
    getMessage(target) {
        return this.messages[target] || this.messages.general;
    }
};



