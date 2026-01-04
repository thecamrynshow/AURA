/**
 * Chill — Content
 * Situation-specific reframes and affirmations
 */

const Content = {
    // Grounding prompts
    grounding: [
        'feel your feet on the floor',
        'notice your hands',
        'feel the weight of your body',
        'take in the room around you',
        'notice 3 things you can see'
    ],
    
    // Reframes by situation
    reframes: {
        school: [
            'everyone\'s too worried about themselves to notice you',
            'you\'ve walked in there before. you can do it again.',
            'one day at a time. one class at a time.',
            'the hard part is walking in. then it gets easier.',
            'you don\'t have to be perfect. just present.'
        ],
        party: [
            'you can leave whenever you want',
            'most people are nervous too - they\'re just hiding it',
            'you don\'t have to talk to everyone. find one person.',
            'awkward moments are forgotten in 5 minutes',
            'you being there is enough'
        ],
        presentation: [
            'everyone wants you to do well. they\'re on your side.',
            'you know this material better than you think',
            'nerves mean you care. that\'s a good thing.',
            'they\'ll remember how you made them feel, not every word',
            'you\'ve practiced. trust yourself.'
        ],
        conversation: [
            'you can only control what you say, not how they react',
            'saying hard things is brave',
            'it\'ll feel better once it\'s said',
            'you deserve to be heard',
            'honesty builds trust, even when it\'s scary'
        ],
        'new-people': [
            'everyone feels a little weird meeting new people',
            'ask questions. people love talking about themselves.',
            'you don\'t have to be impressive. just be interested.',
            'first impressions aren\'t everything',
            'the people meant for you will like you'
        ],
        other: [
            'you\'ve handled hard things before',
            'this feeling is temporary',
            'you\'re more capable than you feel right now',
            'take it one moment at a time',
            'future you will be proud you tried'
        ]
    },
    
    // Launch affirmations by situation
    affirmations: {
        school: [
            'you\'ve done this before',
            'one foot in front of the other',
            'you belong there'
        ],
        party: [
            'go have fun',
            'be yourself - that\'s enough',
            'you can always text a friend if you need'
        ],
        presentation: [
            'you\'re ready',
            'speak your truth',
            'you\'ve got this'
        ],
        conversation: [
            'be honest, be kind',
            'you\'re doing the brave thing',
            'say what you need to say'
        ],
        'new-people': [
            'just be curious',
            'everyone wants connection',
            'you\'re interesting enough'
        ],
        other: [
            'you\'ve got this',
            'one step at a time',
            'you\'re stronger than you know'
        ]
    },
    
    // Get random content for situation
    getReframe(situation) {
        const options = this.reframes[situation] || this.reframes.other;
        return Utils.randomItem(options);
    },
    
    getAffirmation(situation) {
        const options = this.affirmations[situation] || this.affirmations.other;
        return Utils.randomItem(options);
    },
    
    getGrounding() {
        return Utils.randomItem(this.grounding);
    }
};



