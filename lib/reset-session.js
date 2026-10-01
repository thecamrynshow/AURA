/* PNEUOMA shared 90-second reset
   Breath games: timed 4-in / 6-out cycle. Mic is optional.
   Solfège: 90-second call-and-response. Tap or keyboard. No mic required.
   Records started, finished, and duration in localStorage.
*/
(function () {
    const DURATION = 90;
    const INHALE = 4;
    const EXHALE = 6;
    const HISTORY_KEY = 'pneuoma_reset_history';

    const SOLFEGE_ROUNDS = [
        ['Do', 'Mi', 'Sol'],
        ['Sol', 'Mi', 'Do'],
        ['Do', 'Re', 'Mi'],
        ['Mi', 'Fa', 'Sol'],
        ['Do', 'Mi', 'Sol', 'Mi', 'Do']
    ];

    const KEY_TO_SOLFEGE = {
        a: 'Do', s: 'Re', d: 'Mi', f: 'Fa', g: 'Sol', h: 'La', j: 'Ti', k: 'Do'
    };

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveRecord(record) {
        const history = loadHistory();
        history.unshift(record);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    }

    function formatTime(seconds) {
        const s = Math.max(0, Math.round(seconds));
        return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }

    function injectStyles() {
        if (document.getElementById('pneuoma-reset-styles')) return;
        const style = document.createElement('style');
        style.id = 'pneuoma-reset-styles';
        style.textContent = `
            .pneu-reset-launch {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin: 0.75rem 0 0;
                padding: 0.85rem 1.25rem;
                border-radius: 999px;
                border: 1px solid rgba(100, 255, 218, 0.45);
                background: rgba(10, 16, 20, 0.72);
                color: #64ffda;
                font: 600 0.95rem/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                cursor: pointer;
            }
            .pneu-reset-launch:hover { background: rgba(100, 255, 218, 0.12); }
            #pneuoma-reset-overlay {
                position: fixed;
                inset: 0;
                z-index: 100000;
                background: rgba(6, 10, 16, 0.96);
                color: #e8edf2;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.25rem;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .pneu-reset-card {
                width: min(520px, 100%);
                text-align: center;
            }
            .pneu-reset-kicker {
                letter-spacing: 0.16em;
                text-transform: uppercase;
                font-size: 0.75rem;
                color: #64ffda;
                margin-bottom: 0.5rem;
            }
            .pneu-reset-card h2 {
                font-size: 1.8rem;
                margin: 0 0 0.5rem;
            }
            .pneu-reset-card p { color: rgba(232, 237, 242, 0.78); line-height: 1.5; }
            .pneu-reset-actions {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1.5rem;
            }
            .pneu-reset-actions button, .pneu-reset-done button {
                border: 0;
                border-radius: 12px;
                padding: 0.95rem 1rem;
                font-weight: 650;
                cursor: pointer;
                font-size: 1rem;
            }
            .pneu-reset-primary { background: #64ffda; color: #06221c; }
            .pneu-reset-secondary { background: transparent; color: #e8edf2; border: 1px solid rgba(255,255,255,0.2) !important; }
            .pneu-orb-wrap { height: 220px; display: grid; place-items: center; }
            .pneu-orb {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 3px solid #64ffda;
                box-shadow: 0 0 40px rgba(100, 255, 218, 0.25);
                transition: transform 4s ease-in-out;
            }
            .pneu-orb.inhale { transform: scale(1.45); transition-duration: 4s; }
            .pneu-orb.exhale { transform: scale(0.72); transition-duration: 6s; }
            .pneu-phase { font-size: 1.6rem; margin: 0.25rem 0; }
            .pneu-meter {
                height: 8px;
                background: rgba(255,255,255,0.12);
                border-radius: 99px;
                overflow: hidden;
                margin: 1rem 0;
            }
            .pneu-meter > span {
                display: block;
                height: 100%;
                width: 0%;
                background: #64ffda;
            }
            .pneu-time { font-variant-numeric: tabular-nums; color: #64ffda; font-size: 1.25rem; }
            .pneu-notes { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin: 1rem 0; }
            .pneu-note, .pneu-key {
                min-width: 64px;
                padding: 0.7rem 0.4rem;
                border-radius: 10px;
                background: rgba(255,255,255,0.06);
                border: 1px solid rgba(255,255,255,0.12);
            }
            .pneu-note.on, .pneu-key.hit { border-color: #64ffda; color: #64ffda; }
            .pneu-keys { display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap; }
            .pneu-key { cursor: pointer; background: #121820; color: #e8edf2; font-weight: 650; }
            .pneu-stats { display: flex; gap: 1rem; justify-content: center; margin: 1.25rem 0; }
            .pneu-stats div { min-width: 90px; }
            .pneu-stats strong { display: block; font-size: 1.3rem; color: #64ffda; }
            .pneu-history { text-align: left; font-size: 0.9rem; color: rgba(232,237,242,0.7); margin: 0.5rem 0 1rem; }
        `;
        document.head.appendChild(style);
    }

    function ResetSession(options) {
        this.gameId = options.gameId || 'reset';
        this.title = options.title || '90-second reset';
        this.mode = options.mode || 'breath';
        this.overlay = null;
        this.timer = null;
        this.phaseTimer = null;
        this.startedAt = 0;
        this.remaining = DURATION;
        this.input = 'tap';
        this.follows = 0;
        this.micStream = null;
        this.audioContext = null;
        this.running = false;
        this.roundIndex = 0;
        this.expected = [];
        this.heard = [];
    }

    ResetSession.prototype.mount = function () {
        injectStyles();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pneu-reset-launch';
        button.textContent = this.mode === 'solfege' ? '90-second classroom round' : '90-second reset';
        button.addEventListener('click', () => this.openChooser());

        const anchor = document.querySelector(this.anchorSelector || '#start-button, #startBtn, .glow-button, .rainbow-button');
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(button, anchor.nextSibling);
        } else {
            button.style.position = 'fixed';
            button.style.right = '16px';
            button.style.bottom = '16px';
            button.style.zIndex = '99990';
            document.body.appendChild(button);
        }
    };

    ResetSession.prototype.openChooser = function () {
        this.render(`
            <p class="pneu-reset-kicker">${this.title}</p>
            <h2>90-second reset</h2>
            <p>${this.mode === 'solfege'
                ? 'A short call-and-response round. Tap the syllables or use the keyboard. A microphone is not required.'
                : 'Four counts in, six counts out. The circle keeps time even if the microphone is blocked.'}</p>
            <div class="pneu-reset-actions">
                ${this.mode === 'breath' ? '<button class="pneu-reset-primary" data-go="mic">Try microphone</button>' : ''}
                <button class="${this.mode === 'breath' ? 'pneu-reset-secondary' : 'pneu-reset-primary'}" data-go="tap">${this.mode === 'solfege' ? 'Start classroom round' : 'Use tap or spacebar'}</button>
                <button class="pneu-reset-secondary" data-go="close">Not now</button>
            </div>
        `);
        this.overlay.querySelector('[data-go="mic"]')?.addEventListener('click', () => this.begin('mic'));
        this.overlay.querySelector('[data-go="tap"]').addEventListener('click', () => this.begin('tap'));
        this.overlay.querySelector('[data-go="close"]').addEventListener('click', () => this.close());
    };

    ResetSession.prototype.render = function (html) {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'pneuoma-reset-overlay';
            document.body.appendChild(this.overlay);
        }
        this.overlay.innerHTML = `<div class="pneu-reset-card">${html}</div>`;
    };

    ResetSession.prototype.begin = async function (input) {
        this.input = input;
        this.startedAt = Date.now();
        this.remaining = DURATION;
        this.follows = 0;
        this.roundIndex = 0;
        this.running = true;

        if (input === 'mic') {
            const ok = await this.practiceBreath();
            if (!this.running) return;
            if (!ok) this.input = 'tap';
        }

        if (this.mode === 'solfege') this.runSolfege();
        else this.runBreath();
    };

    ResetSession.prototype.practiceBreath = async function () {
        this.render(`
            <p class="pneu-reset-kicker">One practice breath</p>
            <h2>Breathe out once</h2>
            <p>If the microphone is blocked, this switches to tap or spacebar.</p>
            <div class="pneu-meter"><span id="pneu-practice-fill"></span></div>
        `);
        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            return false;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(this.micStream);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const started = Date.now();
        return new Promise((resolve) => {
            const tick = () => {
                if (!this.running) return resolve(false);
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    const v = (data[i] - 128) / 128;
                    sum += v * v;
                }
                const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
                const fill = document.getElementById('pneu-practice-fill');
                if (fill) fill.style.width = Math.round(level * 100) + '%';
                if (level > 0.18 || Date.now() - started > 8000) resolve(true);
                else requestAnimationFrame(tick);
            };
            tick();
        });
    };

    ResetSession.prototype.runBreath = function () {
        this.render(`
            <p class="pneu-reset-kicker">${this.title}</p>
            <div class="pneu-orb-wrap"><div class="pneu-orb" id="pneu-orb"></div></div>
            <p class="pneu-phase" id="pneu-phase">Breathe in</p>
            <p class="pneu-time" id="pneu-time">1:30</p>
            <p id="pneu-hint">${this.input === 'mic' ? 'The circle keeps time. Breathe with it.' : 'Press space or tap the circle on each breath.'}</p>
        `);
        const orb = document.getElementById('pneu-orb');
        const mark = () => { if (this.running) this.follows += 1; };
        orb.addEventListener('pointerdown', mark);
        this.onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); mark(); } };
        document.addEventListener('keydown', this.onKey);

        const cycle = () => {
            if (!this.running) return;
            this.setPhase('Breathe in', 'inhale');
            this.phaseTimer = setTimeout(() => {
                if (!this.running) return;
                this.setPhase('Breathe out', 'exhale');
                this.phaseTimer = setTimeout(cycle, EXHALE * 1000);
            }, INHALE * 1000);
        };
        cycle();
        this.timer = setInterval(() => this.tick(), 1000);
    };

    ResetSession.prototype.setPhase = function (text, cls) {
        const phase = document.getElementById('pneu-phase');
        const orb = document.getElementById('pneu-orb');
        if (phase) phase.textContent = text;
        if (orb) orb.className = 'pneu-orb ' + cls;
    };

    ResetSession.prototype.runSolfege = function () {
        this.expected = SOLFEGE_ROUNDS[this.roundIndex % SOLFEGE_ROUNDS.length].slice();
        this.heard = [];
        const keys = ['Do', 'Re', 'Mi', 'Fa', 'Sol'].map((name) =>
            `<button type="button" class="pneu-key" data-note="${name}">${name}</button>`
        ).join('');
        this.render(`
            <p class="pneu-reset-kicker">Classroom round</p>
            <h2 id="pneu-call">Listen</h2>
            <div class="pneu-notes" id="pneu-notes"></div>
            <div class="pneu-keys">${keys}</div>
            <p class="pneu-time" id="pneu-time">1:30</p>
            <p>Tap the syllables, or use A S D F G. No microphone needed.</p>
        `);
        this.overlay.querySelectorAll('.pneu-key').forEach((btn) => {
            btn.addEventListener('click', () => this.hear(btn.dataset.note, btn));
        });
        this.onKey = (e) => {
            const note = KEY_TO_SOLFEGE[e.key.toLowerCase()];
            if (!note || !this.running) return;
            const btn = this.overlay.querySelector(`[data-note="${note}"]`);
            this.hear(note, btn);
        };
        document.addEventListener('keydown', this.onKey);
        this.playCall();
        this.timer = setInterval(() => this.tick(), 1000);
    };

    ResetSession.prototype.playCall = function () {
        const notes = document.getElementById('pneu-notes');
        const call = document.getElementById('pneu-call');
        if (!notes || !this.running) return;
        notes.innerHTML = this.expected.map((n) => `<span class="pneu-note">${n}</span>`).join('');
        if (call) call.textContent = 'Listen';
        let i = 0;
        const light = () => {
            if (!this.running) return;
            const spans = notes.querySelectorAll('.pneu-note');
            spans.forEach((el) => el.classList.remove('on'));
            if (i < spans.length) {
                spans[i].classList.add('on');
                i += 1;
                setTimeout(light, 700);
            } else if (call) {
                call.textContent = 'Your turn';
            }
        };
        light();
    };

    ResetSession.prototype.hear = function (note, btn) {
        if (!this.running || !this.expected.length) return;
        this.heard.push(note);
        if (btn) {
            btn.classList.add('hit');
            setTimeout(() => btn.classList.remove('hit'), 180);
        }
        const target = this.expected[this.heard.length - 1];
        if (note === target) this.follows += 1;
        if (this.heard.length >= this.expected.length) {
            this.roundIndex += 1;
            this.expected = SOLFEGE_ROUNDS[this.roundIndex % SOLFEGE_ROUNDS.length].slice();
            this.heard = [];
            this.playCall();
        }
    };

    ResetSession.prototype.tick = function () {
        this.remaining -= 1;
        const time = document.getElementById('pneu-time');
        if (time) time.textContent = formatTime(this.remaining);
        if (this.remaining <= 0) this.finish(true);
    };

    ResetSession.prototype.finish = function (completed) {
        if (!this.running && completed) return;
        this.running = false;
        clearInterval(this.timer);
        clearTimeout(this.phaseTimer);
        if (this.onKey) document.removeEventListener('keydown', this.onKey);
        this.stopMic();
        const durationSec = Math.round((Date.now() - this.startedAt) / 1000);
        const record = {
            gameId: this.gameId,
            title: this.title,
            startedAt: this.startedAt,
            finishedAt: Date.now(),
            durationSec: completed ? DURATION : durationSec,
            completed: !!completed,
            input: this.input,
            follows: this.follows
        };
        if (completed) saveRecord(record);
        const recent = loadHistory().filter((item) => item.gameId === this.gameId).slice(0, 3);
        const history = recent.map((item) =>
            `<div>${new Date(item.finishedAt).toLocaleString()} · ${formatTime(item.durationSec)} · ${item.input}</div>`
        ).join('');
        this.render(`
            <p class="pneu-reset-kicker">Done</p>
            <h2>${completed ? 'Reset complete' : 'Reset stopped'}</h2>
            <div class="pneu-stats">
                <div><strong>Started</strong><span>Yes</span></div>
                <div><strong>Finished</strong><span>${completed ? 'Yes' : 'No'}</span></div>
                <div><strong>Time</strong><span>${formatTime(record.durationSec)}</span></div>
            </div>
            ${history ? `<div class="pneu-history"><strong>Recent</strong>${history}</div>` : ''}
            <div class="pneu-reset-done"><button class="pneu-reset-primary" id="pneu-reset-close">Back</button></div>
        `);
        document.getElementById('pneu-reset-close').addEventListener('click', () => this.close());
    };

    ResetSession.prototype.stopMic = function () {
        if (this.micStream) {
            this.micStream.getTracks().forEach((track) => track.stop());
            this.micStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
        }
    };

    ResetSession.prototype.close = function () {
        this.running = false;
        clearInterval(this.timer);
        clearTimeout(this.phaseTimer);
        if (this.onKey) document.removeEventListener('keydown', this.onKey);
        this.stopMic();
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    };

    function mountFromConfig() {
        const config = window.PNEUOMA_RESET;
        if (!config || !config.gameId) return;
        const session = new ResetSession(config);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => session.mount());
        } else {
            session.mount();
        }
    }

    window.PneuomaReset = { mount: function (options) { return new ResetSession(options).mount(); } };
    mountFromConfig();
})();
