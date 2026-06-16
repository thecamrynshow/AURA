/**
 * Music regulation SEO landing pages (/resources/music/*)
 * Data-only file for scripts/generate-music-resource-pages.js
 */

'use strict';

module.exports = [
    {
        slug: 'solfege-trainer',
        title: 'Solfège Trainer (Do Re Mi) for Regulation Practice',
        metaDescription:
            'Use solfège to practice singing-along focus, steady breath, and listening awareness in classrooms. Includes a classroom routine and teacher script.',
        h1: 'Solfège Trainer for Calm Focus',
        eyebrow: 'Music Regulation Tools',

        problem:
            'When students feel restless, they often need a simple, shared way to practice focus and “tuning in” together—without turning the moment into a lecture or a correction.',
        explanation:
            'This Solfège Trainer guides students through short singing prompts (Do Re Mi Fa Sol La Ti Do) while you reinforce listening attention and a steady, comfortable breath. It’s designed for regulation practice and participation—so students can return to the group rhythm during transitions.',

        embedded: {
            iframeTitle: 'Solfège Trainer game',
            // Uses the existing /games/solfege/ game with music-context tracking.
            src: '/games/solfege/?music_context=solfege-trainer&music_solfege_mode=learn-notes&grade_band=all'
        },

        teacherSteps: [
            'Before you start, invite students to sit comfortably and “get quiet enough to hear their own voice.”',
            'Start the Solfège Trainer and have students sing along with the prompts (soft voice is fine).',
            'Use the breathing cues you like (e.g., “ready… and sing”) to help students keep breath steady through each target note.',
            'After each quick run, pause for one minute: “What did you notice—listening, breath, or focus?”',
            'Repeat once more if students are ready; otherwise, end while engagement is still high.'
        ],
        teacherScript:
            '“Our job is not perfection. Our job is practice. Listen for the prompt, take a comfortable breath, and sing the note. If your voice changes, that’s still practice. We’re building together a brain that can focus on purpose.”',

        classroomAdaptation:
            'Best as a 2–8 minute reset inside transitions. Use it when students need a shared focus anchor, especially before movement, after recess, or right after a high-energy activity.',

        gradeVariations: [
            {
                grade: 'K–2',
                text: 'Use “Do Re Mi” as a playful chant. Encourage “quiet voices” so listening stays easy. Keep prompts short and praise effort: “You matched the sound—nice listening!”'
            },
            {
                grade: '3–5',
                text: 'Ask for “steady breath between notes” and make it a team goal. Add a quick self-check: “Did I listen first, then sing?” before the next round.'
            },
            {
                grade: '6–8',
                text: 'Invite students to focus on timing and consistency: “Sing when you’re ready, then listen for the next prompt.” Pair briefly with partner listening (“I heard yours”).'
            }
        ],

        faq: [
            {
                q: 'Do I need students to sing out loud?',
                a: 'No. Participation counts. Students can hum, whisper-sing, or match the pitch quietly while you keep the routine steady and respectful.'
            },
            {
                q: 'How is this “regulation” practice?',
                a: 'The goal is not behavior control. The goal is practice: listening attention, a steady breath pattern, and shared timing. These supports help students return to the group rhythm.'
            },
            {
                q: 'What if students feel shy?',
                a: 'Offer a “practice voice” option. You can also start with the first prompt together and allow students to join when they’re ready. Consistency matters more than performance.'
            }
        ]
    },
    {
        slug: 'pitch-match-game',
        title: 'Pitch Match Game (Whistle to Match) for Listening Focus',
        metaDescription:
            'Pitch Match helps students practice listening focus by matching a played pitch. Built for classrooms and regulation practice.',
        h1: 'Pitch Match for Listening Focus',
        eyebrow: 'Music Regulation Tools',

        problem:
            'During transitions, some students get stuck in “sound spirals” (too much noise, too many reactions). They need a focus target they can share.',
        explanation:
            'Pitch Match uses a listening-and-matching loop to support auditory attention. Students take turns matching what they hear, building a calmer “listen first, respond next” routine.',

        embedded: {
            iframeTitle: 'Pitch Match game',
            src: '/games/pitch-match/?grade_band=all&music_pitch_mode=elementary'
        },

        teacherSteps: [
            'Before starting, set a quick classroom agreement: “We listen first, then we try.”',
            'Start Pitch Match and let students play in short bursts (30–120 seconds is enough).',
            'Praise the process: “Nice listening—your match was the goal.”',
            'When the group is ready, invite a turn-taking option: one student whistles/attempts, and everyone listens.'
        ],
        teacherScript:
            '“Our calm move is listening. Wait for the pitch, take a breath, then try to match. Even if you miss, that’s still practice—listening is what we’re training.”',

        classroomAdaptation:
            'Use Pitch Match when students need a shared focus job that doesn’t require long explanations. Great for “before line-up” moments and for settling after movement activities.',

        gradeVariations: [
            {
                grade: 'K–2',
                text: 'Keep attempts short and playful. Allow “try on the whistle” or “try on the keyboard” if you choose keyboard mode.'
            },
            {
                grade: '3–5',
                text: 'Use turn-taking: one student matches while others listen for the change. Encourage respectful observation: “I heard your try.”'
            },
            {
                grade: '6–8',
                text: 'Lean into the listening routine: “Listen, breathe, match, then stop.” Emphasize ending while engagement is high.'
            }
        ],

        faq: [
            {
                q: 'What counts as “matching” in this game?',
                a: 'The game measures a close pitch match. For classroom use, focus praise on trying to match the sound target, not on perfection.'
            },
            {
                q: 'Do students need a whistle?',
                a: 'No—students can often use keyboard options depending on the game’s available controls.'
            },
            {
                q: 'How long should we run it?',
                a: 'Start with a quick burst. If attention is steady, you can repeat. If students are getting frustrated, end early and return to the transition routine.'
            }
        ]
    },
    {
        slug: 'ear-training-game',
        title: 'Ear Training Game for Listening Attention & Memory',
        metaDescription:
            'Ear Training (built on Solfège) supports listening attention, auditory memory, and focus practice for classrooms.',
        h1: 'Ear Training for Listening & Focus',
        eyebrow: 'Music Regulation Tools',

        problem:
            'Some students can’t “hold the sound in mind” long enough to focus. They need short, repeatable listening challenges that feel doable.',
        explanation:
            'This Ear Training routine uses short singing prompts to practice listening attention and auditory memory. Students follow the prompts, then respond with their voice when ready—supporting regulation through participation.',

        embedded: {
            iframeTitle: 'Ear Training game',
            src: '/games/ear-training/?grade_band=all&music_ear_mode=pattern-recall'
        },

        teacherSteps: [
            'Start by reminding students: “We listen for the sound, then we try.”',
            'Run the activity as a short cycle: listen → respond → quick reset.',
            'After the session, ask one reflective question: “Which part was hardest—listening, remembering, or waiting?”',
            'Close with a calm transition cue: “We’re back together now.”'
        ],
        teacherScript:
            '“This is ear training. Your job is to listen carefully and try when you’re ready. If you miss, it’s not failure—it’s information. We use that information to listen again.”',

        classroomAdaptation:
            'Use Ear Training when students need to shift from noise to listening. It works well as a “middle of the day” focus practice or right after recess when attention is scattered.',

        gradeVariations: [
            {
                grade: 'K–2',
                text: 'Focus on participation. Let students hum or quietly match. Keep feedback simple: “Good listening—thank you for trying.”'
            },
            {
                grade: '3–5',
                text: 'Add a listening rule: “Hands still while we listen.” This protects memory time and reduces interruptions.'
            },
            {
                grade: '6–8',
                text: 'Encourage intentional waiting: “Listen first—then your turn.” Use the reflection question to build metacognition.'
            }
        ],

        faq: [
            {
                q: 'Is this conservatory-level music theory?',
                a: 'No. This is classroom-friendly listening practice. Students focus on matching prompts and building attention through repetition.'
            },
            {
                q: 'What if students can’t hear well?',
                a: 'Offer seating choices and non-verbal participation (quiet hum or listening-only). Consistent routines help students participate safely.'
            },
            {
                q: 'How do I know it’s working?',
                a: 'Look for smoother participation and faster return to the transition routine after the activity—not for musical perfection.'
            }
        ]
    },
    {
        slug: 'rhythm-regulation-game',
        title: 'Rhythm Regulation Game for Pace, Pulse & Group Sync',
        metaDescription:
            'Rhythm Regulation supports nervous system regulation through rhythm and breath-aligned timing. Classroom-ready routine.',
        h1: 'Rhythm Regulation for Group Timing',
        eyebrow: 'Music Regulation Tools',

        problem:
            'When students lose timing, the whole room can become “out of sync.” They need a shared pace they can feel with breath and movement.',
        explanation:
            'Rhythm Regulation pairs rhythm with breathing-aligned timing so students can practice staying with a steady pulse. You can use it to support group synchronization during classroom transitions.',

        embedded: {
            iframeTitle: 'Rhythm Regulation game',
            src: '/games/rhythm-regulation/?grade_band=all&regulation_mode=match'
        },

        teacherSteps: [
            'Introduce the routine: “We’re going to follow the beat with our breathing.”',
            'Start the session and set a short expectation: “Watch the center, breathe with the rhythm, then try to hit the beat when it arrives.”',
            'If students drift, return to one cue: “Listen for the moment—then try.”',
            'When the session ends, close with one shared phrase: “We’re back in rhythm together.”'
        ],
        teacherScript:
            '“This is our timing practice. We don’t chase perfection—we practice staying with the pulse. Breathe in time, then breathe out in time. That’s how we return together.”',

        classroomAdaptation:
            'Use it as a quick regulation tool after high-energy transitions (recess, assemblies, back-from-specials). For group support, run a short session and then immediately resume your classroom routine.',

        gradeVariations: [
            {
                grade: 'K–2',
                text: 'Keep guidance simple: “Breath on the beat.” You can model quietly while they watch. End early if attention drops.'
            },
            {
                grade: '3–5',
                text: 'Pair breathing and rhythm: “Breathe in as the beat approaches, breathe out as it reaches.” Reinforce stamina, not speed.'
            },
            {
                grade: '6–8',
                text: 'Use a choice cue: “Stay with match rhythm or switch to focus rhythm.” Then reflect briefly: “What helped you stay with the pulse?”'
            }
        ],

        faq: [
            {
                q: 'Do I need special equipment?',
                a: 'No. This is designed for classroom use. For breath detection, microphone access may be required depending on the game’s controls.'
            },
            {
                q: 'What if my class can’t do it all at once?',
                a: 'Run it as a guided rotation: the group follows the pulse visually while a small set of students plays, then switch.'
            },
            {
                q: 'How does this support regulation practice?',
                a: 'The goal is practice with pace and timing—breathing aligned to rhythm supports attention and participation so students can return to the next step.'
            }
        ]
    },
    {
        slug: 'music-breathing-game',
        title: 'Music Breathing Game for Phrase-Based Calm Focus',
        metaDescription:
            'Music Breathing supports regulation practice by guiding breath through phrase-based timing. Classroom-friendly routine.',
        h1: 'Music Breathing for Phrase Calm',
        eyebrow: 'Music Regulation Tools',

        problem:
            'After transitions, many students need a fast way to shift from “reacting” to “regulating.” A phrase-based breathing cue can help the group settle together.',
        explanation:
            'Music Breathing guides students through breathing that matches a musical phrase rhythm. You’ll use clear inhale/exhale cues so students can practice returning to a steady pattern during transitions.',

        embedded: {
            iframeTitle: 'Music Breathing game',
            src: '/games/music-breathing/?grade_band=all&breathing_mode=ocean-phrase'
        },

        teacherSteps: [
            'Get everyone ready: “Feet on the floor, shoulders soft, and a quiet breath.”',
            'Start Music Breathing and invite students to follow the on-screen phase cues.',
            'Give one consistent reminder: “Inhale when the phrase rises, exhale when it releases.”',
            'End while still calm: pause, then move directly into the next classroom routine.'
        ],
        teacherScript:
            '“We’re practicing a calm breath together. When the phrase rises, we inhale. When it releases, we exhale. If you drift, that’s okay—we return to the next phrase.”',

        classroomAdaptation:
            'Use Music Breathing as a brief reset after noisy transitions. Keep it predictable: start, breathe together, then immediately transition to the next step.',

        gradeVariations: [
            {
                grade: 'K–2',
                text: 'Use simple language: “Breathe in on the climb, breathe out on the release.” Encourage “brave calm” and praise participation.'
            },
            {
                grade: '3–5',
                text: 'Invite students to name what they felt: “cool air in / soft air out.” Keep it short and end at the peak of attention.'
            },
            {
                grade: '6–8',
                text: 'Support self-regulation with choice: “Follow the phrase, or follow the breath inside your own body.” The shared timing stays the anchor.'
            }
        ],

        faq: [
            {
                q: 'Does this replace breathing lessons?',
                a: 'It can be part of a routine, not a replacement. Think of it as guided practice that helps the class return to a steady breath pattern together.'
            },
            {
                q: 'What if students don’t want to close their eyes?',
                a: 'That’s okay. They can watch the phase cue and breathe along with open eyes.'
            },
            {
                q: 'How long should we do it?',
                a: 'Use a short session first. If students are steady and calm, you can repeat. If attention drops, end and move on to the next classroom step.'
            }
        ]
    }
];

