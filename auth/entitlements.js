// ============================================
// PNEUOMA Entitlements — Free vs PNEUOMA+
// Shared free list, membership checks, daily session limits
// ============================================

const PneuomaEntitlements = {
    FREE_DAILY_GAME_SESSIONS: 3,
    STORAGE_KEY: 'pneuoma_game_sessions',

    // Selection of free games (basic library)
    FREE_GAMES: [
        'cloudkeeper', 'pulse', 'songbird',  // Ages 4-8
        'aura', 'tidepool', 'echogarden',    // Ages 8-13
        'deep', 'solfege', 'chill',          // Ages 13-18 (basic Solfège)
        'drift', 'reset', 'anchor',         // Ages 18+
        'pitch-match', 'ear-training', 'rhythm-regulation', 'music-breathing'
    ],

    FREE_RITUALS: [
        'morning-rise', 'sleep-descent', 'transition-reset'
    ],

    FREE_MULTIPLAYER: [
        'partners', 'family-circle', 'classroom-sync'
    ],

    MASTER_EMAILS: [
        'camrynjackson@pneuoma.com',
        'camryn@pneuoma.com'
    ],

    todayKey() {
        return new Date().toISOString().slice(0, 10);
    },

    getUser() {
        try {
            const raw = localStorage.getItem('pneuoma_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    isPlus(user = this.getUser()) {
        if (!user) return false;
        if (user.role === 'master' || user.subscription === 'master') return true;
        if (user.isPremium === true) return true;
        const email = (user.email || '').toLowerCase();
        if (this.MASTER_EMAILS.includes(email)) return true;
        const sub = user.subscription;
        return sub === 'premium' ||
            sub === 'plus' ||
            sub === 'family' ||
            sub === 'school';
    },

    isFreeGame(id) {
        return this.FREE_GAMES.includes((id || '').toLowerCase());
    },

    isFreeRitual(id) {
        return this.FREE_RITUALS.includes((id || '').toLowerCase());
    },

    isFreeMultiplayer(id) {
        return this.FREE_MULTIPLAYER.includes((id || '').toLowerCase());
    },

    isFreeContent(type, id) {
        if (type === 'games') return this.isFreeGame(id);
        if (type === 'rituals') return this.isFreeRitual(id);
        if (type === 'multiplayer') return this.isFreeMultiplayer(id);
        return true;
    },

    getSessionUsage() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            const data = raw ? JSON.parse(raw) : null;
            if (!data || data.date !== this.todayKey()) {
                return { date: this.todayKey(), count: 0, ids: [] };
            }
            return data;
        } catch (e) {
            return { date: this.todayKey(), count: 0, ids: [] };
        }
    },

    remainingSessions(user = this.getUser()) {
        if (this.isPlus(user)) return Infinity;
        const usage = this.getSessionUsage();
        return Math.max(0, this.FREE_DAILY_GAME_SESSIONS - usage.count);
    },

    hasSessionQuota(user = this.getUser()) {
        if (this.isPlus(user)) return true;
        return this.remainingSessions(user) > 0;
    },

    // Record one game session for free/guest users
    recordGameSession(gameId) {
        const user = this.getUser();
        if (this.isPlus(user)) return this.getSessionUsage();

        const usage = this.getSessionUsage();
        usage.count += 1;
        if (gameId && !usage.ids.includes(gameId)) {
            usage.ids.push(gameId);
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
        return usage;
    },

    // Unified access decision for a content URL
    evaluateAccess(type, id) {
        const user = this.getUser();
        if (this.isPlus(user)) {
            return { allowed: true, reason: 'plus' };
        }

        if (!this.isFreeContent(type, id)) {
            return { allowed: false, reason: 'plus_required' };
        }

        if (type === 'games' && !this.hasSessionQuota(user)) {
            return { allowed: false, reason: 'session_limit' };
        }

        return { allowed: true, reason: 'free' };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PneuomaEntitlements;
}
