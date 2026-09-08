// ============================================
// PNEUOMA Page Protection — Hard Paywall
// Free selection + 3 game sessions/day vs PNEUOMA+
// ============================================

(function() {
    const FREE_DAILY_GAME_SESSIONS = 3;
    const STORAGE_KEY = 'pneuoma_game_sessions';

    const FREE_CONTENT = {
        games: [
            'cloudkeeper', 'pulse', 'songbird',  // Ages 4-8
            'aura', 'tidepool', 'echogarden',    // Ages 8-13
            'deep', 'solfege', 'chill',          // Ages 13-18 (basic Solfège)
            'drift', 'reset', 'anchor',         // Ages 18+
            // Music regulation cluster wrappers (free)
            'pitch-match', 'ear-training', 'rhythm-regulation', 'music-breathing'
        ],
        rituals: [
            'morning-rise', 'sleep-descent', 'transition-reset'
        ],
        multiplayer: [
            'partners', 'family-circle', 'classroom-sync'
        ]
    };

    function todayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function getUser() {
        try {
            const raw = localStorage.getItem('pneuoma_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function isPlusUser(user) {
        if (!user) return false;
        if (user.role === 'master' || user.subscription === 'master') return true;
        if (user.isPremium === true) return true;
        return user.subscription === 'premium' ||
            user.subscription === 'plus' ||
            user.subscription === 'family' ||
            user.subscription === 'school';
    }

    function getContentFromUrl() {
        const path = window.location.pathname;

        const gameMatch = path.match(/\/games\/([^\/]+)/);
        if (gameMatch) {
            return { type: 'games', id: gameMatch[1].toLowerCase() };
        }

        const ritualMatch = path.match(/\/rituals\/([^\/]+)/);
        if (ritualMatch) {
            return { type: 'rituals', id: ritualMatch[1].toLowerCase() };
        }

        const multiplayerMatch = path.match(/\/multiplayer\/([^\/]+)/);
        if (multiplayerMatch) {
            return { type: 'multiplayer', id: multiplayerMatch[1].toLowerCase() };
        }

        return null;
    }

    function isCurrentContentFree() {
        const content = getContentFromUrl();
        if (!content) return true;

        const freeList = FREE_CONTENT[content.type];
        if (!freeList) return true;

        return freeList.includes(content.id);
    }

    function getSessionUsage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : null;
            if (!data || data.date !== todayKey()) {
                return { date: todayKey(), count: 0, ids: [] };
            }
            return data;
        } catch (e) {
            return { date: todayKey(), count: 0, ids: [] };
        }
    }

    function remainingSessions(user) {
        if (isPlusUser(user)) return Infinity;
        return Math.max(0, FREE_DAILY_GAME_SESSIONS - getSessionUsage().count);
    }

    function recordGameSession(gameId) {
        const user = getUser();
        if (isPlusUser(user)) return;

        const usage = getSessionUsage();
        usage.count += 1;
        if (gameId && !usage.ids.includes(gameId)) {
            usage.ids.push(gameId);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    }

    function evaluateAccess() {
        const content = getContentFromUrl();
        if (!content) return { allowed: true, reason: 'open' };

        const user = getUser();
        if (isPlusUser(user)) return { allowed: true, reason: 'plus', content };

        if (!isCurrentContentFree()) {
            return { allowed: false, reason: 'plus_required', content };
        }

        if (content.type === 'games' && remainingSessions(user) <= 0) {
            return { allowed: false, reason: 'session_limit', content };
        }

        return { allowed: true, reason: 'free', content };
    }

    // Authoritative server check for premium content.
    async function serverConfirmsPremium() {
        const token = localStorage.getItem('pneuoma_token');
        if (!token) return false;
        const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
            ? 'http://localhost:3001'
            : 'https://pneuoma.onrender.com';
        try {
            const res = await fetch(base + '/api/me/subscription', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return false;
            const data = await res.json();
            return !!data.isPremium;
        } catch (e) {
            return null;
        }
    }

    function gateStyles() {
        return `
            #premium-gate-modal {
                position: fixed;
                inset: 0;
                background: rgba(10, 12, 16, 0.98);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                padding: 1rem;
            }
            .gate-content {
                background: linear-gradient(135deg, #161b22, #1c2128);
                border: 1px solid #30363d;
                border-radius: 16px;
                padding: 2.5rem;
                max-width: 440px;
                text-align: center;
                animation: gateSlideIn 0.3s ease;
            }
            @keyframes gateSlideIn {
                from { opacity: 0; transform: scale(0.95) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .gate-icon { font-size: 3.5rem; margin-bottom: 1rem; }
            .gate-content h2 {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 1.75rem;
                color: #e6edf3;
                margin-bottom: 0.75rem;
            }
            .gate-content p {
                color: #8b949e;
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 1.25rem;
            }
            .gate-features {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1.5rem;
                text-align: left;
            }
            .gate-features ul { list-style: none; padding: 0; margin: 0; }
            .gate-features li {
                color: #e6edf3;
                padding: 0.35rem 0;
                font-size: 0.9rem;
            }
            .gate-features li::before { content: '✓ '; color: #64ffda; }
            .gate-price {
                font-size: 2rem;
                font-weight: 700;
                color: #64ffda;
                margin-bottom: 0.25rem;
            }
            .gate-price span {
                font-size: 1rem;
                color: #8b949e;
                font-weight: 400;
            }
            .gate-trial {
                color: #8b949e;
                font-size: 0.85rem;
                margin-bottom: 1.5rem;
            }
            .gate-buttons {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .btn-gate-primary {
                display: block;
                padding: 1rem;
                background: linear-gradient(135deg, #06b6d4, #64ffda);
                color: #0a0c10;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 1rem;
            }
            .btn-gate-secondary {
                display: block;
                padding: 0.75rem;
                color: #8b949e;
                text-decoration: none;
                font-size: 0.9rem;
            }
            .session-chip {
                display: inline-block;
                margin-bottom: 1rem;
                padding: 0.35rem 0.75rem;
                border-radius: 999px;
                background: rgba(245, 158, 11, 0.15);
                color: #f59e0b;
                font-size: 0.85rem;
                font-weight: 600;
            }
        `;
    }

    function showPlusRequiredModal(content) {
        const contentType = content?.type || 'content';
        const label = contentType === 'games' ? 'Game' :
            contentType === 'rituals' ? 'Ritual' : 'Mode';

        const modal = document.createElement('div');
        modal.id = 'premium-gate-modal';
        modal.innerHTML = `
            <style>${gateStyles()}</style>
            <div class="gate-content">
                <div class="gate-icon">🔒</div>
                <h2>PNEUOMA+ ${label}</h2>
                <p>This ${label.toLowerCase()} is part of the full PNEUOMA+ library.</p>
                <div class="gate-features">
                    <ul>
                        <li>Unlimited game sessions</li>
                        <li>Full game + regulation library</li>
                        <li>Full Solfège experiences</li>
                        <li>Permanent progress/history</li>
                        <li>New games/features first</li>
                    </ul>
                </div>
                <div class="gate-price">$9.99<span>/month</span></div>
                <p class="gate-trial">7-day free trial • Cancel anytime</p>
                <div class="gate-buttons">
                    <a href="/auth/subscribe.html" class="btn-gate-primary">Upgrade to PNEUOMA+</a>
                    <a href="/platform/${contentType || 'games'}/" class="btn-gate-secondary">← Browse Free ${label}s</a>
                </div>
            </div>
        `;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);
    }

    function showSessionLimitModal() {
        const modal = document.createElement('div');
        modal.id = 'premium-gate-modal';
        modal.innerHTML = `
            <style>${gateStyles()}</style>
            <div class="gate-content">
                <div class="gate-icon">⏳</div>
                <div class="session-chip">${FREE_DAILY_GAME_SESSIONS} free sessions used today</div>
                <h2>Daily free limit reached</h2>
                <p>PNEUOMA Free includes 3 game sessions per day. Come back tomorrow, or unlock unlimited play with PNEUOMA+.</p>
                <div class="gate-features">
                    <ul>
                        <li>Unlimited games every day</li>
                        <li>Full game library</li>
                        <li>Full regulation + Solfège library</li>
                        <li>Permanent progress/history</li>
                    </ul>
                </div>
                <div class="gate-price">$9.99<span>/month</span></div>
                <p class="gate-trial">7-day free trial • Cancel anytime</p>
                <div class="gate-buttons">
                    <a href="/auth/subscribe.html" class="btn-gate-primary">Upgrade to PNEUOMA+</a>
                    <a href="/platform/games/" class="btn-gate-secondary">← Back to Games</a>
                </div>
            </div>
        `;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);
    }

    function showSessionBadge(remaining) {
        if (!isFinite(remaining)) return;
        const badge = document.createElement('div');
        badge.id = 'pneuoma-session-badge';
        badge.textContent = remaining === 1
            ? '1 free session left today'
            : `${remaining} free sessions left today`;
        badge.style.cssText = `
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 99990;
            background: rgba(10, 12, 16, 0.92);
            border: 1px solid rgba(100, 255, 218, 0.35);
            color: #64ffda;
            font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            padding: 8px 12px;
            border-radius: 999px;
            pointer-events: none;
        `;
        document.body.appendChild(badge);
    }

    function blockNow(reason, content) {
        const show = () => {
            if (reason === 'session_limit') {
                showSessionLimitModal();
            } else {
                showPlusRequiredModal(content);
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', show);
        } else {
            show();
        }
    }

    const result = evaluateAccess();

    if (!result.allowed) {
        blockNow(result.reason, result.content);
    } else {
        if (result.reason === 'free' && result.content?.type === 'games') {
            recordGameSession(result.content.id);
            const left = remainingSessions(getUser());
            const showBadge = () => showSessionBadge(left);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showBadge);
            } else {
                showBadge();
            }
        }

        // Re-verify PNEUOMA+ content with the server so tampered localStorage
        // can't unlock paid experiences. Free content and offline users are unaffected.
        const content = getContentFromUrl();
        if (content && !isCurrentContentFree()) {
            serverConfirmsPremium().then((ok) => {
                if (ok === false) {
                    blockNow('plus_required', content);
                }
            });
        }
    }

    window.PneuomaGate = {
        FREE_CONTENT,
        FREE_DAILY_GAME_SESSIONS,
        isPlus: () => isPlusUser(getUser()),
        remainingSessions: () => remainingSessions(getUser()),
        evaluateAccess
    };
})();
