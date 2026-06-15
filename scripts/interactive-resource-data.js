'use strict';

/** Interactive SEO landing pages — pairs problem/solution content with embedded PNEUOMA games */

module.exports = [
    {
        slug: 'box-breathing-game',
        title: 'Box Breathing Game for Classrooms',
        gameId: 'reset',
        gameName: 'Reset',
        gameUrl: '/games/reset/',
        metaDescription:
            'Free box breathing game for classrooms. Students follow a visual 4-4-4-4 breath pattern before tests, transitions, or after recess.',
        h1: 'Box Breathing Game',
        problem:
            'Students need a steady breath pattern before focus work, but counting in four directions is easy to forget mid-chaos.',
        problemDetail:
            'Box breathing (inhale 4, hold 4, exhale 4, hold 4) helps many students settle. Without a visual cue, though, kids rush the holds or skip steps—especially after transitions.',
        explanation:
            'A guided box-breath game gives the class one shared visual rhythm. The square pattern on screen matches inhale, hold, exhale, hold—so students practice timing instead of guessing.',
        embedNote: 'Choose Quick Breath (2 min) for a short class reset. Box breathing is built in.',
        embedPrompt: 'Launch below on your projector or student devices. Tap Quick Breath to start.',
        teacherSteps: [
            'Preview the game once so you know the flow.',
            'Before independent work or a test, say: “We box-breathe together, then begin.”',
            'Project on the board OR have students open on devices.',
            'Select Quick Breath mode and breathe with them—model slow pace.',
            'When the round ends, give the first task immediately.',
        ],
        teacherScript:
            '“Feet flat. Eyes on the screen. We breathe in a square—inhale, hold, out, hold. Match the box. When we finish, pencils ready.”',
        adaptations: [
            { grade: 'K–2', text: 'Shorten to three rounds. Let kids trace a square in the air with their finger.' },
            { grade: '3–5', text: 'Rotate a “breath captain” who stands and leads one round per week.' },
            { grade: '6+', text: 'Silent box breath at desks after one projected round—same timing, less cute.' },
        ],
    },
    {
        slug: 'balloon-breathing-game',
        title: 'Balloon Breathing Game for Kids',
        gameId: 'cloudkeeper',
        gameName: 'Cloud Keeper',
        gameUrl: '/games/cloudkeeper/',
        metaDescription:
            'Free balloon-style breathing game for young students. Blow clouds across the sky with calm breath—perfect for kindergarten and early elementary.',
        h1: 'Balloon Breathing Game',
        problem:
            'Young children understand “fill your balloon” better than “diaphragmatic breathing,” but they need something to watch while they practice.',
        problemDetail:
            'Balloon breath is a classroom staple: belly expands on inhale, soft exhale on the way out. Without a visual, many kids puff their cheeks or breathe too fast.',
        explanation:
            'Cloud Keeper turns exhale into play—gentle breath moves clouds across the sky. The image matches balloon breath: big belly in, long breath out. Touch mode works if microphones are off.',
        embedNote: 'Gentle sky play for ages 4+. Use touch on tablets if mic access is blocked.',
        embedPrompt: 'Launch Cloud Keeper. Students blow or tap to move clouds—model slow exhale first.',
        teacherSteps: [
            'Teach hands-on-belly once before the game.',
            'Gather students where they can see the screen.',
            'Launch Cloud Keeper and demonstrate one slow cloud.',
            'Invite the class to try three clouds together.',
            'Transition to the next activity: “Balloons down, eyes on me.”',
        ],
        teacherScript:
            '“Pretend your tummy is a balloon. Breathe in—balloon big. Breathe out—blow the cloud slowly across the sky. Not a race. Three clouds together.”',
        adaptations: [
            { grade: 'Pre-K–K', text: 'Teacher controls the screen; kids mirror your breath standing at carpet.' },
            { grade: '1–2', text: 'Pairs take turns at the board while others breathe at desks.' },
            { grade: 'Calm corner', text: 'Bookmark on a tablet with headphones for individual breaks.' },
        ],
    },
    {
        slug: 'grounding-game',
        title: 'Grounding Game for Students',
        gameId: 'anchor',
        gameName: 'Anchor',
        gameUrl: '/games/anchor/',
        metaDescription:
            'Free 5-4-3-2-1 grounding game for students. Interactive sensory steps help the class orient and settle before learning.',
        h1: 'Grounding Game',
        problem:
            'When students are worried, daydreaming, or overstimulated, they are not fully in the room—and lectures do not land.',
        problemDetail:
            'Grounding pulls attention to the present through senses. The 5-4-3-2-1 method works, but kids forget the order or rush through it without actually looking and listening.',
        explanation:
            'Anchor walks students through see, touch, hear, smell, and taste steps with calm pacing. The game keeps everyone on the same step at the same time—useful before tests or after loud events.',
        embedNote: 'Eyes-open grounding. Skip smell/taste steps in group play if needed.',
        embedPrompt: 'Launch Anchor for a guided 5-4-3-2-1 reset. Best with audio on or teacher reading prompts aloud.',
        teacherSteps: [
            'Explain: “We wake up our senses in the classroom—no closing eyes.”',
            'Launch Anchor on the board.',
            'Students can whisper answers or think privately.',
            'Complete all steps before starting instruction.',
            'Debrief optionally: “What helped you feel here?”',
        ],
        teacherScript:
            '“Sometimes our brains float away. We ground. Five things you see… four you can touch… follow the screen. When you are back in our room, thumbs up.”',
        adaptations: [
            { grade: 'K–2', text: 'Do 3-2-1 as a group chant. Point at objects together.' },
            { grade: '3–5', text: 'Journal one item per step, then share if comfortable.' },
            { grade: 'Whole class stress', text: 'Use before announcements, drills, or substitute days.' },
        ],
    },
    {
        slug: 'focus-game',
        title: 'Focus Game for Classrooms',
        gameId: 'focus',
        gameName: 'Focus',
        gameUrl: '/games/focus/',
        metaDescription:
            'Attention reset game for students who struggle to settle into independent work. Quick structured focus practice before tasks.',
        h1: 'Focus Game',
        problem:
            'After transitions, many students sit down but their attention is still in the hallway, on a conflict, or on a phone.',
        problemDetail:
            'Telling students to focus does not teach focus. They need a short, structured reset that shrinks the task from “do all your work” to “land here first.”',
        explanation:
            'Focus guides a brief attention reset: check how scattered you feel, practice settling, then launch into work. The countdown and visual target give older students a dignified on-ramp—not babyish breathing clipart.',
        embedNote: 'Best for grades 6+. Premium game—free trial unlocks full play. Preview loads in embed.',
        embedPrompt: 'Launch Focus for a ~5–10 minute attention reset. Use before independent work blocks.',
        teacherSteps: [
            'Set expectation: “This is a focus warm-up, not a game reward.”',
            'Students rate scatter on the first screen honestly.',
            'Complete the reset phase together silently at desks.',
            'Start the assignment within one minute of finishing.',
            'Repeat the same routine daily for two weeks.',
        ],
        teacherScript:
            '“Brains get fuzzy after transitions. We run a focus reset—honest check-in, breathe, then work. When the countdown ends, open your assignment.”',
        adaptations: [
            { grade: 'Middle school', text: 'Project on board; students at desks with screens dimmed.' },
            { grade: 'High school', text: 'Optional solo at start of period—same cue every day.' },
            { grade: 'ADHD supports', text: 'Pair with movement break first, then Focus—see your class plan.' },
        ],
    },
    {
        slug: 'nervous-system-reset-game',
        title: 'Nervous System Reset Game',
        gameId: 'deep',
        gameName: 'The Deep',
        gameUrl: '/games/deep/',
        metaDescription:
            'Free nervous system reset breathing game. Slow ocean breath guides students from overstimulated to ready-to-learn.',
        h1: 'Nervous System Reset Game',
        problem:
            'After assemblies, fire drills, or high-energy recess, the whole class can feel “off”—too loud, too flat, or unable to settle.',
        problemDetail:
            'Students do not need a lecture about nerves. They need a body-level reset: slower breath, longer exhale, and a predictable routine that says we are safe enough to learn now.',
        explanation:
            'The Deep uses slow underwater breath and calm visuals—no clinical jargon. The descent metaphor matches “coming down” from high arousal. It is short enough for a daily whole-class reset.',
        embedNote: 'Ages 13+ by design; upper elementary may use with teacher-led pacing.',
        embedPrompt: 'Launch The Deep for a 3–5 minute class reset. Teacher breathes with the screen.',
        teacherSteps: [
            'Dim lights if possible.',
            'Name it plainly: “Body reset—not punishment.”',
            'Launch and breathe audibly with the class.',
            'No talking during the dive; debrief after if needed.',
            'Start with a low-stakes task when the session ends.',
        ],
        teacherScript:
            '“Our bodies are still buzzing. We dive together—slow breath in, longer breath out. Follow the screen. When we surface, we start small.”',
        adaptations: [
            { grade: 'Upper elementary', text: 'Teacher narrates: “Imagine sinking slowly.” Shorten session.' },
            { grade: 'Teens', text: 'Use at start of afternoon block daily.' },
            { grade: 'After incidents', text: 'Whole-class reset before addressing behavior—safety first.' },
        ],
    },
    {
        slug: 'classroom-sync-demo',
        title: 'Classroom Sync Demo for Teachers',
        gameId: 'classroom-sync',
        gameName: 'Classroom Sync',
        gameUrl: '/platform/multiplayer/classroom-sync/',
        metaDescription:
            'Try Classroom Sync free—guide whole-class breathing in real time. Teacher-led regulation for transitions and resets.',
        h1: 'Classroom Sync Demo',
        problem:
            'Whole-class breathing falls apart when every student is on a different screen, timer, or pace.',
        problemDetail:
            'Teachers need one shared cue—same inhale, same exhale, same moment to settle. Without sync, the loudest kids set the pace and the routine feels chaotic.',
        explanation:
            'Classroom Sync lets the teacher lead a session while students join with a code. Everyone sees the same breath phase. You can circulate, co-regulate, and end together—ideal for post-recess and pre-instruction resets.',
        embedNote: 'Open teacher view below. Test with a second tab as “student” using the join code.',
        embedPrompt: 'Launch Classroom Sync. Click “I’m the Teacher” to start a demo session.',
        teacherSteps: [
            'Launch and choose Teacher.',
            'Share the join code; students open the same URL on devices.',
            'Run one short breath round while monitoring the room.',
            'End session and state the next task immediately.',
            'Request a pilot if you want building-wide rollout support.',
        ],
        teacherScript:
            '“We sync our breath—same pace, same pause. Join with the code on your screen. Follow the leader. When we finish, eyes on me.”',
        adaptations: [
            { grade: '1:1 devices', text: 'Every student joins; teacher leads from projector.' },
            { grade: 'Shared devices', text: 'Table captains join; group breathes with one screen.' },
            { grade: 'No devices', text: 'Project teacher view only; class mirrors your voice.' },
        ],
    },
    {
        slug: 'solfege-trainer',
        title: 'Solfège Trainer for Classrooms',
        gameId: 'solfege',
        gameName: 'Solfège',
        gameUrl: '/games/solfege/',
        metaDescription:
            'Free solfège trainer—students sing or hum Do Re Mi into the mic and see notes light up. Music class warm-up and regulation through pitch.',
        h1: 'Solfège Trainer',
        problem:
            'Music teachers want ear training that feels like play, and classroom teachers want calm vocal warm-ups that are not another worksheet.',
        problemDetail:
            'Solfège builds pitch awareness and gives students a structured vocal outlet—useful for regulation through breath-supported singing, not just sitting still.',
        explanation:
            'Solfège listens for your voice and lights the matching key. Students hum or sing scales at their own pace. It pairs music literacy with slow, supported breath—great for morning meeting or music block openers.',
        embedNote: 'Microphone required. Works best in smaller groups or with quiet turn-taking.',
        embedPrompt: 'Launch Solfège. Allow mic access. Try Do–Re–Mi together once before student turns.',
        teacherSteps: [
            'Set norm: one voice at a time when using one mic.',
            'Model a slow scale—do not rush.',
            'Let volunteers sing while class hums silently.',
            'Connect to breath: “Support the note from your belly.”',
            'Close with silent breath before academic work.',
        ],
        teacherScript:
            '“We warm up our ears and our breath. Hum softly—belly breath. When it is your turn, sing the note you see. No teasing—this is practice.”',
        adaptations: [
            { grade: 'K–2', text: 'Teacher sings; students echo on sol and mi only.' },
            { grade: '3–5', text: 'Small groups rotate at the board.' },
            { grade: 'Music room', text: 'Use as daily tuner before instruments.' },
        ],
    },
    {
        slug: 'pitch-match-game',
        title: 'Pitch Match Game for Students',
        gameId: 'songbird',
        gameName: 'Songbird',
        gameUrl: '/games/songbird/',
        metaDescription:
            'Free pitch matching game—whistle or hum to call birds and match melodies. Calming music play for elementary and middle school.',
        h1: 'Pitch Match Game',
        problem:
            'Some students need a non-competitive way to practice listening and breath-supported sound—not another loud gym game.',
        problemDetail:
            'Pitch matching trains ears and breath control together. Songbird rewards steady tone with gentle visuals—low pressure, good for anxious or sensory-sensitive students.',
        explanation:
            'Students whistle or hum to match bird melodies. Success is musical, not violent or fast. The forest setting keeps arousal low while students practice sustained exhale through tone.',
        embedNote: 'Microphone required. Whistling optional—humming works.',
        embedPrompt: 'Launch Songbird. Demonstrate one bird call; then pairs try quietly.',
        teacherSteps: [
            'Preview sound levels—set “indoor voice” norm.',
            'Demonstrate a soft hum match.',
            'Pairs practice; rotate so noise stays manageable.',
            'Debrief: “What did you notice in your breath?”',
            'Transition to quiet work with one group breath.',
        ],
        teacherScript:
            '“Listen to the bird. Hum or whistle to match—gentle voice. Long breath out through your sound. When the bird answers, you matched.”',
        adaptations: [
            { grade: 'Elementary', text: 'Station rotation with 4 students at a time.' },
            { grade: 'Counseling push-in', text: 'One student with headphones for low-stimulus practice.' },
            { grade: 'Music + SEL', text: 'Pair with feeling check-in before play.' },
        ],
    },
    {
        slug: 'rhythm-regulation-game',
        title: 'Rhythm Regulation Game',
        gameId: 'pulse',
        gameName: 'Pulse',
        gameUrl: '/games/pulse/',
        metaDescription:
            'Free rhythm regulation game—sync breath to the beat for whole-class calm and focus. Musical biofeedback for transitions.',
        h1: 'Rhythm Regulation Game',
        problem:
            'Some classes settle better with rhythm than with silent meditation—especially upper elementary and middle school.',
        problemDetail:
            'Rhythm gives the body a job: inhale on the beat, exhale on the beat. That external structure helps students who fidget during plain breath work.',
        explanation:
            'Pulse syncs breath to a musical pulse—students follow the beat visually and auditorily. It trains steady rhythm in the body, which many teachers use before writing blocks or after lunch.',
        embedNote: 'Free game. Project for whole class or headphones for small groups.',
        embedPrompt: 'Launch Pulse. Start one short round together before independent work.',
        teacherSteps: [
            'Explain: “Breath follows the beat—not racing, matching.”',
            'Project Pulse and complete one full cycle together.',
            'Keep volume low enough to hear the pulse.',
            'End on a freeze: hands on desk, eyes up.',
            'Use the same routine daily after lunch.',
        ],
        teacherScript:
            '“In on the pulse… out on the pulse… steady, not fast. Match the screen. When the rhythm fades, we are ready to work.”',
        adaptations: [
            { grade: '3–5', text: 'Clap the pulse first, then add breath.' },
            { grade: 'Band/choir', text: 'Use as tuning breath before rehearsal.' },
            { grade: 'Classroom Sync', text: 'Pair with <a href="/resources/play/classroom-sync-demo.html">Classroom Sync</a> for synced devices.' },
        ],
    },
    {
        slug: 'calm-down-countdown',
        title: 'Calm Down Countdown for Students',
        gameId: 'chill',
        gameName: 'Chill',
        gameUrl: '/games/chill/',
        metaDescription:
            'Free calm-down countdown game for students. Three-minute guided cool-down with visual timer before transitions or stressful moments.',
        h1: 'Calm Down Countdown',
        problem:
            'Students often need a clear endpoint—“how long is this calm down?”—or they resist open-ended breathing.',
        problemDetail:
            'A visible countdown reduces anxiety about the break itself. Short, timed cool-downs work in hallways, before presentations, or when the class needs a collective pause.',
        explanation:
            'Chill runs a ~3-minute cool-down with countdown cues. Students pick a context (school, presentation, etc.) and follow guided breath. The timer answers “how long?” without you improvising.',
        embedNote: '~3 minutes. Good for pre-transition or pre-discussion cool-down.',
        embedPrompt: 'Launch Chill. Whole class picks “school” or you assign the same situation.',
        teacherSteps: [
            'Announce time limit up front: “Three-minute reset.”',
            'Launch Chill on board or devices.',
            'Everyone picks the same situation for unity.',
            'No talking during countdown.',
            'Resume lesson with a clear first step.',
        ],
        teacherScript:
            '“We have three minutes to cool down—timer on screen. Breathe with the countdown. When it hits zero, we are back. Pencils ready.”',
        adaptations: [
            { grade: 'Teens', text: 'Offer silent desk version with projected timer only.' },
            { grade: 'Before presentations', text: 'Run Chill right before speeches or performances.' },
            { grade: 'Calm corner', text: 'Individual bookmark for timed breaks.' },
        ],
    },
];
